"use client";

import { Label } from "@/components/ui/label";
import { ALLOWED_PLACEHOLDERS } from "@/lib/outreach";

export interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const placeholderHint = ALLOWED_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ");

export function TemplateEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Hi {{firstName}}, …",
}: TemplateEditorProps) {
  return (
    <div>
      <Label className="block text-white/90 mb-2">
        Email template (editable draft)
      </Label>
      <p className="text-white/60 text-sm mb-2">
        Use only these placeholders:{" "}
        <span className="text-[#93c5fd] font-mono">{placeholderHint}</span>
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={12}
        className="w-full rounded-lg border border-white/10 bg-[#0f1419] px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y min-h-[200px]"
        placeholder={placeholder}
      />
    </div>
  );
}
