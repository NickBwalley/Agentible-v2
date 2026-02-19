import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type Status = "good" | "bad" | "neutral" | "unknown";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  status: Status;
}

const statusColors = {
  good: "text-emerald-400 bg-emerald-500/10",
  bad: "text-red-400 bg-red-500/10",
  neutral: "text-amber-400 bg-amber-500/10",
  unknown: "text-white/60 bg-white/5",
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status,
}: MetricCardProps) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/70">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${statusColors[status]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${statusColors[status]}`}>
          {value}
        </div>
        <p className="text-xs text-white/50 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
