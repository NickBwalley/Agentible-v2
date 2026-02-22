"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectWithTags } from "@/components/ui/MultiSelectWithTags";

const COUNTRIES = [
  "United States",
  "Canada",
  "Australia",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "UAE",
  "Saudi Arabia",
  "India",
  "Japan",
  "Singapore",
  "South Korea",
  "China",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Mexico",
  "Argentina",
];

const JOB_TITLES = [
  "Founder",
  "Director",
  "Founder & CEO",
  "Director Of Sales",
  "Co-Founder & CEO",
  "Executive",
  "Head Of Marketing",
  "Business Development Executive",
  "Executive Assistant",
  "Chief Executive Officer",
  "Chief Operations Officer",
  "Executive Director",
  "Chief Technical Officer",
  "Director Of Sales",
  "Business Development Executive",
  "Manager",
  "General Manager",
  "Consultant",
];

const EMPLOYEE_RANGES = [
  "1-10",
  "11-20",
  "21-50",
  "51-100",
  "101-200",
  "201-500",
  "501-1000",
  "1001-2000",
  "2001-5000",
  "5001-10000",
  "10001+",
];

// Allowed industry values (technology & software only, from API allowed list)
const INDUSTRY_OPTIONS = [
  "Animation",
  "Biotechnology",
  "Computer & Network Security",
  "Computer Games",
  "Computer Hardware",
  "Computer Networking",
  "Computer Software",
  "Consumer Electronics",
  "Defense & Space",
  "Design",
  "E-Learning",
  "Electrical/Electronic Manufacturing",
  "Graphic Design",
  "Industrial Automation",
  "Information Services",
  "Information Technology & Services",
  "Internet",
  "Medical Devices",
  "Nanotechnology",
  "Online Media",
  "Program Development",
  "Research",
  "Semiconductors",
  "Telecommunications",
  "Translation & Localization",
  "Wireless",
];

const TOTAL_STEPS = 5;

const N8N_WEBHOOK_URL =
  "https://n8n.srv1036993.hstgr.cloud/webhook/agentible-generate-leads";

/** GET URL for campaign status (optional). If not set, status is read from Supabase campaigns.status. */
const N8N_STATUS_GET_URL =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_N8N_STATUS_GET_URL ?? "")
    : "";

const MAX_LEADS_MIN = 100;
const MAX_LEADS_MAX = 1000;

const ICP_TEMPLATE = `Example:
- Who: Founders/COOs at B2B SaaS companies (10–50 employees) in US/AU
- Pain: manual lead qualification, slow follow-up, low booked meetings
- Current tools: HubSpot/Salesforce, Apollo, Outreach
- Exclusions: agencies, consultants`;

const OFFER_TEMPLATE = `Example:
- Outcome: 'Book 10–20 qualified meetings/month'
- How: 'Inbox-safe outbound + verified leads + personalized sequences'
- Proof: 'Past: X meetings in Y days (or replace with your proof)'
- CTA: 'Open to a 15-min call this week?'`;

const EMAIL_PLACEHOLDERS = [
  "Structure:\n1) 1-line relevance (why them)\n2) 1-line problem\n3) 1-line offer\n4) 1-line CTA",
  "Short bump + question",
  "New angle or proof",
  "Break-up / last touch",
];

// --- Campaign + lead generation (Supabase + n8n webhook) ---

type CreateCampaignResult = { campaignId: string } | { error: string };

async function createCampaign(
  supabase: SupabaseClient,
  userId: string,
  name?: string | null,
): Promise<CreateCampaignResult> {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: userId,
      name: name ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }
  if (!data?.id) {
    return { error: "Campaign created but no id returned" };
  }
  return { campaignId: data.id };
}

type CreateLeadBatchResult = { leadBatchId: string } | { error: string };

async function createLeadBatch(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  queryOrSource?: string | null,
): Promise<CreateLeadBatchResult> {
  const { data, error } = await supabase
    .from("lead_batches")
    .insert({
      user_id: userId,
      campaign_id: campaignId,
      query_or_source: queryOrSource ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }
  if (!data?.id) {
    return { error: "Lead batch created but no id returned" };
  }
  return { leadBatchId: data.id };
}

// Parse one CSV line (handles quoted commas)
function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cell.trim().replace(/^"|"$/g, ""));
      cell = "";
    } else {
      cell += c;
    }
  }
  out.push(cell.trim().replace(/^"|"$/g, ""));
  return out;
}

