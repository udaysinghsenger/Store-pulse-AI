import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const storeId = searchParams.get("store_id");
  const role = searchParams.get("role");

  if (!storeId) {
    return NextResponse.json(
      { error: "store_id is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("staff_roster")
    .select("*")
    .eq("store_id", storeId)
    .eq("available", true)
    .order("staff_name");

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    staff: data || [],
  });
}