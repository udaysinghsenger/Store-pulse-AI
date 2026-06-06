import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const name = searchParams.get("name");
  const role = searchParams.get("role");

  if (!name && !role) {
    return NextResponse.json(
      { error: "name or role is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (name && role) {
    query = query.or(`recipient_name.eq.${name},recipient_role.eq.${role}`);
  } else if (name) {
    query = query.eq("recipient_name", name);
  } else if (role) {
    query = query.eq("recipient_role", role);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    notifications: data || [],
  });
}