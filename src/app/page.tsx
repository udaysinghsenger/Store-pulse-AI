import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="rounded-3xl bg-gray-950 px-8 py-16 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">
            Store visit feedback
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-tight">
            Tell us how your store visit went.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-gray-300">
            Your feedback helps the store team understand what happened during
            your visit and take action where needed.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/feedback"
              className="rounded-full bg-white px-6 py-3 font-medium text-gray-950"
            >
              Start feedback
            </Link>

            
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6">
            <h3 className="text-lg font-semibold">Share your experience</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tell us what went well or what did not work during your store
              visit.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <h3 className="text-lg font-semibold">We understand the issue</h3>
            <p className="mt-2 text-sm text-gray-600">
              StorePulse AI identifies whether your feedback is about stock,
              billing wait time, store facilities, or staff support.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <h3 className="text-lg font-semibold">The store team acts</h3>
            <p className="mt-2 text-sm text-gray-600">
              Verified issues are routed to the right store team so the problem
              can be reviewed or fixed.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}