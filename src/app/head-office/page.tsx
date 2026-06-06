import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { supabase } from "@/lib/supabase";
import { requireStaffRole } from "@/lib/server-auth";
import TaskNotesButton from "@/components/TaskNotesButton";

export default async function HeadOfficePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = await requireStaffRole(
    ["head_office"],
    "/staff-login?redirect=/head-office"
  );

  const params = searchParams ? await searchParams : {};
  const activeView = params.view || "high-priority";

  const { data: feedback } = await supabase
    .from("feedback")
    .select("*, stores(name, city)")
    .order("created_at", { ascending: false });

  const { data: verifications } = await supabase
    .from("verification_results")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, stores(name, city)")
    .order("created_at", { ascending: false });

  const taskByFeedbackId = new Map(
    (tasks || []).map((task: any) => [task.feedback_id, task])
  );

  const totalFeedback = feedback?.length || 0;

  const verified =
    verifications?.filter((item: any) => item.verification_status === "verified")
      .length || 0;

  const openHighPriorityTasks =
    tasks?.filter(
      (task: any) =>
        task.status !== "resolved" &&
        (task.priority === "high" || task.priority === "critical")
    ) || [];

  const escalatedTasks =
    tasks?.filter((task: any) => task.escalated_to_head_office) || [];

  const averageNps =
    totalFeedback > 0
      ? (
          feedback!.reduce((sum: number, item: any) => {
            return sum + Number(item.nps || 0);
          }, 0) / totalFeedback
        ).toFixed(1)
      : "0";

  const issueCounts =
    verifications?.reduce<Record<string, number>>((acc: any, item: any) => {
      acc[item.issue_type] = (acc[item.issue_type] || 0) + 1;
      return acc;
    }, {}) || {};

  const verifiedPercentage =
    verifications && verifications.length > 0
      ? Math.round((verified / verifications.length) * 100)
      : 0;

  const visibleTasks =
    activeView === "escalated" ? escalatedTasks : openHighPriorityTasks;

  return (
    <>
      <Navbar session={session} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          Head office insights
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Logged in as {session.display_name}
        </p>

        <p className="mt-2 text-gray-600">
          Leadership can see what is actually happening on the ground through
          verified customer experience signals.
        </p>

        <section className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-5">
          <Link href="/head-office?view=feedback" className="h-full">
            <StatCard title="Total feedback" value={totalFeedback} />
          </Link>

          <Link href="/head-office?view=feedback" className="h-full">
            <StatCard title="Average recommendation" value={averageNps} />
          </Link>

          <Link href="/head-office?view=verified" className="h-full">
            <StatCard title="Verified issues" value={verified} />
          </Link>

          <Link href="/head-office?view=high-priority" className="h-full">
            <StatCard
              title="Open high priority"
              value={openHighPriorityTasks.length}
            />
          </Link>

          <Link href="/head-office?view=escalated" className="h-full">
            <StatCard title="Escalated" value={escalatedTasks.length} />
          </Link>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Verified issue categories</h2>

            <div className="mt-5 space-y-3">
              {Object.entries(issueCounts).map(([issue, count]) => (
                <div
                  key={issue}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                >
                  <span>{issue.replaceAll("_", " ")}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}

              {Object.keys(issueCounts).length === 0 ? (
                <p className="text-sm text-gray-500">
                  No issue data yet. Submit feedback first.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-gray-950 p-6 text-white">
            <h2 className="text-xl font-semibold">Business insight</h2>

            <p className="mt-4 text-gray-300">
              {verifiedPercentage}% of processed complaints have been verified
              using operational data. Repeated verified issues should be treated
              as store process signals, not just customer comments.
            </p>

            <p className="mt-4 text-gray-300">
              Inventory issues indicate replenishment gaps. Maintenance issues
              indicate store infrastructure gaps. Staff issues are routed for
              supervisor review because behaviour cannot be fully verified by
              system data alone.
            </p>
          </div>
        </section>

        {activeView === "feedback" ? (
          <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">All customer feedback</h2>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4">Store</th>
                  <th className="p-4">Feedback</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Recommendation</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>

              <tbody>
                {feedback?.map((item: any) => {
                  const task = taskByFeedbackId.get(item.id) as any;

                  return (
                    <tr key={item.id} className="border-t align-top">
                      <td className="p-4">{item.stores?.name}</td>

                      <td className="p-4">
                        <Link
                          href={`/verification/${item.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {item.complaint}
                        </Link>
                      </td>

                      <td className="p-4">{item.rating}/5</td>
                      <td className="p-4">{item.nps}/10</td>

                      <td className="p-4">
                        {new Date(item.created_at).toLocaleString()}
                      </td>

                      <td className="p-4">
                        {task ? (
                          <TaskNotesButton taskId={task.id} session={session} />
                        ) : (
                          <span className="text-xs text-gray-400">No task</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : null}

        {activeView !== "feedback" ? (
          <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">
                {activeView === "verified"
                  ? "Verified issue tasks"
                  : activeView === "escalated"
                    ? "Manager escalations"
                    : "High priority open tasks"}
              </h2>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4">Store</th>
                  <th className="p-4">Task</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assigned to</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Escalation</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>

              <tbody>
                {(activeView === "verified" ? tasks || [] : visibleTasks).map(
                  (task: any) => (
                    <tr key={task.id} className="border-t align-top">
                      <td className="p-4">{task.stores?.name}</td>

                      <td className="p-4">
                        <Link
                          href={`/verification/${task.feedback_id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {task.title}
                        </Link>
                      </td>

                      <td className="p-4">{task.priority}</td>
                      <td className="p-4">{task.assigned_to || "Unassigned"}</td>
                      <td className="p-4">{task.status}</td>

                      <td className="p-4">
                        {task.escalated_to_head_office ? (
                          <div className="max-w-xs rounded-lg bg-gray-100 p-3 text-xs text-gray-700">
                            <p className="font-medium text-gray-950">
                              Escalated by {task.escalated_by || "Manager"}
                            </p>

                            <p className="mt-1">
                              {task.escalation_reason || "No reason provided."}
                            </p>

                            {task.escalated_at ? (
                              <p className="mt-1 text-gray-500">
                                {new Date(task.escalated_at).toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not escalated
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <TaskNotesButton taskId={task.id} session={session} />
                      </td>
                    </tr>
                  )
                )}

                {(activeView === "verified" ? tasks || [] : visibleTasks)
                  .length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={7}>
                      No tasks found for this view.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </>
  );
}