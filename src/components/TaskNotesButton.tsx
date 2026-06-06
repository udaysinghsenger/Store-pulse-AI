"use client";

import { useEffect, useState } from "react";
import type { StaffSession } from "@/lib/auth";

type TaskNote = {
  id: string;
  task_id: string;
  author_id: string | null;
  author_name: string;
  author_role: string;
  note: string;
  created_at: string;
};

export default function TaskNotesButton({
  taskId,
  session,
}: {
  taskId: string;
  session: StaffSession;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadNotes() {
    const response = await fetch(`/api/tasks/${taskId}/notes`);
    const result = await response.json();

    if (response.ok) {
      setNotes(result.notes || []);
    }
  }

  async function addNote() {
    if (!newNote.trim()) {
      alert("Please write a note first.");
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/tasks/${taskId}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note: newNote,
        author_id: session.id,
        author_name: session.display_name,
        author_role: session.role,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      alert("Could not add note. Please try again.");
      return;
    }

    setNewNote("");
    loadNotes();
  }

  useEffect(() => {
    if (open) {
      loadNotes();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
      >
        View notes
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Task notes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Notes added by floor staff, supervisors, managers, and head
                  office reviewers.
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

            <div className="mt-6 space-y-4">
              {notes.map((item) => (
                <div key={item.id} className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-gray-950">
                      {item.author_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.author_role.replaceAll("_", " ")} •{" "}
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {item.note}
                  </p>
                </div>
              ))}

              {notes.length === 0 ? (
                <p className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-500">
                  No notes added yet.
                </p>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border p-4">
              <label className="text-sm font-medium text-gray-700">
                Add note
              </label>

              <textarea
                className="mt-2 min-h-28 w-full rounded-xl border px-3 py-2 text-sm"
                value={newNote}
                onChange={(event) => setNewNote(event.target.value)}
                placeholder="Write your note for the next reviewer..."
              />

              <button
                type="button"
                disabled={loading}
                onClick={addNote}
                className="mt-3 rounded-xl bg-gray-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add note"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}