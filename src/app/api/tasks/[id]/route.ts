import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function isInventoryTask(task: any) {
  return (
    task?.evidence?.source === "inventory" ||
    task?.title?.toLowerCase().includes("restock") ||
    task?.assigned_role === "Floor Staff"
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: existingTask, error: existingTaskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (existingTaskError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: {
      status?: string;
      assigned_to?: string;
      assigned_role?: string;
      inventory_updated?: boolean;
      inventory_update_summary?: string;
      inventory_updated_at?: string;
      escalated_to_head_office?: boolean;
      escalation_reason?: string;
      escalated_by?: string;
      escalated_at?: string;
      section?: string;
      assignment_reason?: string;
      reassignment_allowed?: boolean;
      manually_reassigned?: boolean;
      reassigned_by?: string;
      reassigned_at?: string;
    } = {};

    if (body.status) {
      if (!["open", "in_progress", "resolved"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      if (
        body.status === "resolved" &&
        isInventoryTask(existingTask) &&
        !existingTask.inventory_updated
      ) {
        return NextResponse.json(
          {
            error:
              "Inventory must be updated before this inventory task can be marked done.",
          },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    if (body.assigned_to !== undefined) {
      updateData.assigned_to = body.assigned_to;
    }

    if (body.assigned_role !== undefined) {
      updateData.assigned_role = body.assigned_role;
    }

    if (
  body.assigned_to !== undefined &&
  body.assigned_to !== existingTask.assigned_to
    ) {
      if (
        existingTask.reassignment_allowed === false ||
        existingTask.issue_type === "staff_issue"
      ) {
        return NextResponse.json(
          { error: "This task cannot be manually reassigned." },
          { status: 400 }
        );
      }

      updateData.manually_reassigned = true;
      updateData.reassigned_by = body.reassigned_by || body.author_name || null;
      updateData.reassigned_at = new Date().toISOString();
    }

    if (body.inventory_updated !== undefined) {
      updateData.inventory_updated = body.inventory_updated;
    }

    if (body.inventory_update_summary !== undefined) {
      updateData.inventory_update_summary = body.inventory_update_summary;
    }

    if (body.inventory_updated_at !== undefined) {
      updateData.inventory_updated_at = body.inventory_updated_at;
    }

    if (body.escalated_to_head_office !== undefined) {
      updateData.escalated_to_head_office = body.escalated_to_head_office;
      updateData.escalated_at = body.escalated_to_head_office
        ? new Date().toISOString()
        : undefined;
    }

    if (body.escalation_reason !== undefined) {
      updateData.escalation_reason = body.escalation_reason;
    }

    if (body.escalated_by !== undefined) {
  updateData.escalated_by = body.escalated_by;
      }

      if (body.assignment_reason !== undefined) {
        updateData.assignment_reason = body.assignment_reason;
      }

      if (body.section !== undefined) {
        updateData.section = body.section;
      }

      if (body.reassignment_allowed !== undefined) {
        updateData.reassignment_allowed = body.reassignment_allowed;
      }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (body.assigned_to && body.assigned_to !== existingTask.assigned_to) {
      await supabase.from("notifications").insert({
        recipient_name: body.assigned_to,
        recipient_role: null,
        title: "Task reassigned to you",
        message: data.title,
        task_id: data.id,
      });
    }

    if (body.escalated_to_head_office) {
      await supabase.from("notifications").insert({
        recipient_name: null,
        recipient_role: "head_office",
        title: "Task escalated to head office",
        message: body.escalation_reason || data.title,
        task_id: data.id,
      });
    }

    if (body.note && body.author_name && body.author_role) {
      const { error: noteError } = await supabase.from("task_notes").insert({
        task_id: id,
        author_id: body.author_id || null,
        author_name: body.author_name,
        author_role: body.author_role,
        note: body.note,
      });

      if (noteError) {
        throw new Error(noteError.message);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}