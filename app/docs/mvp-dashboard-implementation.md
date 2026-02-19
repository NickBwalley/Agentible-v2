# MVP Dashboard Implementation - Agentible Lead Response SLA Monitor

## Project Overview

Build a professional B2B SaaS dashboard for monitoring inbound lead response times and SLA compliance. Users connect their CRM, set response time targets, and get real-time alerts when leads go untouched.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts (optional for MVP)
- **Icons**: Lucide React

## Database Schema (Supabase)

### Table: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  crm_provider TEXT, -- 'hubspot', 'salesforce', 'pipedrive', null
  crm_connected BOOLEAN DEFAULT false,
  sla_target_minutes INTEGER DEFAULT 60, -- default 1 hour
  api_key TEXT, -- encrypted CRM API key
  routing_enabled BOOLEAN DEFAULT false,
  routing_method TEXT -- 'round_robin', 'territory', 'capacity', null
);
```

### Table: `leads`

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  external_lead_id TEXT, -- ID from CRM
  lead_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  source TEXT, -- 'website', 'linkedin', 'referral', etc
  assigned_to TEXT, -- rep name or email
  status TEXT NOT NULL, -- 'waiting', 'contacted', 'overdue', 'qualified', 'disqualified'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_contact_at TIMESTAMPTZ,
  response_time_minutes INTEGER, -- calculated: first_contact_at - created_at
  sla_breached BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

### Table: `alerts`

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'sla_breach', 'unassigned', 'escalation'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
```

## File Structure

```
/app
  /dashboard
    page.tsx          # Main dashboard
    layout.tsx        # Dashboard layout with nav
  /onboarding
    page.tsx          # 3-step onboarding flow
  /auth
    /login
      page.tsx
    /signup
      page.tsx
  /api
    /crm
      /connect
        route.ts      # CRM OAuth callback
      /sync
        route.ts      # Manual sync trigger
  layout.tsx          # Root layout
  page.tsx            # Landing redirect

/components
  /dashboard
    MetricCard.tsx
    LeadsTable.tsx
    AlertFeed.tsx
    EmptyState.tsx
  /onboarding
    ConnectCRM.tsx
    SetSLA.tsx
    ConfigureRouting.tsx
  /ui
    (shadcn components: button, card, badge, table, input, etc)

/lib
  supabase.ts         # Supabase client
  crm-connectors.ts   # CRM API wrappers (HubSpot, Salesforce, etc)
  utils.ts            # Helper functions

/types
  index.ts            # TypeScript types
```

## Implementation Instructions

### Step 1: Initialize Project

```bash
npx create-next-app@latest agentible-dashboard --typescript --tailwind --app
cd agentible-dashboard
npx shadcn-ui@latest init
npx shadcn-ui@latest add card badge button table input select
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install recharts lucide-react
npm install date-fns # for date formatting
```

### Step 2: Set up Supabase Client (`/lib/supabase.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
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

export type User = {
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
```

### Step 3: Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_string
```

### Step 4: Main Dashboard Page (`/app/dashboard/page.tsx`)

```typescript
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/dashboard/MetricCard'
import LeadsTable from '@/components/dashboard/LeadsTable'
import AlertFeed from '@/components/dashboard/AlertFeed'
import EmptyState from '@/components/dashboard/EmptyState'
import { Clock, Users, AlertTriangle, Inbox } from 'lucide-react'

export default async function DashboardPage() {
  // Get current user (you'll implement auth separately)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user settings
  const { data: userSettings } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If CRM not connected, show empty state
  if (!userSettings?.crm_connected) {
    return <EmptyState />
  }

  // Fetch leads for this user
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate metrics
  const leadsToday = leads?.filter(l => {
    const today = new Date().toDateString()
    const leadDate = new Date(l.created_at).toDateString()
    return today === leadDate
  }) || []

  const contactedToday = leadsToday.filter(l => l.status === 'contacted').length
  const waitingLeads = leads?.filter(l => l.status === 'waiting').length || 0
  const neverContactedRate = leads?.length
    ? ((leads.filter(l => l.first_contact_at === null).length / leads.length) * 100).toFixed(1)
    : '0'

  // Calculate median response time (only for contacted leads)
  const responseTimes = leads
    ?.filter(l => l.response_time_minutes !== null)
    .map(l => l.response_time_minutes!)
    .sort((a, b) => a - b) || []

  const medianResponseTime = responseTimes.length > 0
    ? responseTimes[Math.floor(responseTimes.length / 2)]
    : null

  const slaTarget = userSettings?.sla_target_minutes || 60
  const slaStatus = medianResponseTime
    ? (medianResponseTime <= slaTarget ? 'good' : 'bad')
    : 'unknown'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Median Response Time"
            value={medianResponseTime ? `${medianResponseTime} min` : 'N/A'}
            subtitle={`Target: ${slaTarget} min`}
            icon={Clock}
            status={slaStatus}
          />
          <MetricCard
            title="Leads Touched Today"
            value={`${contactedToday} / ${leadsToday.length}`}
            subtitle={`${leadsToday.length > 0 ? ((contactedToday / leadsToday.length) * 100).toFixed(0) : 0}% contacted`}
            icon={Users}
            status={contactedToday === leadsToday.length ? 'good' : 'neutral'}
          />
          <MetricCard
            title="Never Contacted Rate"
            value={`${neverContactedRate}%`}
            subtitle="Should be <10%"
            icon={AlertTriangle}
            status={parseFloat(neverContactedRate) < 10 ? 'good' : 'bad'}
          />
          <MetricCard
            title="Leads in Queue"
            value={waitingLeads.toString()}
            subtitle="Waiting assignment"
            icon={Inbox}
            status={waitingLeads === 0 ? 'good' : 'neutral'}
          />
        </div>

        {/* Leads Table */}
        <div className="mb-8">
          <LeadsTable leads={leads || []} slaTarget={slaTarget} />
        </div>

        {/* Alert Feed */}
        <div>
          <AlertFeed alerts={alerts || []} />
        </div>
      </main>
    </div>
  )
}
```

### Step 5: MetricCard Component (`/components/dashboard/MetricCard.tsx`)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

type Status = 'good' | 'bad' | 'neutral' | 'unknown'

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  status: Status
}

