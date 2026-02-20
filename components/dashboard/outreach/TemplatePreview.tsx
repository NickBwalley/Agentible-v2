"use client";

import { fillTemplate, getFirstNameFromFullName } from "@/lib/outreach";

export type SampleLead = {
  id: string;
  full_name: string | null;
  org_name: string | null;
};

export interface TemplatePreviewProps {
  template: string;
  sampleLead: SampleLead | null;
  yourName: string;
}

export function TemplatePreview({
  template,
  sampleLead,
  yourName,
}: TemplatePreviewProps) {
  if (!template.trim()) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/70 mb-2">Preview</p>
        <p className="text-white/50 text-sm">Enter a template to see a preview.</p>
      </div>
    );
  }

  if (!sampleLead) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/70 mb-2">Preview</p>
        <p className="text-white/50 text-sm">No leads to preview. Add leads to this campaign first.</p>
      </div>
    );
  }

  const firstName = getFirstNameFromFullName(sampleLead.full_name);
  const org_name = sampleLead.org_name ?? "";
  const filled = fillTemplate(template, {
    firstName,
    org_name,
    yourName: yourName.trim() || "Your Name",
  });

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/70 mb-2">
        Preview for: {sampleLead.full_name ?? "—"} at {sampleLead.org_name ?? "—"}
      </p>
      <div className="rounded-lg border border-white/10 bg-[#0f1419] px-4 py-3 text-white text-sm whitespace-pre-wrap font-sans">
        {filled}
      </div>
    </div>
  );
}
