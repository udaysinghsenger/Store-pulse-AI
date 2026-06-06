import Navbar from "@/components/Navbar";
import { requireStaffSession } from "@/lib/server-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await requireStaffSession(
    ["manager", "supervisor", "floor_staff", "head_office"],
    "/staff-login"
  );

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, tasks(feedback_id)")
    .or(
      `recipient_name.eq.${session.display_name},recipient_role.eq.${session.role}`
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar session={session} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">Notifications</h1>

        <p className="mt-2 text-gray-600">
          Updates about assigned tasks, high-priority issues, reassignments, and
          escalations.
        </p>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((item: any) => (
                <div
                  key={item.id}
                  className={`p-5 ${item.read ? "bg-white" : "bg-gray-50"}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-950">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {item.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {item.tasks?.feedback_id ? (
                        <Link
                          href={`/verification/${item.tasks.feedback_id}`}
                          className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                        >
                          Open task
                        </Link>
                      ) : null}

                     {!item.read ? (
                        <form
                            action={`/api/notifications/${item.id}/read`}
                            method="post"
                        >
                            <button
                            type="submit"
                            className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-medium text-white"
                            >
                            Mark read
                            </button>
                        </form>
                        ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No notifications yet.
            </div>
          )}
        </section>
      </main>
    </>
  );
}