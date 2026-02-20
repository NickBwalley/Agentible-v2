"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";

const PROBLEM_HINT = `Focus on the problem and pain-points you want to address—e.g. manual lead qualification, slow follow-up, low booked meetings, wasted spend on unqualified leads.`;
const OFFER_HINT = `Describe the solution you provide: how you help, proof (results or social proof), and CTA—e.g. "Open to a 15-min call this week?"`;

const PROBLEM_TEMPLATE = `I am solving [your problem here].

Examples you can replace with:
- Manual lead qualification and slow follow-up that cost deals
- Low booked meetings despite high outreach volume
- Wasted ad spend and unqualified leads`;

const OFFER_TEMPLATE = `I will help your org [explain what your offer].

How: [how you help—e.g. inbox-safe outbound + verified leads + personalized sequences]
Proof: [e.g. past results, case study, or "teams like yours get X meetings in Y days"]
CTA: Open to a 15-min call this week?`;

export interface OutreachBriefFormProps {
  icpDescription: string;
  offerDescription: string;
  onIcpChange: (value: string) => void;
  onOfferChange: (value: string) => void;
  disabled?: boolean;
}

export function OutreachBriefForm({
  icpDescription,
  offerDescription,
  onIcpChange,
  onOfferChange,
  disabled = false,
}: OutreachBriefFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="icp" className="block text-white/90 mb-2">
          Problems & pain-points you want to address
        </Label>
        <p className="text-white/60 text-xs mb-2">{PROBLEM_HINT}</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onIcpChange(PROBLEM_TEMPLATE)}
            disabled={disabled}
          >
            Use template
          </Button>
        </div>
        <textarea
          id="icp"
          value={icpDescription}
          onChange={(e) => onIcpChange(e.target.value)}
          disabled={disabled}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-[#0f1419] px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y min-h-[100px]"
          placeholder="I am solving [your problem here]…"
        />
      </div>
      <div>
        <Label htmlFor="offer" className="block text-white/90 mb-2">
          Your solution & offer
        </Label>
        <p className="text-white/60 text-xs mb-2">{OFFER_HINT}</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOfferChange(OFFER_TEMPLATE)}
            disabled={disabled}
          >
            Use template
          </Button>
        </div>
        <textarea
          id="offer"
          value={offerDescription}
          onChange={(e) => onOfferChange(e.target.value)}
          disabled={disabled}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-[#0f1419] px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y min-h-[100px]"
          placeholder="I will help your org [explain what your offer]…"
        />
      </div>
    </div>
  );
}
