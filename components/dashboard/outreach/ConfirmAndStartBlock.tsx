"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ConfirmAndStartBlockProps {
  yourName: string;
  onYourNameChange: (value: string) => void;
  leadCount: number;
  onConfirmAndStart: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ConfirmAndStartBlock({
  yourName,
  onYourNameChange,
  leadCount,
  onConfirmAndStart,
  loading = false,
  disabled = false,
}: ConfirmAndStartBlockProps) {
  const canStart =
    yourName.trim().length > 0 && leadCount > 0 && !disabled && !loading;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Confirm and start campaign</h3>
      <p className="text-white/60 text-sm">
        {leadCount} lead{leadCount !== 1 ? "s" : ""} will receive this email. Enter your name to sign the message.
      </p>
      <div>
        <Label htmlFor="yourName" className="block text-white/90 mb-2">
          Your name
        </Label>
        <Input
          id="yourName"
          type="text"
          value={yourName}
          onChange={(e) => onYourNameChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Jane Smith"
          className="w-full max-w-xs"
        />
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={onConfirmAndStart}
        disabled={!canStart}
      >
        {loading ? "Sending…" : "Confirm and Start Campaign"}
      </Button>
    </div>
  );
}
