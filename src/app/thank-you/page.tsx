import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ThankYouPage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-950 text-2xl text-white">
            ✓
          </div>

          <h1 className="mt-6 text-4xl font-bold text-gray-950">
            Thank you for your feedback
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            We have received your store visit feedback. Our team will review it,
            validate the issue where possible, and use it to improve the store
            experience.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Your feedback helps the store team understand what happened on the
            ground and take the right action.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-gray-950 px-6 py-3 font-medium text-white"
          >
            Back to home
          </Link>
        </section>
      </main>
    </>
  );
}