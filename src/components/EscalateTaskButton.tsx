"use client";

import { useState } from "react";
import type { StaffSession } from "@/lib/auth";

export default function EscalateTaskButton({
  taskId,
  session,
  alreadyEscalated,
}: {
  taskId: string;
  session: StaffSession;
  alreadyEscalated?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function escalateTask() {
    if (alreadyEscalated) {
      alert("This task is already escalated to head office.");
      return;
    }

    const reason = window.prompt(
      "Why are you escalating this task to head office?"
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      alert("Please enter an escalation reason.");
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        escalated_to_head_office: true,
        escalation_reason: reason.trim(),
        escalated_by: session.display_name,
        note: `Escalated to head office by ${session.display_name}: ${reason.trim()}`,
        author_id: session.id,
        author_name: session.display_name,
        author_role: session.role,
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.error || "Could not escalate task.");
      return;
    }

    alert("Task escalated to head office.");
    window.location.reload();
  }

  return (
    <button
      type="button"
      disabled={loading || alreadyEscalated}
      onClick={escalateTask}
      className={`rounded-lg px-3 py-2 text-xs font-medium ${
        alreadyEscalated
          ? "border bg-gray-100 text-gray-400"
          : "bg-gray-950 text-white hover:bg-gray-800"
      } disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {alreadyEscalated
        ? "Escalated"
        : loading
          ? "Escalating..."
          : "Escalate"}
    </button>
  );
}