function normalizeHeaderForMap(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, " ");
}

// CSV header variants (normalized) -> DB field
type CsvDbKey =
  | "email"
  | "first_name"
  | "last_name"
  | "full_name"
  | "position"
  | "org_name"
  | "org_description"
  | "linkedin_url"
  | "country"
  | "org_website";
const CSV_TO_DB_MAP: { dbKey: CsvDbKey; aliases: string[] }[] = [
  { dbKey: "email", aliases: ["email"] },
  { dbKey: "first_name", aliases: ["first_name", "first name", "firstname"] },
  { dbKey: "last_name", aliases: ["last_name", "last name", "lastname"] },
  { dbKey: "full_name", aliases: ["full_name", "full name", "fullname"] },
  { dbKey: "position", aliases: ["position", "title"] },
  {
    dbKey: "org_name",
    aliases: [
      "org_name",
      "org name",
      "orgname",
      "organization name",
      "organizationname",
    ],
  },
  { dbKey: "org_description", aliases: ["org_description", "org description"] },
  { dbKey: "linkedin_url", aliases: ["linkedin_url", "linkedin url"] },
  { dbKey: "country", aliases: ["country"] },
  { dbKey: "org_website", aliases: ["org_website", "org website", "website"] },
];

type LeadInsertRow = {
  user_id: string;
  lead_batch_id: string;
  campaign_id: string;
  full_name: string | null;
  email: string;
  email_status: string;
  position?: string | null;
  org_name?: string | null;
  org_description?: string | null;
  linkedin_url?: string | null;
  country?: string | null;
  org_website?: string | null;
};

async function parseFullCsv(
  file: File,
): Promise<{ headers: string[]; rows: string[][] }> {
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvRow(lines[0]);
  const rows = lines.slice(1).map(parseCsvRow);
  return { headers, rows };
}

function mapCsvRowToLead(
  row: string[],
  headerToIndex: Map<string, number>,
  userId: string,
  leadBatchId: string,
  campaignId: string,
): LeadInsertRow | null {
  const get = (key: CsvDbKey): string => {
    const aliases = CSV_TO_DB_MAP.find((m) => m.dbKey === key)?.aliases ?? [];
    for (const alias of aliases) {
      const idx = headerToIndex.get(normalizeHeaderForMap(alias));
      if (idx !== undefined && row[idx] !== undefined)
        return (row[idx] ?? "").trim();
    }
    return "";
  };
  const email = get("email").trim();
  if (!email) return null;

  let full_name: string | null = get("full_name") || null;
  if (!full_name) {
    const first = get("first_name");
    const last = get("last_name");
    if (first || last)
      full_name = [first, last].filter(Boolean).join(" ").trim() || null;
  }

  const position = get("position") || null;
  const org_name = get("org_name") || null;
  const org_description = get("org_description") || null;
  const linkedin_url = get("linkedin_url") || null;
  const country = get("country") || null;
  const org_website = get("org_website") || null;

  return {
    user_id: userId,
    lead_batch_id: leadBatchId,
    campaign_id: campaignId,
    full_name: full_name || null,
    email,
    email_status: "unknown",
    ...(position && { position }),
    ...(org_name && { org_name }),
    ...(org_description && { org_description }),
    ...(linkedin_url && { linkedin_url }),
    ...(country && { country }),
    ...(org_website && { org_website }),
  };
}

type InsertLeadsFromCsvResult =
  | { ok: true; inserted: number }
  | { error: string };

async function insertLeadsFromCsv(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  leadBatchId: string,
  file: File,
): Promise<InsertLeadsFromCsvResult> {
  const { headers, rows } = await parseFullCsv(file);
  const normalizedHeaders = headers.map(normalizeHeaderForMap);
  const headerToIndex = new Map<string, number>();
  normalizedHeaders.forEach((h, i) => headerToIndex.set(h, i));

  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const leads: LeadInsertRow[] = [];
    for (const row of chunk) {
      const lead = mapCsvRowToLead(
        row,
        headerToIndex,
        userId,
        leadBatchId,
        campaignId,
      );
      if (lead) leads.push(lead);
    }
    if (leads.length > 0) {
      const { error } = await supabase.from("leads").insert(leads);
      if (error) return { error: error.message };
      inserted += leads.length;
    }
  }
  return { ok: true, inserted };
}