const statusColors = {
  good: 'text-green-600 bg-green-50',
  bad: 'text-red-600 bg-red-50',
  neutral: 'text-yellow-600 bg-yellow-50',
  unknown: 'text-gray-600 bg-gray-50',
}

export default function MetricCard({ title, value, subtitle, icon: Icon, status }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${statusColors[status]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${statusColors[status]}`}>
          {value}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  )
}
```

### Step 6: LeadsTable Component (`/components/dashboard/LeadsTable.tsx`)

```typescript
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Lead } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface LeadsTableProps {
  leads: Lead[]
  slaTarget: number
}

function getStatusBadge(lead: Lead, slaTarget: number) {
  if (lead.status === 'contacted') {
    return <Badge variant="default" className="bg-green-100 text-green-800">Contacted</Badge>
  }

  const minutesSinceCreation = Math.floor(
    (new Date().getTime() - new Date(lead.created_at).getTime()) / 60000
  )

  if (lead.status === 'waiting' && minutesSinceCreation > slaTarget) {
    return <Badge variant="destructive">Overdue</Badge>
  }

  if (lead.status === 'waiting') {
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Waiting</Badge>
  }

  return <Badge variant="outline">{lead.status}</Badge>
}

export default function LeadsTable({ leads, slaTarget }: LeadsTableProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
        <p className="text-sm text-gray-500 mt-1">Last 20 leads from your CRM</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time Since Arrival</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No leads yet. Sync your CRM to see leads here.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.lead_name}</TableCell>
                <TableCell>{lead.company || '—'}</TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{lead.source || '—'}</span>
                </TableCell>
                <TableCell>{lead.assigned_to || 'Unassigned'}</TableCell>
                <TableCell>{getStatusBadge(lead, slaTarget)}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
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
  )
}
```

### Step 7: AlertFeed Component (`/components/dashboard/AlertFeed.tsx`)

```typescript
import { Alert } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, UserX, Bell } from 'lucide-react'

interface AlertFeedProps {
  alerts: Alert[]
}

const alertIcons = {
  sla_breach: AlertTriangle,
  unassigned: UserX,
  escalation: Bell,
}

const alertColors = {
  sla_breach: 'bg-red-50 border-red-200 text-red-800',
  unassigned: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  escalation: 'bg-blue-50 border-blue-200 text-blue-800',
}

export default function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
        <p className="text-sm text-gray-500 mt-1">SLA breaches and escalations</p>
      </div>
      <div className="divide-y">
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No alerts yet. We'll notify you when leads breach your SLA.
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = alertIcons[alert.alert_type]
            return (
              <div
                key={alert.id}
                className={`px-6 py-4 flex items-start gap-3 ${alertColors[alert.alert_type]} border-l-4`}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
```

### Step 8: EmptyState Component (`/components/dashboard/EmptyState.tsx`)

```typescript
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'
import Link from 'next/link'

export default function EmptyState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
          <Database className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Connect Your CRM to Get Started
        </h2>
        <p className="text-gray-600 mb-8">
          We'll sync your leads and start monitoring response times automatically.
          You'll see real-time metrics and alerts right here.
        </p>
        <Link href="/onboarding">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Connect CRM
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

### Step 9: Onboarding Flow (`/app/onboarding/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null)
  const [slaTarget, setSlaTarget] = useState(60)
  const [routingEnabled, setRoutingEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCRMConnect(provider: string) {
    setLoading(true)
    setSelectedCRM(provider)

    // In a real implementation, this would trigger OAuth flow
    // For MVP, we'll just mark it as connected
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('users')
        .update({
          crm_provider: provider,
          crm_connected: true
        })
        .eq('id', user.id)
    }

    setLoading(false)
    setStep(2)
  }

  async function handleSLASubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('users')
        .update({ sla_target_minutes: slaTarget })
        .eq('id', user.id)
    }

    setLoading(false)
    setStep(3)
  }

  async function handleRoutingSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('users')
        .update({ routing_enabled: routingEnabled })
        .eq('id', user.id)
    }

    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>Step 1</span>
            <span className="text-gray-300">→</span>
            <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>Step 2</span>
            <span className="text-gray-300">→</span>
            <span className={step >= 3 ? 'text-blue-600 font-semibold' : ''}>Step 3</span>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && 'Connect Your CRM'}
            {step === 2 && 'Set Your Response Target'}
            {step === 3 && 'Configure Routing (Optional)'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Choose your CRM to sync leads automatically'}
            {step === 2 && 'Define what counts as a fast response'}
            {step === 3 && 'Decide if we should auto-assign incoming leads'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-20 justify-start text-left"
                onClick={() => handleCRMConnect('hubspot')}
                disabled={loading}
              >
                <div>
                  <div className="font-semibold text-lg">HubSpot</div>
                  <div className="text-sm text-gray-500">Connect your HubSpot CRM</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full h-20 justify-start text-left"
                onClick={() => handleCRMConnect('salesforce')}
                disabled={loading}
              >
                <div>
                  <div className="font-semibold text-lg">Salesforce</div>
                  <div className="text-sm text-gray-500">Connect your Salesforce CRM</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full h-20 justify-start text-left"
                onClick={() => handleCRMConnect('pipedrive')}
                disabled={loading}
              >
                <div>
                  <div className="font-semibold text-lg">Pipedrive</div>
                  <div className="text-sm text-gray-500">Connect your Pipedrive CRM</div>
                </div>
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push('/dashboard')}>
                I'll do this later
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="sla-target">Target Response Time</Label>
                <Select
                  value={slaTarget.toString()}
                  onValueChange={(val) => setSlaTarget(parseInt(val))}
                >
                  <SelectTrigger id="sla-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  We'll alert you when leads exceed this response time
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleSLASubmit}
                disabled={loading}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Do you want automatic lead assignment?</Label>
                <div className="space-y-2">
                  <Button
                    variant={routingEnabled ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-4"
                    onClick={() => setRoutingEnabled(true)}
                  >
                    <div>
                      <div className="font-semibold">Yes, auto-assign leads</div>
                      <div className="text-sm opacity-75">We'll route leads based on rules you configure</div>
                    </div>
                  </Button>
                  <Button
                    variant={!routingEnabled ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-4"
                    onClick={() => setRoutingEnabled(false)}
                  >
                    <div>
                      <div className="font-semibold">No, just monitor</div>
                      <div className="text-sm opacity-75">We'll alert you but won't change assignments</div>
                    </div>
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleRoutingSubmit}
                disabled={loading}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Critical Implementation Notes

1. **Auth Setup**: Install Supabase auth helpers and set up protected routes. Use middleware to redirect unauthenticated users.

2. **Real-time Updates**: Add Supabase realtime subscriptions to the dashboard for live lead updates:

```typescript
useEffect(() => {
  const channel = supabase
    .channel("leads-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "leads" },
      (payload) => {
        // Refresh leads when new one arrives
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

3. **CRM OAuth**: For HubSpot OAuth, use this flow:
   - Redirect to HubSpot OAuth: `https://app.hubspot.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=crm.objects.contacts.read`
   - Handle callback in `/api/crm/connect/route.ts`
   - Exchange code for access token
   - Store encrypted token in `users.api_key`

4. **Background Sync**: Set up a cron job or use Vercel Cron to trigger `/api/crm/sync` every 5 minutes. This endpoint should:
   - Fetch new leads from CRM API
   - Calculate response times
   - Detect SLA breaches
   - Write to `leads` and `alerts` tables

5. **Styling**: Keep design minimal and professional. Use:
   - Gray-50 background
   - White cards with subtle shadows
   - Blue-600 as primary color
   - Green for good metrics, Red for bad, Yellow for warnings

6. **Loading States**: Add skeleton loaders for metric cards and table while data loads.

7. **Error Handling**: Wrap all Supabase calls in try-catch and show user-friendly error messages.

## Testing Checklist

- [ ] User can sign up and login
- [ ] Onboarding flow works (3 steps)
- [ ] Empty state shows when CRM not connected
- [ ] Dashboard loads with metric cards
- [ ] Leads table displays correctly
- [ ] Alert feed shows recent alerts
- [ ] Status badges have correct colors
- [ ] Response time calculation is accurate
- [ ] SLA breach detection works
- [ ] Mobile responsive (test on phone)

## Next Steps After MVP

1. Add CRM OAuth (HubSpot first)
2. Build background sync worker (n8n or Vercel Cron)
3. Add lead detail modal (click "View" in table)
4. Add manual sync button
5. Add settings page (change SLA, disconnect CRM)
6. Add email/Slack notifications for alerts
7. Add export functionality (CSV download)

---

**Start with the dashboard empty state and onboarding flow. Get those working first. Then connect real data from Supabase. Ship the MVP in 3 days.**
