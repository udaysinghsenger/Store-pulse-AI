import { supabase } from "./supabase";
import { assignTaskOwner } from "./task-assignment";
import { AIClassification, VerificationResult } from "./types";

export async function verifyFeedback(params: {
  store_id: string;
  classification: AIClassification;
  product_name?: string;
  color?: string;
  size?: string;
  visit_time?: string;
}): Promise<VerificationResult> {
  const { store_id, classification } = params;

  if (
    classification.sentiment === "positive" ||
    classification.issue_type === "general_experience"
  ) {
    return {
      verification_status: "no_action_required",
      confidence_score: 90,
      evidence: {
        reason:
          "Feedback is positive or does not contain an operational issue that needs action.",
      },
      recommended_action: "No operational task required.",
      priority: "low",
      assigned_role: "",
      assigned_to: "",
      section: classification.section,
      assignment_reason: "No task created for positive/general feedback.",
      reassignment_allowed: false,
    };
  }

  if (classification.issue_type === "inventory_issue") {
    const productName = classification.product_name || params.product_name;
    const color = classification.color || params.color;
    const size = classification.size || params.size;

    let query = supabase
      .from("inventory")
      .select("*")
      .eq("store_id", store_id);

    if (productName) {
      query = query.ilike("product_name", `%${productName}%`);
    }

    if (color) {
      query = query.ilike("color", `%${color}%`);
    }

    if (size) {
      query = query.eq("size", size);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const item = data?.[0];

    const assignment = await assignTaskOwner({
      store_id,
      issue_type: "inventory_issue",
      section: classification.section || "Mens Section",
      visit_time: params.visit_time,
    });

    if (!item) {
      return {
        verification_status: "needs_review",
        confidence_score: 64,
        evidence: {
          source: "inventory",
          reason: "No matching inventory record found",
          product_name: productName,
          color,
          size,
          section: assignment.section,
          assignment_reason: assignment.assignment_reason,
          staff_present: assignment.staff_present,
        },
        recommended_action:
          "Supervisor should manually verify the product details and check store inventory.",
        priority: "medium",
        assigned_role: "Store Supervisor",
        assigned_to:
          assignment.assigned_role === "Store Supervisor"
            ? assignment.assigned_to
            : "",
        section: assignment.section,
        assignment_reason: assignment.assignment_reason,
        reassignment_allowed: true,
      };
    }

    if (item.stock_count <= 0 || item.shelf_count <= 0) {
      return {
        verification_status: "verified",
        confidence_score: 94,
        evidence: {
          source: "inventory",
          product_name: item.product_name,
          color: item.color,
          size: item.size,
          stock_count: item.stock_count,
          shelf_count: item.shelf_count,
          last_restocked: item.last_restocked,
          section: assignment.section,
          assignment_reason: assignment.assignment_reason,
          staff_present: assignment.staff_present,
        },
        recommended_action: `Restock ${item.product_name} ${item.color || ""} size ${
          item.size || ""
        } and check shelf availability.`,
        priority: "high",
        assigned_role: assignment.assigned_role,
        assigned_to: assignment.assigned_to,
        section: assignment.section,
        assignment_reason: assignment.assignment_reason,
        reassignment_allowed: true,
      };
    }

    return {
      verification_status: "unverified",
      confidence_score: 82,
      evidence: {
        source: "inventory",
        product_name: item.product_name,
        color: item.color,
        size: item.size,
        stock_count: item.stock_count,
        shelf_count: item.shelf_count,
        section: assignment.section,
        assignment_reason: assignment.assignment_reason,
        staff_present: assignment.staff_present,
      },
      recommended_action:
        "Stock exists in system. Supervisor should check shelf placement or staff communication.",
      priority: "medium",
      assigned_role: "Store Supervisor",
      assigned_to: "",
      section: assignment.section,
      assignment_reason:
        "Stock exists, so this requires supervisor review instead of direct floor staff assignment.",
      reassignment_allowed: true,
    };
  }

  if (classification.issue_type === "queue_issue") {
    const assignment = await assignTaskOwner({
      store_id,
      issue_type: "queue_issue",
      section: classification.section || "Billing Counter",
      visit_time: params.visit_time,
    });

    const { data, error } = await supabase
      .from("queue_logs")
      .select("*")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const queue = data?.[0];

    return {
      verification_status:
        queue && queue.avg_wait_minutes >= 12 ? "verified" : "needs_review",
      confidence_score: queue && queue.avg_wait_minutes >= 12 ? 90 : 68,
      evidence: {
        source: "queue_logs",
        latest_queue_log: queue || null,
        section: assignment.section,
        assignment_reason: assignment.assignment_reason,
        staff_present: assignment.staff_present,
      },
      recommended_action:
        "Review billing counter activity and assign support during peak wait time.",
      priority: queue && queue.avg_wait_minutes >= 12 ? "high" : "medium",
      assigned_role: assignment.assigned_role,
      assigned_to: assignment.assigned_to,
      section: assignment.section,
      assignment_reason: assignment.assignment_reason,
      reassignment_allowed: true,
    };
  }

  if (classification.issue_type === "maintenance_issue") {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const issue = data?.find((log) =>
      ["dirty", "broken", "not_working", "pending"].includes(
        String(log.status).toLowerCase()
      )
    );

    const assignment = await assignTaskOwner({
      store_id,
      issue_type: "maintenance_issue",
      section: classification.section || issue?.area || "Main Floor",
      visit_time: params.visit_time,
    });

    return {
      verification_status: issue ? "verified" : "needs_review",
      confidence_score: issue ? 88 : 60,
      evidence: {
        source: "maintenance_logs",
        issue: issue || null,
        logs: data || [],
        section: assignment.section,
        assignment_reason: assignment.assignment_reason,
        staff_present: assignment.staff_present,
      },
      recommended_action: issue
        ? `Fix maintenance issue in ${issue.area}.`
        : "Assign staff to inspect the reported area manually.",
      priority: issue ? "high" : "medium",
      assigned_role: assignment.assigned_role,
      assigned_to: assignment.assigned_to,
      section: assignment.section,
      assignment_reason: assignment.assignment_reason,
      reassignment_allowed: true,
    };
  }

  if (classification.issue_type === "staff_issue") {
    const assignment = await assignTaskOwner({
      store_id,
      issue_type: "staff_issue",
      section: classification.section || "Main Floor",
      visit_time: params.visit_time,
    });

    return {
      verification_status: "needs_review",
      confidence_score: 70,
      evidence: {
        source: "staff_roster",
        reason:
          "Staff behavior cannot be fully verified from system data. This requires supervisor review.",
        section: assignment.section,
        assignment_reason: assignment.assignment_reason,
        staff_present: assignment.staff_present,
      },
      recommended_action:
        "Supervisor should review staff behavior complaint and check staff coverage in the reported section.",
      priority: "medium",
      assigned_role: assignment.assigned_role,
      assigned_to: assignment.assigned_to,
      section: assignment.section,
      assignment_reason: assignment.assignment_reason,
      reassignment_allowed: false,
    };
  }

  const assignment = await assignTaskOwner({
    store_id,
    issue_type: "staff_issue",
    section: classification.section || "Main Floor",
    visit_time: params.visit_time,
  });

  return {
    verification_status: "needs_review",
    confidence_score: 55,
    evidence: {
      reason: "Issue type does not have a direct automated verification source.",
      section: assignment.section,
      assignment_reason: assignment.assignment_reason,
      staff_present: assignment.staff_present,
    },
    recommended_action: "Route to store supervisor for manual review.",
    priority: "low",
    assigned_role: assignment.assigned_role,
    assigned_to: assignment.assigned_to,
    section: assignment.section,
    assignment_reason: assignment.assignment_reason,
    reassignment_allowed: false,
  };
}