type TriggerLeadGenerationResult =
  | { ok: true; message: string; campaign_id: string; lead_batch_id: string }
  | { error: string };

async function triggerLeadGeneration(
  body: Record<string, unknown>,
  existingCampaignId?: string | null,
): Promise<TriggerLeadGenerationResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    return { error: authError.message };
  }
  if (!user?.id) {
    return { error: "You must be signed in to fetch leads" };
  }

  let campaignId: string;
  if (existingCampaignId) {
    campaignId = existingCampaignId;
  } else {
    const campaignResult = await createCampaign(supabase, user.id);
    if ("error" in campaignResult) {
      return { error: campaignResult.error };
    }
    campaignId = campaignResult.campaignId;
  }

  const batchResult = await createLeadBatch(
    supabase,
    user.id,
    campaignId,
    typeof body.query_or_source === "string" ? body.query_or_source : null,
  );
  if ("error" in batchResult) {
    return { error: batchResult.error };
  }

  const payload = {
    user_id: user.id,
    campaign_id: campaignId,
    lead_batch_id: batchResult.leadBatchId,
    ...body,
  };

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const text =
        json &&
        typeof json === "object" &&
        "message" in json &&
        typeof (json as { message: unknown }).message === "string"
          ? (json as { message: string }).message
          : typeof json === "string"
            ? json
            : null;
      return {
        error: text || `Webhook responded with ${res.status}`,
      };
    }
    const message =
      json &&
      typeof json === "object" &&
      "message" in json &&
      typeof (json as { message: unknown }).message === "string"
        ? (json as { message: string }).message
        : "Leads request received.";
    return {
      ok: true,
      message,
      campaign_id: campaignId,
      lead_batch_id: batchResult.leadBatchId,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to send request. Please try again.",
    };
  }
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [leadSource, setLeadSource] = useState<"import" | "create" | null>(
    null,
  );
  const [formData, setFormData] = useState({
    csvFile: null as File | null,
    icp: "",
    offer: "",
    emails: ["", "", "", ""],
    // Lead generation (Apollo) fields
    targetLocations: [] as string[],
    jobTitles: [] as string[],
    employeeRanges: [] as string[],
    industryKeywords: [] as string[],
    maxLeadsToFetch: 100,
  });
  const [leadsApproved, setLeadsApproved] = useState(false);
  const [createCampaignLoading, setCreateCampaignLoading] = useState(false);
  const [fetchLeadsError, setFetchLeadsError] = useState<string | null>(null);
  const [fetchLeadsResult, setFetchLeadsResult] = useState<{
    message: string;
    campaign_id: string;
    lead_batch_id?: string;
  } | null>(null);
  const [acknowledgedLeadsRequest, setAcknowledgedLeadsRequest] =
    useState(false);
  const [detectedCsvColumns, setDetectedCsvColumns] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(
    null,
  );
  // Launch step: campaign status from webhook GET or Supabase
  const [campaignStatus, setCampaignStatus] = useState<
    "pending" | "completed" | null
  >(null);
  const [campaignStatusMessage, setCampaignStatusMessage] = useState<
    string | null
  >(null);
  const [campaignStatusLoading, setCampaignStatusLoading] = useState(false);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Campaign + leads fetch (step 7): campaign_id + user_id match, verified count, preview/download
  type LeadRow = {
    id: string;
    full_name: string | null;
    email: string;
    email_status: string;
    position: string | null;
    country: string | null;
    org_name: string | null;
    org_website: string | null;
  };
  const [campaignLeads, setCampaignLeads] = useState<LeadRow[]>([]);
  const [verifiedLeadsCount, setVerifiedLeadsCount] = useState<number | null>(
    null,
  );
  const [campaignDataFetched, setCampaignDataFetched] = useState(false);
  const [leadsPreviewOpen, setLeadsPreviewOpen] = useState(false);
  const [campaignDataLoading, setCampaignDataLoading] = useState(false);
  // Launch checklist (sendingAccountConnected can be wired to real account check)
  const [sendingAccountConnected] = useState(true);
  // AI email modal
  const [aiEmailModalOpen, setAiEmailModalOpen] = useState(false);
  const [aiTone, setAiTone] = useState<"Professional" | "Friendly" | "Direct">(
    "Professional",
  );
  const [aiLength, setAiLength] = useState<"Short" | "Medium">("Short");
  const [aiCtaStyle, setAiCtaStyle] = useState<"Soft ask" | "Direct calendar">(
    "Soft ask",
  );
  // Mock preview rows for Review step
  const previewRows = [
    {
      name: "Jane Smith",
      title: "CEO",
      company: "Acme Inc",
      email: "jane@acme.com",
      emailStatus: "Valid",
      phone: "+1 555-0100",
      website: "acme.com",
    },
    {
      name: "John Doe",
      title: "Founder",
      company: "TechStart",
      email: "john@techstart.io",
      emailStatus: "Valid",
      phone: "",
      website: "techstart.io",
    },
    {
      name: "Alex Lee",
      title: "COO",
      company: "ScaleUp",
      email: "alex@scaleup.com",
      emailStatus: "Valid",
      phone: "+1 555-0102",
      website: "scaleup.com",
    },
  ];

  // Normalize CSV header for comparison (lowercase, trim, single spaces). Case-insensitive.
  const normalizeHeader = (h: string) =>
    h.toLowerCase().trim().replace(/\s+/g, " ");

  // Required: 3 minimum — name (one of first/last/full), email, org. Any casing accepted.
  const REQUIRED_CSV_GROUPS: string[][] = [
    [
      "first_name",
      "first name",
      "firstname",
      "last_name",
      "last name",
      "lastname",
      "full_name",
      "full name",
      "fullname",
    ], // name: first_name, last_name, or full_name
    ["email"],
    ["organization name", "organizationname", "orgname", "org name"], // orgName, organizationName
  ];

  const validateCsvColumns = (
    headers: string[],
  ): { valid: boolean; missing: string[] } => {
    const normalized = new Set(headers.map((h) => normalizeHeader(h)));
    const missing: string[] = [];
    const groupLabels = [
      "name (first_name, last_name, or full_name)",
      "email",
      "orgName / organizationName",
    ];
    REQUIRED_CSV_GROUPS.forEach((group, i) => {
      const hasAny = group.some((alias) =>
        normalized.has(normalizeHeader(alias)),
      );
      if (!hasAny) missing.push(groupLabels[i]);
    });
    return { valid: missing.length === 0, missing };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvValidationError(null);
    if (file) {
      setFormData((prev) => ({ ...prev, csvFile: file }));
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) ?? "";
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length > 0) {
          const headers = parseCsvRow(lines[0]);
          setDetectedCsvColumns(headers);
          const rows = lines.slice(1, 101).map(parseCsvRow);
          setCsvPreviewRows(rows);
        } else {
          setDetectedCsvColumns([]);
          setCsvPreviewRows([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const handleGoToPreview = () => {
    setFetchLeadsError(null);
    setStep(3);
  };

  const buildLeadGenBody = () => ({
    companyDomainMatchMode: "contains",
    emailStatus: "verified",
    hasEmail: true,
    hasPhone: false,
    includeSimilarTitles: false,
    resetSavedProgress: false,
    companyLocationCountryIncludes: formData.targetLocations,
    personLocationCountryIncludes: formData.targetLocations,
    personTitleIncludes: formData.jobTitles,
    companySizeIncludes: formData.employeeRanges,
    companyIndustryIncludes: formData.industryKeywords,
    totalResults: formData.maxLeadsToFetch,
  });

  const handleGenerateAiEmails = () => {
    setFormData({
      ...formData,
      emails: [
        "Hi {{first_name}}, we help B2B teams like {{company}} book more qualified meetings. Quick question — open to a 15-min call this week?",
        "Bumping this — would a short intro call work?",
        "One more angle: we've seen similar teams get 10–20 meetings/month. Worth a quick look?",
        "Last note from my side. If timing changes, we're here.",
      ],
    });
    setAiEmailModalOpen(false);
  };

  const handleSubmit = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      router.push("/dashboard");
      return;
    }
    if (campaignId) {
      router.push(`/dashboard/campaigns/${campaignId}`);
      return;
    }
    setCreateCampaignLoading(true);
    setFetchLeadsError(null);
    try {
      const createResult = await createCampaign(
        supabase,
        user.id,
        campaignName.trim() || null,
      );
      if ("error" in createResult) {
        setFetchLeadsError(createResult.error);
        return;
      }
      if (leadSource === "create") {
        const leadGenBody = buildLeadGenBody();
        const result = await triggerLeadGeneration(
          leadGenBody,
          createResult.campaignId,
        );
        if ("error" in result) {
          setFetchLeadsError(result.error);
          return;
        }
      } else if (leadSource === "import" && formData.csvFile) {
        const batchResult = await createLeadBatch(
          supabase,
          user.id,
          createResult.campaignId,
          formData.csvFile.name,
        );
        if ("error" in batchResult) {
          setFetchLeadsError(batchResult.error);
          return;
        }
        const insertResult = await insertLeadsFromCsv(
          supabase,
          user.id,
          createResult.campaignId,
          batchResult.leadBatchId,
          formData.csvFile,
        );
        if ("error" in insertResult) {
          setFetchLeadsError(insertResult.error);
          return;
        }
      }
      router.push(`/dashboard/campaigns/${createResult.campaignId}`);
    } finally {
      setCreateCampaignLoading(false);
    }
  };

  const canFetchLeads = (): boolean => {
    if (leadSource !== "create") return false;
    return (
      formData.targetLocations.length >= 1 &&
      formData.jobTitles.length >= 1 &&
      formData.employeeRanges.length >= 1 &&
      formData.industryKeywords.length >= 1 &&
      formData.maxLeadsToFetch >= MAX_LEADS_MIN &&
      formData.maxLeadsToFetch <= MAX_LEADS_MAX
    );
  };

  const canProceedFromStep1 = () => {
    if (leadSource === "import") {
      return !!formData.csvFile;
    } else if (leadSource === "create") {
      return canFetchLeads();
    }
    return false;
  };

  // When on Launch step with a campaign_id, fetch status (GET webhook or Supabase) until completed (kept for future launch flow)
  useEffect(() => {
    const campaignId = fetchLeadsResult?.campaign_id;
    if (step !== 4 || !campaignId) {
      if (campaignId == null) {
        setCampaignStatus(null);
        setCampaignStatusMessage(null);
      }
      return;
    }

    const fetchStatus = async () => {
      setCampaignStatusLoading(true);
      try {
        if (N8N_STATUS_GET_URL) {
          const url = `${N8N_STATUS_GET_URL}${N8N_STATUS_GET_URL.includes("?") ? "&" : "?"}campaign_id=${encodeURIComponent(campaignId)}`;
          const res = await fetch(url, { method: "GET" });
          const json = await res.json().catch(() => null);
          const status =
            json && typeof json === "object" && "status" in json
              ? String((json as { status: unknown }).status).toLowerCase()
              : "";
          const message =
            json &&
            typeof json === "object" &&
            "message" in json &&
            typeof (json as { message: unknown }).message === "string"
              ? (json as { message: string }).message
              : null;
          if (status === "completed" || status === "done") {
            setCampaignStatus("completed");
            setCampaignStatusMessage(
              message ?? "Campaign processing completed.",
            );
            if (statusPollRef.current) {
              clearInterval(statusPollRef.current);
              statusPollRef.current = null;
            }
          } else if (message) {
            setCampaignStatusMessage(message);
          }
        } else {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("campaigns")
            .select("status")
            .eq("id", campaignId)
            .single();
          if (!error && data?.status === "done") {
            setCampaignStatus("completed");
            setCampaignStatusMessage("Campaign processing completed.");
            if (statusPollRef.current) {
              clearInterval(statusPollRef.current);
              statusPollRef.current = null;
            }
          }
        }
      } finally {
        setCampaignStatusLoading(false);
      }
    };

    setCampaignStatus("pending");
    fetchStatus();
    statusPollRef.current = setInterval(fetchStatus, 4000);

    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
    };
  }, [step, fetchLeadsResult?.campaign_id]);

  const fetchLeadsFromDb = async () => {
    const campaignId = fetchLeadsResult?.campaign_id;
    if (!campaignId) return;
    setCampaignDataLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCampaignDataLoading(false);
        return;
      }

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (campaignError || !campaign) {
        setCampaignDataLoading(false);
        return;
      }

      // Resolve lead_batch_id: use stored from lead-gen flow, or latest batch for this campaign + user
      let leadBatchId: string | null = fetchLeadsResult?.lead_batch_id ?? null;
      if (!leadBatchId) {
        const { data: batch } = await supabase
          .from("lead_batches")
          .select("id")
          .eq("user_id", user.id)
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        leadBatchId = batch?.id ?? null;
      }

      // Fetch leads by user_id, campaign_id, and lead_batch_id for exact count and list
      let leadsQuery = supabase
        .from("leads")
        .select(
          "id, full_name, email, email_status, position, country, org_name, org_website",
        )
        .eq("user_id", user.id)
        .eq("campaign_id", campaignId);

      if (leadBatchId) {
        leadsQuery = leadsQuery.eq("lead_batch_id", leadBatchId);
      }

      const { data: leads, error: leadsError } = await leadsQuery;

      if (leadsError) {
        setCampaignDataLoading(false);
        return;
      }

      const rows: LeadRow[] = (leads ?? []).map((l) => ({
        id: l.id,
        full_name: l.full_name ?? null,
        email: l.email,
        email_status: l.email_status ?? "unknown",
        position: l.position ?? null,
        country: l.country ?? null,
        org_name: l.org_name ?? null,
        org_website: l.org_website ?? null,
      }));

      const verified = rows.filter((r) => r.email_status === "valid").length;
      setCampaignLeads(rows);
      setVerifiedLeadsCount(verified);

      await supabase
        .from("campaigns")
        .update({ status: "done" })
        .eq("id", campaignId)
        .eq("user_id", user.id);

      setCampaignDataFetched(true);
    } finally {
      setCampaignDataLoading(false);
    }
  };

  const downloadLeadsCsv = () => {
    if (campaignLeads.length === 0) return;
    const headers = [
      "full_name",
      "email",
      "email_status",
      "position",
      "country",
      "org_name",
      "org_website",
    ];
    const escape = (v: string | null) =>
      v == null
        ? ""
        : /[,"\n]/.test(v)
          ? `"${String(v).replace(/"/g, '""')}"`
          : v;
    const rows = campaignLeads.map((l) =>
      [
        escape(l.full_name),
        escape(l.email),
        escape(l.email_status),
        escape(l.position),
        escape(l.country),
        escape(l.org_name),
        escape(l.org_website),
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-leads-${fetchLeadsResult?.campaign_id ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Campaign
          </h1>
          <p className="text-white/60">
            Set up your outbound campaign in minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  s <= step
                    ? "bg-[#2563EB] text-white"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {s + 1}
              </div>
              {s < TOTAL_STEPS - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    s < step ? "bg-[#2563EB]" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 md:p-8">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Name your campaign
              </h2>
              <p className="text-white/70 mb-6 text-sm">
                Enter a name so you can track this campaign and its metrics
                easily.
              </p>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label
                    htmlFor="campaign-name"
                    className="text-white/90 mb-2 block"
                  >
                    Campaign name
                  </Label>
                  <Input
                    id="campaign-name"
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q1 Enterprise Outreach"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (!campaignName.trim()) return;
                    setFetchLeadsError(null);
                    setStep(1);
                  }}
                  disabled={!campaignName.trim()}
                  className="w-full"
                >
                  Next: Choose lead source
                </Button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                How would you like to get leads?
              </h2>
              <p className="text-white/70 mb-6 text-sm">
                Upload your own list or generate targeted leads from our
                criteria.
              </p>
              <div className="space-y-4 mb-6">
                <label className="flex items-start gap-4 p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="leadSource"
                    value="import"
                    checked={leadSource === "import"}
                    onChange={() => setLeadSource("import")}
                    className="mt-1 w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      Upload leads (CSV)
                    </div>
                    <div className="text-sm text-white/60">
                      Use your existing list. You’ll preview it before creating
                      the campaign.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="leadSource"
                    value="create"
                    checked={leadSource === "create"}
                    onChange={() => setLeadSource("create")}
                    className="mt-1 w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      Generate leads (Apollo)
                    </div>
                    <div className="text-sm text-white/60">
                      We’ll fetch leads by location, job titles, and company
                      size. Then you preview and can download before creating.
                    </div>
                  </div>
                </label>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(0)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setStep(2)}
                  disabled={leadSource === null}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload CSV (import) OR Generate leads (create) */}
          {step === 2 && (
            <div>
              {leadSource === "import" ? (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => setStep(1)}
                      className="text-sm text-white/60 hover:text-white mb-4 inline-flex items-center gap-1"
                    >
                      ← Back
                    </button>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      Upload CSV Leads
                    </h2>
                    <p className="text-white/60 text-sm">
                      Next you’ll preview how it looks, then create the
                      campaign.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
                    <p className="text-sm font-medium text-white/90 mb-2">
                      CSV requirements
                    </p>
                    <ul className="text-xs text-white/70 space-y-1">
                      <li>
                        <strong className="text-white/90">
                          Required (3 minimum):
                        </strong>{" "}
                        name (first_name, last_name, or full_name), email,
                        orgName (or organizationName)
                      </li>
                      <li>
                        <strong className="text-white/90">Recommended:</strong>{" "}
                        title/position, linkedin_url, org_description
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv" className="text-white/90 mb-2 block">
                        Upload CSV File
                      </Label>
                      <div className="relative flex items-center">
                        <Input
                          id="csv"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="block w-full text-white/90 opacity-0 absolute left-0 top-0 bottom-0 right-0 cursor-pointer z-10"
                          style={{ height: "44px" }}
                        />
                        <label
                          htmlFor="csv"
                          className="flex items-center justify-center file:hidden w-full px-4 py-2 rounded-lg font-semibold text-sm bg-[#2563EB] text-white cursor-pointer hover:bg-[#1d4ed8] transition-colors border-0 min-h-[44px] z-0"
                        >
                          <svg
                            className="h-5 w-5 mr-2 opacity-80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Upload CSV File
                        </label>
                      </div>
                      {formData.csvFile && (
                        <p className="mt-2 text-sm text-white/60">
                          Selected: {formData.csvFile.name}
                        </p>
                      )}
                      {detectedCsvColumns.length > 0 && (
                        <p className="mt-2 text-xs text-white/60">
                          Detected columns: {detectedCsvColumns.join(", ")}
                        </p>
                      )}
                      {csvValidationError && (
                        <p className="mt-2 text-sm text-red-400" role="alert">
                          {csvValidationError}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          if (!formData.csvFile) return;
                          const { valid, missing } =
                            validateCsvColumns(detectedCsvColumns);
                          if (!valid) {
                            setCsvValidationError(
                              `Missing required columns: ${missing.join(", ")}. Please add these columns to your CSV.`,
                            );
                            return;
                          }
                          setCsvValidationError(null);
                          setStep(3);
                        }}
                        disabled={!formData.csvFile}
                        className="flex-1"
                      >
                        Next: Preview
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => setStep(1)}
                      className="text-sm text-white/60 hover:text-white mb-4 inline-flex items-center gap-1"
                    >
                      ← Back
                    </button>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      Generate leads
                    </h2>
                    <p className="text-white/60 text-sm mb-6">
                      Set your criteria. We’ll fetch leads, then you can preview
                      and download before creating the campaign.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <MultiSelectWithTags
                      label="Target location (at least 1 country)"
                      options={COUNTRIES}
                      value={formData.targetLocations}
                      onChange={(targetLocations) =>
                        setFormData({ ...formData, targetLocations })
                      }
                      placeholder="Select country or region(s)"
                    />
                    <MultiSelectWithTags
                      label="Job titles (at least 1)"
                      options={JOB_TITLES}
                      value={formData.jobTitles}
                      onChange={(jobTitles) =>
                        setFormData({ ...formData, jobTitles })
                      }
                      placeholder="Select job title(s)"
                    />
                    <MultiSelectWithTags
                      label="Company size (at least one)"
                      options={EMPLOYEE_RANGES}
                      value={formData.employeeRanges}
                      onChange={(employeeRanges) =>
                        setFormData({ ...formData, employeeRanges })
                      }
                      placeholder="Select employee range(s)"
                    />
                    <MultiSelectWithTags
                      label="Industry (at least 1) — technology & software"
                      options={INDUSTRY_OPTIONS}
                      value={formData.industryKeywords}
                      onChange={(industryKeywords) =>
                        setFormData({ ...formData, industryKeywords })
                      }
                      placeholder="Select industry / industries"
                    />
                    <div>
                      <Label
                        htmlFor="maxLeads"
                        className="text-white/90 mb-2 block"
                      >
                        Max leads to fetch
                      </Label>
                      <Input
                        id="maxLeads"
                        type="number"
                        min={MAX_LEADS_MIN}
                        max={MAX_LEADS_MAX}
                        value={formData.maxLeadsToFetch}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxLeadsToFetch: Math.min(
                              MAX_LEADS_MAX,
                              Math.max(
                                MAX_LEADS_MIN,
                                parseInt(e.target.value, 10) || MAX_LEADS_MIN,
                              ),
                            ),
                          })
                        }
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-white/60">
                        Min {MAX_LEADS_MIN}, max {MAX_LEADS_MAX}.
                      </p>
                    </div>
                    {fetchLeadsError && (
                      <p className="text-sm text-red-400" role="alert">
                        {fetchLeadsError}
                      </p>
                    )}
                    <div className="flex gap-4">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleGoToPreview}
                        disabled={!canFetchLeads()}
                        className="flex-1"
                      >
                        Next: Preview
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Preview (CSV or generated leads) */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-white/60 hover:text-white mb-4 inline-flex items-center gap-1"
                >
                  ← Back
                </button>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {leadSource === "import"
                    ? "Preview your CSV"
                    : "Preview leads"}
                </h2>
                <p className="text-white/60 text-sm">
                  {leadSource === "import"
                    ? "Check how your upload looks. You can download a copy, then create the campaign."
                    : "Review your criteria. Leads will be generated after you create the campaign."}
                </p>
              </div>

              {leadSource === "import" ? (
                <>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
                    <p className="text-sm font-medium text-white/90 mb-2">
                      {formData.csvFile?.name ?? "CSV"} —{" "}
                      {csvPreviewRows.length} rows (preview)
                    </p>
                    {detectedCsvColumns.length > 0 && (
                      <div className="overflow-x-auto rounded border border-white/10 max-h-64 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-white/5 text-white/80 sticky top-0">
                            <tr>
                              {detectedCsvColumns.map((h, i) => (
                                <th
                                  key={i}
                                  className="px-3 py-2 whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-white/90">
                            {csvPreviewRows.slice(0, 20).map((row, ri) => (
                              <tr key={ri} className="border-t border-white/10">
                                {row.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate"
                                  >
                                    {cell || "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {csvPreviewRows.length > 20 && (
                      <p className="mt-2 text-xs text-white/50">
                        Showing first 20 of {csvPreviewRows.length} rows
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setStep(4)}
                      className="flex-1"
                    >
                      Next: Create campaign
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
                    <p className="text-sm font-medium text-white/90 mb-2">
                      Your criteria
                    </p>
                    <div className="text-sm text-white/70 space-y-1">
                      <p>
                        <strong className="text-white/90">Locations:</strong>{" "}
                        {formData.targetLocations.join(", ") || "—"}
                      </p>
                      <p>
                        <strong className="text-white/90">Job titles:</strong>{" "}
                        {formData.jobTitles.join(", ") || "—"}
                      </p>
                      <p>
                        <strong className="text-white/90">Company size:</strong>{" "}
                        {formData.employeeRanges.join(", ") || "—"}
                      </p>
                      <p>
                        <strong className="text-white/90">Industries:</strong>{" "}
                        {formData.industryKeywords.join(", ") || "—"}
                      </p>
                      <p>
                        <strong className="text-white/90">Max leads:</strong>{" "}
                        {formData.maxLeadsToFetch}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-white/60">
                      Leads will be generated when you click Create campaign.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setStep(4)}
                      className="flex-1"
                    >
                      Next: Create campaign
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Create campaign
              </h2>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 mb-6">
                <div className="text-sm text-white/70">
                  <strong className="text-white">Campaign:</strong>{" "}
                  {campaignName || "Unnamed"}
                </div>
                {leadSource === "import" ? (
                  <div className="text-sm text-white/70">
                    <strong className="text-white">Leads:</strong> CSV —{" "}
                    {formData.csvFile?.name ?? "File selected"}
                  </div>
                ) : (
                  <div className="text-sm text-white/70">
                    <strong className="text-white">Leads:</strong> Generated
                    {formData.targetLocations.length > 0 && (
                      <> — {formData.targetLocations.join(", ")}</>
                    )}
                  </div>
                )}
              </div>
              {fetchLeadsError && (
                <p className="mb-4 text-sm text-red-400" role="alert">
                  {fetchLeadsError}
                </p>
              )}
              {createCampaignLoading && (
                <div
                  className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-3"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm font-medium text-amber-200">
                    {leadSource === "create"
                      ? "This may take 2–5 minutes depending on how many leads we're generating. Please stay on this page — we're creating your campaign and generating your leads."
                      : "Creating your campaign…"}
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={createCampaignLoading}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setFetchLeadsError(null);
                    void handleSubmit();
                  }}
                  disabled={createCampaignLoading}
                  className="flex-1"
                >
                  {createCampaignLoading ? "Please wait…" : "Create campaign"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
