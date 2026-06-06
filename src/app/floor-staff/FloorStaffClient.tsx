"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TaskNotesButton from "@/components/TaskNotesButton";
import { supabase } from "@/lib/supabase";
import type { StaffSession } from "@/lib/auth";
import EvidenceTable from "@/components/EvidenceTable";

type Task = {
  id: string;
  feedback_id: string;
  store_id: string;
  title: string;
  description: string;
  priority: string;
  assigned_role: string;
  assigned_to: string | null;
  status: string;
  evidence: Record<string, any> | null;
  inventory_updated: boolean;
  inventory_update_summary: string | null;
  inventory_updated_at: string | null;
  created_at: string;
  stores?: {
    name: string;
  };
};

type InventoryDraft = {
  stock_count: string;
  shelf_count: string;
};

type StatusFilter = "all" | "open" | "in_progress" | "resolved";

export default function FloorStaffClient({
  session,
}: {
  session: StaffSession;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [inventoryDrafts, setInventoryDrafts] = useState<
    Record<string, InventoryDraft>
  >({});

  function isInventoryTask(task: Task) {
    return (
      task.evidence?.source === "inventory" ||
      task.title.toLowerCase().includes("restock")
    );
  }


    async function loadTasks() {
    const { data, error } = await supabase
        .from("tasks")
        .select("*, stores(name)")
        .eq("assigned_to", session.display_name)
        .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTasks((data as Task[]) || []);

    if (selectedTask) {
      const refreshedTask = (data as Task[])?.find(
        (task) => task.id === selectedTask.id
      );

      if (refreshedTask) {
        setSelectedTask(refreshedTask);
      }
    }
  }

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  async function markInProgress(task: Task) {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });

    if (response.ok) {
      alert("Task started.");
    } else {
      alert("Could not update task. Please try again.");
    }

    loadTasks();
  }

  async function saveInventoryUpdate(task: Task) {
    const draft = inventoryDrafts[task.id];

    if (!draft?.stock_count || !draft?.shelf_count) {
      alert("Please enter both stock count and shelf count.");
      return;
    }

    const response = await fetch(`/api/tasks/${task.id}/inventory`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stock_count: Number(draft.stock_count),
        shelf_count: Number(draft.shelf_count),
        author_id: session.id,
        author_name: session.display_name,
        author_role: session.role,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Could not update inventory.");
      return;
    }

    alert("Inventory updated successfully.");
    loadTasks();
  }

  async function markResolved(task: Task) {
    if (isInventoryTask(task) && !task.inventory_updated) {
      alert("Please update inventory before marking this task as done.");
      return;
    }

    const note = window.prompt(
      "Add a completion note for supervisor/manager review. You can write what you did, or press OK to submit without a note."
    );

    if (note === null) {
      return;
    }

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        note: note.trim(),
        author_id: session.id,
        author_name: session.display_name,
        author_role: session.role,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Task marked done.");
      setSelectedTask(null);
    } else {
      alert(result.error || "Could not update task. Please try again.");
    }

    loadTasks();
  }

  function countByStatus(status: StatusFilter) {
    if (status === "all") {
      return tasks.length;
    }

    return tasks.filter((task) => task.status === status).length;
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <>
      <Navbar session={session} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          Floor staff task board
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Logged in as {session.display_name}
        </p>

        <p className="mt-2 text-gray-600">
          Floor staff see practical ground-level actions created from verified
          customer feedback.
        </p>

        <section className="mt-8 flex flex-wrap gap-3">
          {[
            { label: "All", value: "all" },
            { label: "Open", value: "open" },
            { label: "In progress", value: "in_progress" },
            { label: "Resolved", value: "resolved" },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value as StatusFilter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                statusFilter === filter.value
                  ? "bg-gray-950 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter.label} ({countByStatus(filter.value as StatusFilter)})
            </button>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Task</th>
                <th className="p-4">Store</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Inventory</th>
                <th className="p-4">Assigned to</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="cursor-pointer border-t align-top hover:bg-gray-50"
                  onClick={() => setSelectedTask(task)}
                >
                  <td className="p-4">
                    <p className="font-medium text-gray-950">{task.title}</p>
                    <p className="mt-1 line-clamp-2 text-gray-500">
                      {task.description}
                    </p>
                  </td>

                  <td className="p-4">{task.stores?.name}</td>
                  <td className="p-4">{task.priority}</td>

                  <td className="p-4">
                    {isInventoryTask(task) ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          task.inventory_updated
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {task.inventory_updated ? "Updated" : "Pending"}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not required</span>
                    )}
                  </td>

                  <td className="p-4">{task.assigned_to || "Unassigned"}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {task.status}
                    </span>
                  </td>

                  <td
                    className="p-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TaskNotesButton taskId={task.id} session={session} />
                  </td>
                </tr>
              ))}

              {filteredTasks.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={7}>
                    No tasks found for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </main>

      {selectedTask ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Task details
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">
                  {selectedTask.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedTask.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg border px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Store</p>
                <p className="mt-1 font-medium">{selectedTask.stores?.name}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Priority</p>
                <p className="mt-1 font-medium">{selectedTask.priority}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Assigned to</p>
                <p className="mt-1 font-medium">
                  {selectedTask.assigned_to || "Unassigned"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Status</p>
                <p className="mt-1 font-medium">{selectedTask.status}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Evidence</p>
              <div className="mt-2">
                <EvidenceTable evidence={selectedTask.evidence} />
            </div>
            </div>

            {isInventoryTask(selectedTask) ? (
              <div className="mt-6 rounded-xl border bg-gray-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-950">
                      Inventory update required
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Update stock and shelf count before marking this task done.
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      selectedTask.inventory_updated
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedTask.inventory_updated ? "Updated" : "Pending"}
                  </span>
                </div>

                {selectedTask.inventory_update_summary ? (
                  <p className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-700">
                    {selectedTask.inventory_update_summary}
                  </p>
                ) : null}

                {!selectedTask.inventory_updated ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      className="rounded-xl border px-3 py-2 text-sm"
                      placeholder="New stock count"
                      value={inventoryDrafts[selectedTask.id]?.stock_count || ""}
                      onChange={(event) =>
                        setInventoryDrafts({
                          ...inventoryDrafts,
                          [selectedTask.id]: {
                            stock_count: event.target.value,
                            shelf_count:
                              inventoryDrafts[selectedTask.id]?.shelf_count ||
                              "",
                          },
                        })
                      }
                    />

                    <input
                      type="number"
                      className="rounded-xl border px-3 py-2 text-sm"
                      placeholder="New shelf count"
                      value={inventoryDrafts[selectedTask.id]?.shelf_count || ""}
                      onChange={(event) =>
                        setInventoryDrafts({
                          ...inventoryDrafts,
                          [selectedTask.id]: {
                            stock_count:
                              inventoryDrafts[selectedTask.id]?.stock_count ||
                              "",
                            shelf_count: event.target.value,
                          },
                        })
                      }
                    />

                    <button
                      type="button"
                      onClick={() => saveInventoryUpdate(selectedTask)}
                      className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-medium text-white md:col-span-2"
                    >
                      Save inventory update
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => markInProgress(selectedTask)}
                className="rounded-xl border px-4 py-2 text-sm font-medium"
              >
                Start
              </button>

              <button
                type="button"
                onClick={() => markResolved(selectedTask)}
                className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-medium text-white"
              >
                Mark done
              </button>

              <Link
                href={`/verification/${selectedTask.feedback_id}`}
                className="rounded-xl border px-4 py-2 text-sm font-medium"
              >
                View verification
              </Link>

              <TaskNotesButton taskId={selectedTask.id} session={session} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}