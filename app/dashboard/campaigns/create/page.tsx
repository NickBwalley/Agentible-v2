"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const TOTAL_STEPS = 7;

const N8N_WEBHOOK_URL =
  "https://n8n.srv1036993.hstgr.cloud/webhook-test/agentible-webapp";

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

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
  // Review & Approve Leads (Step 3)
  const [reviewCounts, setReviewCounts] = useState({
    fetched: 320,
    duplicatesRemoved: 12,
    valid: 280,
    risky: 18,
    invalid: 8,
    missingFields: 2,
  });
  const [includeValidOnly, setIncludeValidOnly] = useState(true);
  const [includeRisky, setIncludeRisky] = useState(false);
  const [excludeRoleBasedEmails, setExcludeRoleBasedEmails] = useState(true);
  const [excludeFreeEmailDomains, setExcludeFreeEmailDomains] = useState(true);
  const [leadsApproved, setLeadsApproved] = useState(false);
  const [fetchLeadsLoading, setFetchLeadsLoading] = useState(false);
  const [fetchLeadsError, setFetchLeadsError] = useState<string | null>(null);
  const [detectedCsvColumns, setDetectedCsvColumns] = useState<string[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, csvFile: file });
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const firstLine = text.split("\n")[0];
        if (firstLine) {
          setDetectedCsvColumns(
            firstLine.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
          );
        }
      };
      reader.readAsText(file.slice(0, 1024));
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const handleFetchLeads = async () => {
    setFetchLeadsError(null);
    setFetchLeadsLoading(true);
    try {
      const payload = {
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
      };
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Webhook responded with ${res.status}`);
      }
      setStep(3);
    } catch (err) {
      setFetchLeadsError(
        err instanceof Error
          ? err.message
          : "Failed to send request. Please try again.",
      );
    } finally {
      setFetchLeadsLoading(false);
    }
  };

  const handleUseSelectedLeads = () => {
    setLeadsApproved(true);
    setStep(4);
  };

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

  const handleSubmit = () => {
    // Handle campaign creation
    console.log("Creating campaign:", formData);
    router.push("/dashboard");
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

  const canLaunch = () =>
    leadsApproved &&
    formData.emails.filter((e) => e.trim()).length >= 3 &&
    sendingAccountConnected;

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
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  s <= step
                    ? "bg-[#2563EB] text-white"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {s}
              </div>
              {s < TOTAL_STEPS && (
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
          {step === 1 && (
            <div>
              {leadSource === null ? (
                <>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    How would you like to get started?
                  </h2>
                  <p className="text-white/70 mb-6 text-sm">
                    Do you already have a list of leads, or would you like us to
                    help you find and create targeted leads?
                  </p>
                  <div className="space-y-4">
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
                          Yes, import my own leads (CSV)
                        </div>
                        <div className="text-sm text-white/60 mb-1">
                          Upload a CSV with your existing list. Next you’ll
                          review and clean the data before launching.
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
                          No, create leads from scratch (Apollo)
                        </div>
                        <div className="text-sm text-white/60 mb-1">
                          We’ll fetch leads based on your criteria (location,
                          titles, company size, etc.), then you review and
                          approve before launching.
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              ) : leadSource === "import" ? (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => setLeadSource(null)}
                      className="text-sm text-white/60 hover:text-white mb-4 inline-flex items-center gap-1"
                    >
                      ← Back to options
                    </button>
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Upload CSV Leads
                    </h2>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
                    <p className="text-sm font-medium text-white/90 mb-2">
                      CSV requirements
                    </p>
                    <ul className="text-xs text-white/70 space-y-1">
                      <li>
                        <strong className="text-white/90">Required:</strong>{" "}
                        email
                      </li>
                      <li>
                        <strong className="text-white/90">Recommended:</strong>{" "}
                        first_name, company, title, linkedin_url
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
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setStep(3)}
                      disabled={!formData.csvFile}
                      className="w-full"
                    >
                      Next: Review &amp; Approve Leads
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => setLeadSource(null)}
                      className="text-sm text-white/60 hover:text-white mb-4 inline-flex items-center gap-1"
                    >
                      ← Back to options
                    </button>
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Create Leads from Scratch
                    </h2>
                    <p className="text-white/60 text-sm mb-6">
                      Tell us about your ideal customers and we'll generate a
                      targeted list for you
                    </p>
                  </div>
                  <div className="space-y-6">
                    <MultiSelectWithTags
                      label="Which target location (geography)? Select at least 1 country"
                      options={COUNTRIES}
                      value={formData.targetLocations}
                      onChange={(targetLocations) =>
                        setFormData({ ...formData, targetLocations })
                      }
                      placeholder="Select country or region(s)"
                    />

                    <MultiSelectWithTags
                      label="Job Titles to include? (must select 1)"
                      options={JOB_TITLES}
                      value={formData.jobTitles}
                      onChange={(jobTitles) =>
                        setFormData({ ...formData, jobTitles })
                      }
                      placeholder="Select job title(s)"
                    />

                    <MultiSelectWithTags
                      label="Number of Employees (select at least one)"
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

                    {/* Max Leads to Fetch */}
                    <div>
                      <Label
                        htmlFor="maxLeads"
                        className="text-white/90 mb-2 block"
                      >
                        Max Leads to Fetch
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
                        Controls scraping cost and time. Min {MAX_LEADS_MIN},
                        max {MAX_LEADS_MAX}.
                      </p>
                    </div>

                    {fetchLeadsError && (
                      <p className="text-sm text-red-400" role="alert">
                        {fetchLeadsError}
                      </p>
                    )}

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleFetchLeads}
                      disabled={!canFetchLeads() || fetchLeadsLoading}
                      className="w-full"
                    >
                      {fetchLeadsLoading ? "Sending…" : "Fetch Leads"}
                    </Button>
                    <p className="text-center text-xs text-white/50">
                      Next: we verify and clean emails before you can launch.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Review & Approve Leads */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Review &amp; Approve Leads
              </h2>
              <p className="text-white/60 text-sm mb-6">
                Quality gate: review counts and filters, then approve to
                continue.
              </p>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {reviewCounts.fetched}
                  </div>
                  <div className="text-xs text-white/60">Fetched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white/90">
                    {reviewCounts.duplicatesRemoved}
                  </div>
                  <div className="text-xs text-white/60">
                    Duplicates removed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {reviewCounts.valid}
                  </div>
                  <div className="text-xs text-white/60">Valid</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">
                    {reviewCounts.risky}
                  </div>
                  <div className="text-xs text-white/60">Risky</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {reviewCounts.invalid}
                  </div>
                  <div className="text-xs text-white/60">Invalid</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white/70">
                    {reviewCounts.missingFields}
                  </div>
                  <div className="text-xs text-white/60">Missing fields</div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeValidOnly}
                    onChange={(e) => setIncludeValidOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2563EB]"
                  />
                  <span className="text-sm text-white/90">
                    Include valid only
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRisky}
                    onChange={(e) => setIncludeRisky(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2563EB]"
                  />
                  <span className="text-sm text-white/90">Include risky</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeRoleBasedEmails}
                    onChange={(e) =>
                      setExcludeRoleBasedEmails(e.target.checked)
                    }
                    className="h-4 w-4 rounded text-[#2563EB]"
                  />
                  <span className="text-sm text-white/90">
                    Exclude role-based emails
                  </span>
                  <span
                    className="text-white/50"
                    title="e.g. info@, sales@, support@"
                  >
                    ⓘ
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeFreeEmailDomains}
                    onChange={(e) =>
                      setExcludeFreeEmailDomains(e.target.checked)
                    }
                    className="h-4 w-4 rounded text-[#2563EB]"
                  />
                  <span className="text-sm text-white/90">
                    Exclude free email domains (Gmail, Yahoo, etc.)
                  </span>
                </label>
              </div>
              <div className="overflow-x-auto rounded-lg border border-white/10 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2 text-white/70 font-medium">
                        Name
                      </th>
                      <th className="text-left p-2 text-white/70 font-medium">
                        Title
                      </th>
                      <th className="text-left p-2 text-white/70 font-medium">
                        Company
                      </th>
                      <th className="text-left p-2 text-white/70 font-medium">
                        Email
                      </th>
                      <th className="text-left p-2 text-white/70 font-medium">
                        Email Status
                      </th>
                      <th className="text-left p-2 text-white/70 font-medium">
                        Phone
                      </th>
                      <th className="text-left p-2 text-white/70 font-medium">
                        Website
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="p-2 text-white/90">{row.name}</td>
                        <td className="p-2 text-white/80">{row.title}</td>
                        <td className="p-2 text-white/80">{row.company}</td>
                        <td className="p-2 text-white/80">{row.email}</td>
                        <td className="p-2">
                          <span className="text-emerald-400 text-xs">
                            {row.emailStatus}
                          </span>
                        </td>
                        <td className="p-2 text-white/70">
                          {row.phone || "—"}
                        </td>
                        <td className="p-2 text-white/70">{row.website}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="p-2 text-xs text-white/50 border-t border-white/10">
                  Showing first 50 of {reviewCounts.valid} valid leads
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" size="md" className="flex-1">
                  Download Cleaned CSV
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={handleUseSelectedLeads}
                  disabled={reviewCounts.valid < 50}
                >
                  Use Selected Leads
                </Button>
              </div>
              {reviewCounts.valid < 50 && (
                <p className="mt-2 text-sm text-amber-400">
                  Need at least 50 valid leads to launch a campaign.
                </p>
              )}
              <div className="mt-6">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  ← Back
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Describe ICP
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Describe who you&apos;re targeting. This helps tailor messaging
                and lead filtering.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Label htmlFor="icp" className="text-white/90">
                      Ideal Customer Profile
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFormData({ ...formData, icp: ICP_TEMPLATE })
                      }
                    >
                      Use Template
                    </Button>
                  </div>
                  <textarea
                    id="icp"
                    value={formData.icp}
                    onChange={(e) =>
                      setFormData({ ...formData, icp: e.target.value })
                    }
                    placeholder={ICP_TEMPLATE}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-h-[140px]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setStep(3)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(5)}
                    disabled={!formData.icp.trim()}
                    className="flex-1"
                  >
                    Next: Describe Offer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Describe Offer
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Describe the outcome you deliver, proof, and the call-to-action.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Label htmlFor="offer" className="text-white/90">
                      Your Offer
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFormData({ ...formData, offer: OFFER_TEMPLATE })
                      }
                    >
                      Use Template
                    </Button>
                  </div>
                  <textarea
                    id="offer"
                    value={formData.offer}
                    onChange={(e) =>
                      setFormData({ ...formData, offer: e.target.value })
                    }
                    placeholder={OFFER_TEMPLATE}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-h-[140px]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setStep(4)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(6)}
                    disabled={!formData.offer.trim()}
                    className="flex-1"
                  >
                    Next: Edit Emails
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Edit 3-4 Emails
              </h2>
              <div className="mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAiEmailModalOpen(true)}
                >
                  Use AI to generate emails
                </Button>
              </div>
              {aiEmailModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                  onClick={() => setAiEmailModalOpen(false)}
                >
                  <div
                    className="rounded-xl border border-white/10 bg-[#111827] p-6 w-full max-w-md shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Generate 4-email sequence
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/80 text-sm">Tone</Label>
                        <select
                          value={aiTone}
                          onChange={(e) =>
                            setAiTone(e.target.value as typeof aiTone)
                          }
                          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                        >
                          <option value="Professional">Professional</option>
                          <option value="Friendly">Friendly</option>
                          <option value="Direct">Direct</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-white/80 text-sm">Length</Label>
                        <select
                          value={aiLength}
                          onChange={(e) =>
                            setAiLength(e.target.value as typeof aiLength)
                          }
                          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                        >
                          <option value="Short">Short</option>
                          <option value="Medium">Medium</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-white/80 text-sm">
                          CTA style
                        </Label>
                        <select
                          value={aiCtaStyle}
                          onChange={(e) =>
                            setAiCtaStyle(e.target.value as typeof aiCtaStyle)
                          }
                          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                        >
                          <option value="Soft ask">Soft ask</option>
                          <option value="Direct calendar">
                            Direct calendar
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setAiEmailModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleGenerateAiEmails}
                        className="flex-1"
                      >
                        Generate 4-email sequence
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                {formData.emails.map((email, index) => (
                  <div key={index}>
                    <Label className="text-white/90 mb-2 block">
                      Email {index + 1}
                    </Label>
                    <textarea
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder={EMAIL_PLACEHOLDERS[index]}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-h-[100px]"
                    />
                  </div>
                ))}
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setStep(5)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(7)}
                    disabled={
                      formData.emails.filter((e) => e.trim()).length < 3
                    }
                    className="flex-1"
                  >
                    Next: Launch
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Launch Campaign
              </h2>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 mb-6">
                {leadSource === "import" ? (
                  <div className="text-sm text-white/70">
                    <strong className="text-white">CSV:</strong>{" "}
                    {formData.csvFile?.name || "Not uploaded"}
                  </div>
                ) : (
                  <div className="text-sm text-white/70">
                    <strong className="text-white">Lead Source:</strong> Apollo
                    (from scratch)
                    <br />
                    <strong className="text-white">Locations:</strong>{" "}
                    {formData.targetLocations.join(", ")}
                    <br />
                    <strong className="text-white">Job Titles:</strong>{" "}
                    {formData.jobTitles.join(", ")}
                    <br />
                    <strong className="text-white">Employees:</strong>{" "}
                    {formData.employeeRanges.join(", ")}
                    <br />
                    <strong className="text-white">Industries:</strong>{" "}
                    {formData.industryKeywords.join(", ")}
                  </div>
                )}
                <div className="text-sm text-white/70">
                  <strong className="text-white">ICP:</strong>{" "}
                  {formData.icp.substring(0, 50)}…
                </div>
                <div className="text-sm text-white/70">
                  <strong className="text-white">Offer:</strong>{" "}
                  {formData.offer.substring(0, 50)}…
                </div>
                <div className="text-sm text-white/70">
                  <strong className="text-white">Emails:</strong>{" "}
                  {formData.emails.filter((e) => e.trim()).length} configured
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3 mb-6">
                <p className="text-sm font-medium text-white/90 mb-2">
                  Checklist
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      leadsApproved ? "text-emerald-400" : "text-white/50"
                    }
                  >
                    {leadsApproved ? "✓" : "○"}
                  </span>
                  <span className="text-white/80">Leads approved</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      formData.emails.filter((e) => e.trim()).length >= 3
                        ? "text-emerald-400"
                        : "text-white/50"
                    }
                  >
                    {formData.emails.filter((e) => e.trim()).length >= 3
                      ? "✓"
                      : "○"}
                  </span>
                  <span className="text-white/80">Emails configured</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      sendingAccountConnected
                        ? "text-emerald-400"
                        : "text-white/50"
                    }
                  >
                    {sendingAccountConnected ? "✓" : "○"}
                  </span>
                  <span className="text-white/80">
                    Sending account connected
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(6)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  disabled={!canLaunch()}
                  className="flex-1"
                >
                  Launch Campaign
                </Button>
              </div>
              {!canLaunch() && (
                <p className="mt-2 text-sm text-white/50">
                  Complete all checklist items to launch.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
