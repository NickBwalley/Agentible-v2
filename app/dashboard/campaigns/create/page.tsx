"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  "Chief Executive Officer",
  "Chief Operations Officer",
  "Co-Founder",
  "Executive Director",
  "Chief Technical Officer",
  "Director Of Sales",
  "Business Development Executive",
  "Manager",
  "General Manager",
  "Consultant",
];

const EMPLOYEE_RANGES = [
  "2-10",
  "11-20",
  "21-50",
  "51-100",
  "101-200",
  "201-500",
  "501-1000",
  "1001-2000",
  "2001-5000",
  "5001-10000",
  "10000+",
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [leadSource, setLeadSource] = useState<"import" | "create" | null>(null);
  const [formData, setFormData] = useState({
    csvFile: null as File | null,
    icp: "",
    offer: "",
    emails: ["", "", "", ""],
    // Lead generation fields
    targetLocations: [] as string[],
    jobTitles: [] as string[],
    employeeRanges: [] as string[],
    industryKeywords: "",
  });
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [jobTitlesDropdownOpen, setJobTitlesDropdownOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const jobTitlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryDropdownOpen(false);
      if (jobTitlesRef.current && !jobTitlesRef.current.contains(e.target as Node)) setJobTitlesDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, csvFile: e.target.files[0] });
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const toggleJobTitle = (title: string) => {
    setFormData({
      ...formData,
      jobTitles: formData.jobTitles.includes(title)
        ? formData.jobTitles.filter((t) => t !== title)
        : [...formData.jobTitles, title],
    });
  };

  const toggleCountry = (country: string) => {
    setFormData({
      ...formData,
      targetLocations: formData.targetLocations.includes(country)
        ? formData.targetLocations.filter((c) => c !== country)
        : [...formData.targetLocations, country],
    });
  };

  const toggleEmployeeRange = (range: string) => {
    setFormData({
      ...formData,
      employeeRanges: formData.employeeRanges.includes(range)
        ? formData.employeeRanges.filter((r) => r !== range)
        : [...formData.employeeRanges, range],
    });
  };

  const handleGenerateLeads = () => {
    // Handle lead generation
    console.log("Generating leads with:", {
      targetLocations: formData.targetLocations,
      jobTitles: formData.jobTitles,
      employeeRanges: formData.employeeRanges,
      industryKeywords: formData.industryKeywords,
    });
    // After generating leads, proceed to next step
    setStep(2);
  };

  const handleSubmit = () => {
    // Handle campaign creation
    console.log("Creating campaign:", formData);
    router.push("/dashboard");
  };

  const canProceedFromStep1 = () => {
    if (leadSource === "import") {
      return !!formData.csvFile;
    } else if (leadSource === "create") {
      return (
        formData.targetLocations.length >= 1 &&
        formData.jobTitles.length > 0 &&
        formData.employeeRanges.length >= 1 &&
        !!formData.industryKeywords.trim()
      );
    }
    return false;
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
          <h1 className="text-3xl font-bold text-white mb-2">Create Campaign</h1>
          <p className="text-white/60">Set up your outbound campaign in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step
                    ? "bg-[#2563EB] text-white"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
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
                    Do you already have a list of leads, or would you like us to help you find and create targeted leads?
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
                        <div className="font-medium text-white mb-1">Yes, import my own leads</div>
                        <div className="text-sm text-white/60">
                          Upload your CSV file with existing leads to get started quickly
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
                        <div className="font-medium text-white mb-1">No, create leads from scratch</div>
                        <div className="text-sm text-white/60">
                          Let us help you find and generate targeted leads based on your criteria
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
                    <h2 className="text-xl font-semibold text-white mb-4">Upload CSV Leads</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv" className="text-white/90 mb-4 block">
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
                          <svg className="h-5 w-5 mr-2 opacity-80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Upload CSV File
                        </label>
                      </div>
                      {formData.csvFile && (
                        <p className="mt-2 text-sm text-white/60">
                          Selected: {formData.csvFile.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setStep(2)}
                      disabled={!formData.csvFile}
                      className="w-full"
                    >
                      Next: Describe ICP
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
                    <h2 className="text-xl font-semibold text-white mb-4">Create Leads from Scratch</h2>
                    <p className="text-white/60 text-sm mb-6">
                      Tell us about your ideal customers and we'll generate a targeted list for you
                    </p>
                  </div>
                  <div className="space-y-6">
                    {/* Target Location - dropdown with checkboxes */}
                    <div ref={countryRef} className="relative">
                      <Label className="text-white/90 mb-2 block">
                        Which target location (geography)? Select at least 1 country
                      </Label>
                      <button
                        type="button"
                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      >
                        <span className={formData.targetLocations.length === 0 ? "text-white/50" : ""}>
                          {formData.targetLocations.length === 0
                            ? "Select country or region(s)"
                            : `${formData.targetLocations.length} country(ies) selected`}
                        </span>
                        <svg
                          className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {countryDropdownOpen && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full min-w-[16rem] overflow-auto rounded-md border border-white/10 bg-[#111827] py-1 shadow-lg">
                          {COUNTRIES.map((country) => (
                            <label
                              key={country}
                              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10"
                            >
                              <input
                                type="checkbox"
                                checked={formData.targetLocations.includes(country)}
                                onChange={() => toggleCountry(country)}
                                className="h-4 w-4 rounded border-white/30 text-[#2563EB] focus:ring-[#2563EB]"
                              />
                              <span>{country}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {formData.targetLocations.length > 0 && !countryDropdownOpen && (
                        <p className="mt-1 text-xs text-white/60">
                          {formData.targetLocations.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Job Titles - dropdown with checkboxes */}
                    <div ref={jobTitlesRef} className="relative">
                      <Label className="text-white/90 mb-2 block">
                        Job Titles to include?
                      </Label>
                      <button
                        type="button"
                        onClick={() => setJobTitlesDropdownOpen(!jobTitlesDropdownOpen)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      >
                        <span className={formData.jobTitles.length === 0 ? "text-white/50" : ""}>
                          {formData.jobTitles.length === 0
                            ? "Select job title(s)"
                            : `${formData.jobTitles.length} job title(s) selected`}
                        </span>
                        <svg
                          className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${jobTitlesDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {jobTitlesDropdownOpen && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full min-w-[16rem] overflow-auto rounded-md border border-white/10 bg-[#111827] py-1 shadow-lg">
                          {JOB_TITLES.map((title) => (
                            <label
                              key={title}
                              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10"
                            >
                              <input
                                type="checkbox"
                                checked={formData.jobTitles.includes(title)}
                                onChange={() => toggleJobTitle(title)}
                                className="h-4 w-4 rounded border-white/30 text-[#2563EB] focus:ring-[#2563EB]"
                              />
                              <span>{title}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {formData.jobTitles.length > 0 && !jobTitlesDropdownOpen && (
                        <p className="mt-1 text-xs text-white/60">
                          {formData.jobTitles.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Number of Employees - checkboxes */}
                    <div>
                      <Label className="text-white/90 mb-3 block">
                        Number of Employees (select at least one)
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {EMPLOYEE_RANGES.map((range) => (
                          <label
                            key={range}
                            className="flex items-center gap-2 p-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.employeeRanges.includes(range)}
                              onChange={() => toggleEmployeeRange(range)}
                              className="h-4 w-4 rounded border-white/30 text-[#2563EB] focus:ring-[#2563EB] focus:ring-2"
                            />
                            <span className="text-sm text-white/90">{range}</span>
                          </label>
                        ))}
                      </div>
                      {formData.employeeRanges.length > 0 && (
                        <p className="mt-2 text-xs text-white/60">
                          {formData.employeeRanges.length} range(s) selected
                        </p>
                      )}
                    </div>

                    {/* Industry Keywords */}
                    <div>
                      <Label htmlFor="keywords" className="text-white/90 mb-2 block">
                        Industry Keywords
                      </Label>
                      <Input
                        id="keywords"
                        type="text"
                        value={formData.industryKeywords}
                        onChange={(e) =>
                          setFormData({ ...formData, industryKeywords: e.target.value })
                        }
                        placeholder="e.g., SaaS, E-commerce, Cosmetics, Food & Beverages"
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-white/60">
                        Separate multiple keywords with commas
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleGenerateLeads}
                      disabled={!canProceedFromStep1()}
                      className="w-full"
                    >
                      Generate Leads
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Describe ICP</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="icp" className="text-white/90 mb-2 block">
                    Ideal Customer Profile
                  </Label>
                  <textarea
                    id="icp"
                    value={formData.icp}
                    onChange={(e) => setFormData({ ...formData, icp: e.target.value })}
                    placeholder="Describe your ideal customer profile..."
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-h-[120px]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary" size="md" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(3)}
                    disabled={!formData.icp.trim()}
                    className="flex-1"
                  >
                    Next: Describe Offer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Describe Offer</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="offer" className="text-white/90 mb-2 block">
                    Your Offer
                  </Label>
                  <textarea
                    id="offer"
                    value={formData.offer}
                    onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                    placeholder="Describe what you're offering..."
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-h-[120px]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary" size="md" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(4)}
                    disabled={!formData.offer.trim()}
                    className="flex-1"
                  >
                    Next: Edit Emails
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Edit 3-4 Emails</h2>
              <div className="space-y-6">
                {formData.emails.map((email, index) => (
                  <div key={index}>
                    <Label className="text-white/90 mb-2 block">
                      Email {index + 1}
                    </Label>
                    <textarea
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder={`Email ${index + 1} content...`}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-h-[100px]"
                    />
                  </div>
                ))}
                <div className="flex gap-4">
                  <Button variant="secondary" size="md" onClick={() => setStep(3)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(5)}
                    disabled={formData.emails.filter((e) => e.trim()).length < 3}
                    className="flex-1"
                  >
                    Next: Launch
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Launch Campaign</h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
                  {leadSource === "import" ? (
                    <div className="text-sm text-white/70">
                      <strong className="text-white">CSV:</strong> {formData.csvFile?.name || "Not uploaded"}
                    </div>
                  ) : (
                    <div className="text-sm text-white/70">
                      <strong className="text-white">Lead Source:</strong> Generated from scratch
                      <br />
                      <strong className="text-white">Locations:</strong> {formData.targetLocations.join(", ")}
                      <br />
                      <strong className="text-white">Job Titles:</strong> {formData.jobTitles.join(", ")}
                      <br />
                      <strong className="text-white">Employees:</strong> {formData.employeeRanges.join(", ")}
                      <br />
                      <strong className="text-white">Industries:</strong> {formData.industryKeywords}
                    </div>
                  )}
                  <div className="text-sm text-white/70">
                    <strong className="text-white">ICP:</strong> {formData.icp.substring(0, 50)}...
                  </div>
                  <div className="text-sm text-white/70">
                    <strong className="text-white">Offer:</strong> {formData.offer.substring(0, 50)}...
                  </div>
                  <div className="text-sm text-white/70">
                    <strong className="text-white">Emails:</strong> {formData.emails.filter((e) => e.trim()).length} configured
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary" size="md" onClick={() => setStep(4)} className="flex-1">
                    Back
                  </Button>
                  <Button variant="primary" size="md" onClick={handleSubmit} className="flex-1">
                    Launch Campaign
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
