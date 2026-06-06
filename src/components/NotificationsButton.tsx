"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StaffSession } from "@/lib/auth";

type NotificationItem = {
  id: string;
  read: boolean;
};

export default function NotificationsButton({
  session,
}: {
  session: StaffSession;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnreadCount() {
    const response = await fetch(
      `/api/notifications?name=${encodeURIComponent(
        session.display_name
      )}&role=${session.role}`
    );

    const result = await response.json();

    if (response.ok) {
      const notifications = (result.notifications || []) as NotificationItem[];
      setUnreadCount(notifications.filter((item) => !item.read).length);
    }
  }

  useEffect(() => {
    loadUnreadCount();

    const interval = window.setInterval(loadUnreadCount, 15000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
      title="Notifications"
    >
      🔔
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-gray-950 px-1.5 py-0.5 text-[10px] text-white">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  );
}