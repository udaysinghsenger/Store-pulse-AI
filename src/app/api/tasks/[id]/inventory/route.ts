import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      stock_count,
      shelf_count,
      author_id,
      author_name,
      author_role,
    } = body;

    if (stock_count === undefined || shelf_count === undefined) {
      return NextResponse.json(
        { error: "stock_count and shelf_count are required" },
        { status: 400 }
      );
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const evidence = task.evidence || {};
    const productName = evidence.product_name;
    const color = evidence.color;
    const size = evidence.size;

    if (!productName) {
      return NextResponse.json(
        { error: "No product information found for this inventory task" },
        { status: 400 }
      );
    }

    let inventoryQuery = supabase
      .from("inventory")
      .select("*")
      .eq("store_id", task.store_id)
      .ilike("product_name", `%${productName}%`)
      .limit(1);

    if (color) {
      inventoryQuery = inventoryQuery.ilike("color", `%${color}%`);
    }

    if (size) {
      inventoryQuery = inventoryQuery.eq("size", size);
    }

    const { data: inventoryRows, error: inventoryLookupError } =
      await inventoryQuery;

    if (inventoryLookupError) {
      throw new Error(inventoryLookupError.message);
    }

    const inventoryItem = inventoryRows?.[0];

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Matching inventory item was not found" },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const { error: inventoryUpdateError } = await supabase
      .from("inventory")
      .update({
        stock_count: Number(stock_count),
        shelf_count: Number(shelf_count),
        last_restocked: today,
      })
      .eq("id", inventoryItem.id);

    if (inventoryUpdateError) {
      throw new Error(inventoryUpdateError.message);
    }

    const inventorySummary = `Inventory updated. Stock count: ${stock_count}, shelf count: ${shelf_count}.`;

    const { data: updatedTask, error: taskUpdateError } = await supabase
      .from("tasks")
      .update({
        inventory_updated: true,
        inventory_update_summary: inventorySummary,
        inventory_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (taskUpdateError) {
      throw new Error(taskUpdateError.message);
    }

    if (author_name && author_role) {
      const noteText = `Inventory updated: ${inventorySummary}`;

      const { error: noteError } = await supabase.from("task_notes").insert({
        task_id: id,
        author_id: author_id || null,
        author_name,
        author_role,
        note: noteText,
      });

      if (noteError) {
        throw new Error(noteError.message);
      }
    }

    return NextResponse.json({
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}