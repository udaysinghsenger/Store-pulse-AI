import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { requireStaffRole } from "@/lib/server-auth";

export default async function DataSourcesPage() {
  const session = await requireStaffRole(
  ["manager", "supervisor","head_office"],
  "/data-sources"
);
  const { data: inventory } = await supabase
    .from("inventory")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });

  const { data: staff } = await supabase
    .from("staff_roster")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });

  const { data: queueLogs } = await supabase
    .from("queue_logs")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });

  const { data: maintenanceLogs } = await supabase
    .from("maintenance_logs")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });

  return (
    <>
<Navbar session={session} />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          Connected store data sources
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Logged in as {session.display_name}
        </p>

        <p className="mt-2 text-gray-600">
          These are operational store records used for verification. They are not
customer complaints. Inventory shows stock status, staff roster shows
coverage, queue logs show billing wait time, and facility logs show store
area status.
        </p>

        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Inventory data</h2>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Store</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Shelf</th>
                </tr>
              </thead>

              <tbody>
                {inventory?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.stores?.name}</td>
                    <td className="p-3">{item.product_name}</td>
                    <td className="p-3">{item.color}</td>
                    <td className="p-3">{item.size}</td>
                    <td className="p-3">{item.stock_count}</td>
                    <td className="p-3">{item.shelf_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Staff roster</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {staff?.map((person: any) => (
              <div key={person.id} className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold">{person.staff_name}</p>
                <p className="text-sm text-gray-600">{person.role}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Zone: {person.floor_zone}
                </p>
                <p className="text-sm text-gray-500">
                  Shift: {person.shift_start} - {person.shift_end}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Queue logs</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {queueLogs?.map((log: any) => (
              <div key={log.id} className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold">{log.stores?.name}</p>
                <p className="mt-2 text-sm text-gray-600">
                  {log.time_slot}: {log.avg_wait_minutes} min average wait
                </p>
                <p className="text-sm text-gray-500">
                  Counters open: {log.billing_counters_open}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Facility status logs</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {maintenanceLogs?.map((log: any) => (
              <div key={log.id} className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold">{log.area}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Status: {log.status}
                </p>
                <p className="mt-1 text-sm text-gray-500">{log.notes}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}