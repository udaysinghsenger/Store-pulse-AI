"use client";

import { useEffect, useState } from "react";
import type { StaffSession } from "@/lib/auth";

type StaffMember = {
  id: string;
  staff_name: string;
  role: string;
  floor_zone: string | null;
};

export default function ReassignTaskButton({
  task,
  session,
  onUpdated,
}: {
  task: {
    id: string;
    store_id: string;
    assigned_role: string;
    issue_type?: string;
    reassignment_allowed?: boolean;
  };
  session: StaffSession;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(false);

  const locked =
    task.reassignment_allowed === false || task.issue_type === "staff_issue";

  async function loadStaff() {
    const response = await fetch(
      `/api/staff?store_id=${task.store_id}&role=${encodeURIComponent(
        task.assigned_role
      )}`
    );

    const result = await response.json();

    if (response.ok) {
      setStaff(result.staff || []);
    }
  }

  async function reassign() {
    const selected = staff.find((item) => item.id === selectedStaffId);

    if (!selected) {
      alert("Please select a staff member.");
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assigned_to: selected.staff_name,
        assignment_reason: `Manually reassigned by ${session.display_name} to ${selected.staff_name}.`,
        reassigned_by: session.display_name,
        note: `Task manually reassigned by ${session.display_name} to ${selected.staff_name}.`,
        author_id: session.id,
        author_name: session.display_name,
        author_role: session.role,
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.error || "Could not reassign task.");
      return;
    }

    alert("Task reassigned successfully.");
    setOpen(false);
    onUpdated?.();
  }

  useEffect(() => {
    if (open) {
      loadStaff();
    }
  }, [open]);

  if (locked) {
    return (
      <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-400">
        Reassignment locked
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
      >
        Reassign
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Reassign task</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose from available scheduled staff for this role.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <select
              className="mt-5 w-full rounded-xl border px-3 py-2 text-sm"
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
            >
              <option value="">Select staff member</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.staff_name} — {person.floor_zone || person.role}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={loading}
              onClick={reassign}
              className="mt-4 rounded-xl bg-gray-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Reassigning..." : "Confirm reassignment"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}