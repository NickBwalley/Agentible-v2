"use client";

interface TopMetricsBarProps {
  totalLeads: number;
  emailsSent: number;
  notSent: number;
  inboxRate: number;
  openedEmails: number;
  responded: number;
  meetingsBooked: number;
  followUps: number;
}

export function TopMetricsBar({
  totalLeads,
  emailsSent,
  notSent,
  inboxRate,
  openedEmails,
  responded,
  meetingsBooked,
  followUps,
}: TopMetricsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Total Leads</div>
        <div className="text-2xl font-bold text-white">{totalLeads.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Emails Sent</div>
        <div className="text-2xl font-bold text-white">{emailsSent.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Not Sent</div>
        <div className="text-2xl font-bold text-white">{notSent.toLocaleString()}</div>
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
        <div className="text-sm text-white/70 mb-1">Follow-ups</div>
        <div className="text-2xl font-bold text-white">{followUps.toLocaleString()}</div>
      </div>
    </div>
  );
}
