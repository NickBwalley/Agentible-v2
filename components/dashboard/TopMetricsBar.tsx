"use client";

interface TopMetricsBarProps {
  emailsSent: number;
  inboxRate: number;
  qualifiedReplies: number;
  meetingsBooked: number;
  costPerMeeting: number;
}

export function TopMetricsBar({
  emailsSent,
  inboxRate,
  qualifiedReplies,
  meetingsBooked,
  costPerMeeting,
}: TopMetricsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Emails Sent</div>
        <div className="text-2xl font-bold text-white">{emailsSent.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Inbox Rate %</div>
        <div className="text-2xl font-bold text-white">{inboxRate.toFixed(1)}%</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Qualified Replies</div>
        <div className="text-2xl font-bold text-white">{qualifiedReplies.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Meetings Booked</div>
        <div className="text-2xl font-bold text-white">{meetingsBooked.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-1">Cost per Meeting</div>
        <div className="text-2xl font-bold text-white">${costPerMeeting.toFixed(0)}</div>
      </div>
    </div>
  );
}
