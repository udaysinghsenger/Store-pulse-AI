import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function markNotificationRead(id: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await markNotificationRead(id);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await markNotificationRead(id);

    return NextResponse.redirect(new URL("/notifications", request.url));
  } catch (error) {
    console.error(error);

    return NextResponse.redirect(new URL("/notifications", request.url));
  }
}