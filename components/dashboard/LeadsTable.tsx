import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lead } from "@/types/dashboard";
import { formatDistanceToNow } from "@/lib/utils";

interface LeadsTableProps {
  leads: Lead[];
  slaTarget: number;
}

function getStatusBadge(lead: Lead, slaTarget: number) {
  if (lead.status === "contacted") {
    return (
      <Badge
        variant="default"
        className="bg-emerald-500/20 text-emerald-400 border-0"
      >
        Contacted
      </Badge>
    );
  }

  const minutesSinceCreation = Math.floor(
    (new Date().getTime() - new Date(lead.created_at).getTime()) / 60000
  );

  if (lead.status === "waiting" && minutesSinceCreation > slaTarget) {
    return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
  }

  if (lead.status === "waiting") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/20 text-amber-400 border-0"
      >
        Waiting
      </Badge>
    );
  }

  return <Badge variant="outline" className="border-white/20 text-white/80">{lead.status}</Badge>;
}

export default function LeadsTable({ leads, slaTarget }: LeadsTableProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Recent Leads</h2>
        <p className="text-sm text-white/50 mt-1">
          Last 20 leads from your CRM
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/70">Lead Name</TableHead>
            <TableHead className="text-white/70">Company</TableHead>
            <TableHead className="text-white/70">Source</TableHead>
            <TableHead className="text-white/70">Assigned To</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
            <TableHead className="text-white/70">Time Since Arrival</TableHead>
            <TableHead className="text-right text-white/70">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell
                colSpan={7}
                className="text-center py-8 text-white/50"
              >
                No leads yet. Sync your CRM to see leads here.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">{lead.lead_name}</TableCell>
                <TableCell className="text-white/80">{lead.company || "—"}</TableCell>
                <TableCell>
                  <span className="text-sm text-white/60">
                    {lead.source || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-white/80">{lead.assigned_to || "Unassigned"}</TableCell>
                <TableCell>{getStatusBadge(lead, slaTarget)}</TableCell>
                <TableCell className="text-sm text-white/60">
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
