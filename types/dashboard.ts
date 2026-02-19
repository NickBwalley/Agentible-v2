/** MVP Dashboard types (users row for dashboard, leads, alerts) */

export type Lead = {
  id: string;
  user_id: string;
  external_lead_id: string | null;
  lead_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  assigned_to: string | null;
  status: "waiting" | "contacted" | "overdue" | "qualified" | "disqualified";
  created_at: string;
  first_contact_at: string | null;
  response_time_minutes: number | null;
  sla_breached: boolean;
  last_synced_at: string;
};

export type Alert = {
  id: string;
  user_id: string;
  lead_id: string;
  alert_type: "sla_breach" | "unassigned" | "escalation";
  message: string;
  created_at: string;
  read: boolean;
};

export type DashboardUser = {
  id: string;
  email: string;
  created_at: string;
  crm_provider: string | null;
  crm_connected: boolean;
  sla_target_minutes: number;
  api_key: string | null;
  routing_enabled: boolean;
  routing_method: string | null;
};
