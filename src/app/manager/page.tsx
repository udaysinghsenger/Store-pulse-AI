import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { supabase } from "@/lib/supabase";
import { requireStaffRole } from "@/lib/server-auth";
import Link from "next/link";
import TaskNotesButton from "@/components/TaskNotesButton";
import EscalateTaskButton from "@/components/EscalateTaskButton";
import ReassignTaskButton from "@/components/ReassignTaskButton";

export default async function ManagerPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {  
  const session = await requireStaffRole(["manager"], "/manager");
  const params = searchParams ? await searchParams : {};
  const activeView = params.view || "tasks";
  
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });

  const { data: verifications } = await supabase
    .from("verification_results")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });

  const totalFeedback = feedback?.length || 0;

  const averageRating =
    totalFeedback > 0
      ? (
          feedback!.reduce((sum: number, item: any) => {
            return sum + Number(item.rating || 0);
          }, 0) / totalFeedback
        ).toFixed(1)
      : "0";

  const averageNps =
    totalFeedback > 0
      ? (
          feedback!.reduce((sum: number, item: any) => {
            return sum + Number(item.nps || 0);
          }, 0) / totalFeedback
        ).toFixed(1)
      : "0";

  

  const openTasks =
    tasks?.filter((task: any) => task.status !== "resolved").length || 0;
  const openTaskList =
  tasks?.filter((task: any) => task.status !== "resolved") || [];

const highPriorityOpenTasks =
  tasks?.filter(
    (task: any) =>
      task.status !== "resolved" &&
      (task.priority === "high" || task.priority === "critical")
  ) || [];

  const issueCounts =
    verifications?.reduce<Record<string, number>>((acc: any, item: any) => {
      acc[item.issue_type] = (acc[item.issue_type] || 0) + 1;
      return acc;
    }, {}) || {};

  const topIssue =
    Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  return (
    <>
<Navbar session={session} />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          Store manager dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
        Logged in as {session.display_name}
        </p>

        <p className="mt-2 text-gray-600">
          Managers monitor store health, recurring issues, team workload, and
          unresolved customer experience problems.
        </p>

        <section className="mt-8 grid gap-5 md:grid-cols-5">
        <Link href="/manager?view=feedback">
          <StatCard title="Feedback received" value={totalFeedback} />
        </Link>

        <StatCard title="Average rating" value={averageRating} />

        <StatCard title="Average NPS" value={averageNps} />

        <Link href="/manager?view=high-priority">
          <StatCard title="High priority" value={highPriorityOpenTasks.length} />
        </Link>

        <Link href="/manager?view=open-tasks">
          <StatCard title="Open tasks" value={openTasks} />
        </Link>
      </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Manager attention required</h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-medium">Top issue category</p>
                <p className="mt-1 text-sm text-gray-600">{topIssue}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-medium">Unresolved task load</p>
                <p className="mt-1 text-sm text-gray-600">
                  {openTasks} tasks are still open or in progress.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-medium">Recommended manager action</p>
                <p className="mt-1 text-sm text-gray-600">
                  Review high-priority tasks and check if repeated issues need
                  escalation to head office.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Issue categories</h2>

            <div className="mt-5 space-y-3">
              {Object.entries(issueCounts).map(([issue, count]) => (
                <div
                  key={issue}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                >
                  <span>{issue}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}

              {Object.keys(issueCounts).length === 0 ? (
                <p className="text-sm text-gray-500">
                  No issues yet. Submit feedback first.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
  <div className="border-b p-5">
    <h2 className="text-xl font-semibold">
      {activeView === "feedback"
        ? "Feedback received"
        : activeView === "open-tasks"
          ? "Open tasks"
          : activeView === "high-priority"
            ? "High priority open tasks"
            : "Recent tasks"}
    </h2>
  </div>

  {activeView === "feedback" ? (
    <table className="w-full table-fixed text-left text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-[16%] p-4">Store</th>
          <th className="w-[14%] p-4">Customer</th>
          <th className="w-[10%] p-4">Rating</th>
          <th className="w-[14%] p-4">Recommendation</th>
          <th className="w-[46%] p-4">Feedback</th>
        </tr>
      </thead>

      <tbody>
        {feedback && feedback.length > 0 ? (
          feedback.map((item: any) => (
            <tr key={item.id} className="border-t align-top">
              <td className="p-4">{item.stores?.name}</td>
              <td className="p-4">{item.customer_name || "Anonymous"}</td>
              <td className="p-4">{item.rating}/5</td>
              <td className="p-4">{item.nps}/10</td>
              <td className="p-4">
                <Link
                  href={`/verification/${item.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {item.complaint}
                </Link>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="p-8 text-center text-gray-500" colSpan={5}>
              No feedback found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  ) : (
    <table className="w-full table-fixed text-left text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-[38%] p-4">Task</th>
          <th className="w-[10%] p-4">Priority</th>
          <th className="w-[14%] p-4">Assigned to</th>
          <th className="w-[12%] p-4">Assignment</th>
          <th className="w-[10%] p-4">Status</th>
          <th className="w-[10%] p-4">Escalation</th>
          <th className="w-[10%] p-4">Notes</th>
        </tr>
      </thead>

      <tbody>
        {(activeView === "open-tasks"
          ? openTaskList
          : activeView === "high-priority"
            ? highPriorityOpenTasks
            : tasks || []
        )
          .slice(0, 8)
          .map((task: any) => (
            <tr key={task.id} className="border-t align-top">
              <td className="p-4">
                <Link
                  href={`/verification/${task.feedback_id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {task.title}
                </Link>

                {task.escalated_to_head_office ? (
                  <p className="mt-2 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
                    Escalated to head office
                    {task.escalated_by ? ` by ${task.escalated_by}` : ""}
                    {task.escalation_reason ? `: ${task.escalation_reason}` : ""}
                  </p>
                ) : null}
              </td>

              <td className="p-4">{task.priority}</td>
              <td className="p-4">{task.assigned_to || "Unassigned"}</td>

              <td className="p-4">
                <ReassignTaskButton task={task} session={session} />
              </td>

              <td className="p-4">{task.status}</td>

              <td className="p-4">
                <EscalateTaskButton
                  taskId={task.id}
                  session={session}
                  alreadyEscalated={task.escalated_to_head_office}
                />
              </td>

              <td className="p-4">
                <TaskNotesButton taskId={task.id} session={session} />
              </td>
            </tr>
          ))}

        {(activeView === "open-tasks"
          ? openTaskList
          : activeView === "high-priority"
            ? highPriorityOpenTasks
            : tasks || []
        ).length === 0 ? (
          <tr>
            <td className="p-8 text-center text-gray-500" colSpan={7}>
              No tasks found for this view.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  )}
</section>
      </main>
    </>
  );
}