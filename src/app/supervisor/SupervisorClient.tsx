"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TaskNotesButton from "@/components/TaskNotesButton";
import { supabase } from "@/lib/supabase";
import type { StaffSession } from "@/lib/auth";
import ReassignTaskButton from "@/components/ReassignTaskButton";

type Task = {
  id: string;
  feedback_id: string;
  title: string;
  description: string;
  priority: string;
  assigned_role: string;
  assigned_to: string | null;
  status: string;
  created_at: string;
  issue_type?: string;
  section?: string | null;
  assignment_reason?: string | null;
  reassignment_allowed?: boolean;
  store_id: string;
  stores?: {
    name: string;
    
    
  };
};

export default function SupervisorClient({
  session,
}: {
  session: StaffSession;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<"all" | "open" | "high">("all");

  async function loadTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, stores(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTasks((data as Task[]) || []);
  }

  async function updateTask(id: string, updates: { status?: string }) {
    let note = "";

    if (updates.status === "resolved") {
      const enteredNote = window.prompt(
        "Add a note before resolving this task. You can write your review note, or press OK to resolve without a note."
      );

      if (enteredNote === null) {
        return;
      }

      note = enteredNote.trim();
    }

    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        note,
        author_id: session.id,
        author_name: session.display_name,
        author_role: session.role,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Could not update task.");
      return;
    }

    loadTasks();
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const openTasks = tasks.filter((task) => task.status !== "resolved");
  const highPriority = tasks.filter(
    (task) => task.priority === "high" || task.priority === "critical"
  );
  const visibleTasks =
  activeView === "open"
    ? openTasks
    : activeView === "high"
      ? highPriority
      : tasks;

  return (
    <>
      <Navbar session={session} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          Supervisor dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Logged in as {session.display_name}
        </p>

        <p className="mt-2 text-gray-600">
          Supervisors receive verified issues and review-needed complaints as
          operational tasks.
        </p>

       <section className="mt-8 grid gap-5 md:grid-cols-3">
        <button
            type="button"
            onClick={() => setActiveView("open")}
            className={`rounded-2xl border bg-white p-5 text-left ${
            activeView === "open" ? "ring-2 ring-gray-950" : ""
            }`}
        >
            <p className="text-sm text-gray-500">Open tasks</p>
            <p className="mt-2 text-3xl font-bold">{openTasks.length}</p>
        </button>

        <button
            type="button"
            onClick={() => setActiveView("high")}
            className={`rounded-2xl border bg-white p-5 text-left ${
            activeView === "high" ? "ring-2 ring-gray-950" : ""
            }`}
        >
            <p className="text-sm text-gray-500">High priority</p>
            <p className="mt-2 text-3xl font-bold">{highPriority.length}</p>
        </button>

        <button
            type="button"
            onClick={() => setActiveView("all")}
            className={`rounded-2xl border bg-white p-5 text-left ${
            activeView === "all" ? "ring-2 ring-gray-950" : ""
            }`}
        >
            <p className="text-sm text-gray-500">Total tasks</p>
            <p className="mt-2 text-3xl font-bold">{tasks.length}</p>
        </button>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Task</th>
                <th className="p-4">Store</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assigned role</th>
                <th className="p-4">Assigned to</th>
                <th className="p-4">Assignment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>

            <tbody>
                {visibleTasks.map((task) => (
                    <tr key={task.id} className="border-t align-top">
                  <td className="p-4">
                    <Link
                      href={`/verification/${task.feedback_id}`}
                      className="font-medium text-gray-950 underline-offset-4 hover:underline"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-1 text-gray-500">{task.description}</p>
                  </td>

                  <td className="p-4">{task.stores?.name}</td>
                  <td className="p-4">{task.priority}</td>
                  <td className="p-4">{task.assigned_role || "Unassigned"}</td>
                  <td className="p-4">{task.assigned_to || "Unassigned"}</td>

                <td className="p-4">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                        {task.section || "No section"}
                        </p>

                        <ReassignTaskButton
                        task={task}
                        session={session}
                        onUpdated={loadTasks}
                        />
                    </div>
                    </td>

                  <td className="p-4">
                    
                    <select
                      className="rounded-lg border px-3 py-2"
                      value={task.status}
                      onChange={(event) =>
                        updateTask(task.id, {
                          status: event.target.value,
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <TaskNotesButton taskId={task.id} session={session} />
                  </td>
                </tr>
              ))}

              {visibleTasks.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={8}>
                    No tasks found for this view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}