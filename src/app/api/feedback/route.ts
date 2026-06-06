import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { classifyFeedback } from "@/lib/gemini";
import { verifyFeedback } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      store_id,
      customer_name,
      rating,
      nps,
      complaint,
      visit_time,
    } = body;

    if (!store_id || !complaint) {
      return NextResponse.json(
        { error: "store_id and complaint are required" },
        { status: 400 }
      );
    }

    const classification = await classifyFeedback({
      complaint,
    });

    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback")
      .insert({
        store_id,
        customer_name,
        rating,
        nps,
        complaint,
        product_name: classification.product_name || null,
        color: classification.color || null,
        size: classification.size || null,
        visit_time,
      })
      .select()
      .single();

    if (feedbackError) {
      throw new Error(feedbackError.message);
    }

    const verification = await verifyFeedback({
      store_id,
      classification,
      product_name: classification.product_name,
      color: classification.color,
      size: classification.size,
      visit_time,

    });

    const { data: verificationResult, error: verificationError } =
      await supabase
        .from("verification_results")
        .insert({
          feedback_id: feedback.id,
          issue_type: classification.issue_type,
          sentiment: classification.sentiment,
          extracted_claim: classification,
          verification_status: verification.verification_status,
          confidence_score: verification.confidence_score,
          evidence: verification.evidence,
          recommended_action: verification.recommended_action,
        })
        .select()
        .single();

    if (verificationError) {
      throw new Error(verificationError.message);
    }

    let task = null;

        const shouldCreateTask =
      classification.sentiment !== "positive" &&
      classification.issue_type !== "general_experience" &&
      classification.issue_type !== "unknown" &&
      (verification.verification_status === "verified" ||
        verification.verification_status === "needs_review");

    if (shouldCreateTask) {
      const { data: createdTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          feedback_id: feedback.id,
          store_id,
          issue_type: classification.issue_type,
          title: verification.recommended_action,
          description: `Customer complaint: ${complaint}`,
          priority: verification.priority,
          assigned_role: verification.assigned_role,
          assigned_to: verification.assigned_to || null,
          section: verification.section || classification.section || null,
          assignment_reason: verification.assignment_reason || null,
          reassignment_allowed: verification.reassignment_allowed ?? true,
          status: "open",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          evidence: verification.evidence,
        })
        .select()
        .single();

      if (taskError) {
        throw new Error(taskError.message);
      }

      task = createdTask;
      if (createdTask.assigned_to) {
        await supabase.from("notifications").insert({
          recipient_name: createdTask.assigned_to,
          recipient_role: null,
          title: "New task assigned",
          message: createdTask.title,
          task_id: createdTask.id,
        });
      }

      if (
          createdTask.priority === "high" ||
          createdTask.priority === "critical"
        ) {
          await supabase.from("notifications").insert([
            {
              recipient_name: null,
              recipient_role: "supervisor",
              title: "High priority task created",
              message: createdTask.title,
              task_id: createdTask.id,
            },
            {
              recipient_name: null,
              recipient_role: "manager",
              title: "High priority task created",
              message: createdTask.title,
              task_id: createdTask.id,
            },
            {
              recipient_name: null,
              recipient_role: "head_office",
              title: "High priority task created",
              message: createdTask.title,
              task_id: createdTask.id,
            },
          ]);
        }
    }

    return NextResponse.json({
      feedback,
      classification,
      verification: verificationResult,
      task,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while processing feedback" },
      { status: 500 }
    );
  }
}