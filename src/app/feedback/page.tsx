"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Store = {
  id: string;
  name: string;
  city: string;
  mall_name: string | null;
};

export default function FeedbackPage() {
  const router = useRouter();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    store_id: "",
    customer_name: "Demo Customer",
    rating: 2,
    nps: 3,
    complaint:
      "I visited the Phoenix Mall store to buy black slim fit jeans in size 32, but staff said it was unavailable. This was frustrating.",
  });

  useEffect(() => {
    async function loadStores() {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setStores((data as Store[]) || []);

      if (data?.[0]) {
        setForm((prev) => ({ ...prev, store_id: data[0].id }));
      }
    }

    loadStores();
  }, []);

  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        visit_time: new Date().toISOString(),
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.error || "Failed to submit feedback");
      return;
    }

    router.push("/thank-you");  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          How was your store visit?
        </h1>

        <p className="mt-2 text-gray-600">
          Share what happened during your visit. If your feedback mentions a
          product, size, staff issue, billing delay, or store facility issue, the
          system will understand it automatically.
        </p>

        <form onSubmit={submitFeedback} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium">Store visited</label>
            <select
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={form.store_id}
              onChange={(event) =>
                setForm({ ...form, store_id: event.target.value })
              }
              required
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} - {store.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Your name</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={form.customer_name}
              onChange={(event) =>
                setForm({ ...form, customer_name: event.target.value })
              }
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Overall store experience
            </label>
            <select
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={form.rating}
              onChange={(event) =>
                setForm({ ...form, rating: Number(event.target.value) })
              }
            >
              <option value={5}>Excellent</option>
              <option value={4}>Good</option>
              <option value={3}>Average</option>
              <option value={2}>Poor</option>
              <option value={1}>Very poor</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              How likely are you to recommend this store to someone else?
            </label>
            <p className="mt-1 text-xs text-gray-500">
              0 means not likely at all, 10 means extremely likely.
            </p>
            <input
              type="range"
              min="0"
              max="10"
              className="mt-3 w-full"
              value={form.nps}
              onChange={(event) =>
                setForm({ ...form, nps: Number(event.target.value) })
              }
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span className="font-semibold text-gray-950">
                Selected: {form.nps}
              </span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Tell us what happened
            </label>
            <textarea
              className="mt-1 min-h-40 w-full rounded-xl border px-4 py-3"
              value={form.complaint}
              onChange={(event) =>
                setForm({ ...form, complaint: event.target.value })
              }
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Example: “I wanted black slim fit jeans in size 32, but the staff
              said it was unavailable.”
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gray-950 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Understanding feedback..." : "Submit feedback"}
          </button>
        </form>
      </main>
    </>
  );
}