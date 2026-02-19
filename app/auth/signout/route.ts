import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = request.nextUrl.origin;
  return NextResponse.redirect(new URL("/", origin), 302);
}

export async function GET(request: NextRequest) {
  return POST(request);
}
