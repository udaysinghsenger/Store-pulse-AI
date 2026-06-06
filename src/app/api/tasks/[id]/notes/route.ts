import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("task_notes")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      notes: data || [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load task notes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { note, author_id, author_name, author_role } = body;

    if (!note || !author_name || !author_role) {
      return NextResponse.json(
        { error: "note, author_name, and author_role are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("task_notes")
      .insert({
        task_id: id,
        author_id: author_id || null,
        author_name,
        author_role,
        note,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      note: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to add task note" },
      { status: 500 }
    );
  }
}