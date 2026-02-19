import type { Alert } from "@/types/dashboard";
import { formatDistanceToNow } from "@/lib/utils";
import { AlertTriangle, UserX, Bell } from "lucide-react";

interface AlertFeedProps {
  alerts: Alert[];
}

const alertIcons = {
  sla_breach: AlertTriangle,
  unassigned: UserX,
  escalation: Bell,
};

const alertColors = {
  sla_breach: "bg-red-500/10 border-red-500/30 text-red-400",
  unassigned: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  escalation: "bg-blue-500/10 border-blue-500/30 text-blue-400",
};

export default function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
        <p className="text-sm text-white/50 mt-1">
          SLA breaches and escalations
        </p>
      </div>
      <div className="divide-y divide-white/10">
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center text-white/50">
            No alerts yet. We&apos;ll notify you when leads breach your SLA.
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon =
              alertIcons[alert.alert_type as keyof typeof alertIcons] ?? Bell;
            const color =
              alertColors[alert.alert_type as keyof typeof alertColors] ??
              "bg-white/5 border-white/10 text-white/80";
            return (
              <div
                key={alert.id}
                className={`px-6 py-4 flex items-start gap-3 ${color} border-l-4`}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {formatDistanceToNow(new Date(alert.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
