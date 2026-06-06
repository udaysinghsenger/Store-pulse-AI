"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

const redirectTo = searchParams.get("redirect");
  const [form, setForm] = useState({
    user_id: "",
    role: "manager",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.error || "Login failed");
      return;
    }

   const roleRoutes: Record<string, string> = {
  manager: "/manager",
  supervisor: "/supervisor",
  floor_staff: "/floor-staff",
  head_office: "/head-office",
};

router.push(redirectTo || roleRoutes[result.user.role] || "/manager");
router.refresh();
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-lg px-6 py-12">
        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
            Staff access
          </p>

          <h1 className="mt-4 text-3xl font-bold text-gray-950">
            Login to StorePulse AI
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Managers, supervisors, floor staff, and head office users can access
            their role-specific dashboards here.
          </p>

          <form onSubmit={login} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium">User ID</label>
              <input
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={form.user_id}
                onChange={(event) =>
                  setForm({ ...form, user_id: event.target.value })
                }
                placeholder="manager.storepulse"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
              >
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="floor_staff">Floor Staff</option>
                <option value="head_office">Head Office</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Enter password"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gray-950 px-6 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          
        </section>
      </main>
    </>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLoginContent />
    </Suspense>
  );
}