"use client";

interface TopMetricsBarProps {
  emailsSent: number;
  inboxRate: number;
  openedEmails: number;
  responded: number;
  meetingsBooked: number;
  qualifiedProspects: number;
}

export function TopMetricsBar({
  emailsSent,
  inboxRate,
  openedEmails,
  responded,
  meetingsBooked,
  qualifiedProspects,
}: TopMetricsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Email Sent</div>
        <div className="text-2xl font-bold text-white">{emailsSent.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Inbox Rate %</div>
        <div className="text-2xl font-bold text-white">{inboxRate.toFixed(1)}%</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Opened Emails</div>
        <div className="text-2xl font-bold text-white">{openedEmails.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Responded</div>
        <div className="text-2xl font-bold text-white">{responded.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Meetings Booked</div>
        <div className="text-2xl font-bold text-white">{meetingsBooked.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Qualified Prospects</div>
        <div className="text-2xl font-bold text-white">{qualifiedProspects.toLocaleString()}</div>
      </div>
    </div>
  );
}
