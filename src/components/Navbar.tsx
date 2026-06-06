"use client";


import Link from "next/link";
import type { StaffSession } from "@/lib/auth";
import NotificationsButton from "@/components/NotificationsButton";

export default function Navbar({
  session,
}: {
  session?: StaffSession | null;
}) {
  const roleLink =
    session?.role === "manager"
      ? "/manager"
      : session?.role === "supervisor"
        ? "/supervisor"
        : session?.role === "floor_staff"
          ? "/floor-staff"
          : session?.role === "head_office"
            ? "/head-office"
            : null;

  const roleLabel =
    session?.role === "manager"
      ? "Manager Dashboard"
      : session?.role === "supervisor"
        ? "Supervisor Dashboard"
        : session?.role === "floor_staff"
          ? "Floor Staff Board"
          : session?.role === "head_office"
            ? "Head Office"
            : null;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-950">
          StorePulse AI
        </Link>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/feedback" className="hover:text-gray-950">
            Feedback
          </Link>

          {!session ? (
            <Link href="/staff-login" className="hover:text-gray-950">
              Staff Portal
            </Link>
          ) : null}

          {session && roleLink && roleLabel ? (
            <Link href={roleLink} className="font-medium text-gray-950">
              {roleLabel}
            </Link>
          ) : null}

          {session &&
          (session.role === "manager" ||
            session.role === "supervisor" ||
            session.role === "head_office") ? (
            <Link href="/data-sources" className="hover:text-gray-950">
              Data Sources
            </Link>
          ) : null}

          {session ? <NotificationsButton session={session} /> : null}
          {session ? (
            <a href="/api/logout" className="hover:text-gray-950">
              Logout
            </a>
          ) : null}
        </div>
      </div>
    </nav>
  );
}