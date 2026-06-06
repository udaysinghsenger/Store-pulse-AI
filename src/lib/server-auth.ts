import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { StaffRole, StaffSession } from "./auth";

const SESSION_COOKIE = "storepulse_session";
const DEMO_USERS: Record<StaffRole, StaffSession> = {
  manager: {
    id: "manager-demo-user",
    role: "manager",
    display_name: "Store Manager",
  },
  supervisor: {
    id: "supervisor-demo-user",
    role: "supervisor",
    display_name: "Store Supervisor",
  },
  floor_staff: {
    id: "floor-staff-demo-user",
    role: "floor_staff",
    display_name: "Floor Staff",
  },
  head_office: {
    id: "head-office-demo-user",
    role: "head_office",
    display_name: "Head Office",
  },
};

export async function getStaffSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionValue) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(sessionValue, "base64url").toString("utf-8")
    );

    return {
      id: decoded.user_id,
      role: decoded.role,
      display_name: decoded.display_name,
    };
  } catch {
    return null;
  }
}

export async function requireStaffSession(
  allowedRoles?: StaffRole[],
  redirectTo = "/"
): Promise<StaffSession> {
  const session = await getStaffSession();

  if (!session) {
    redirect("/");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireStaffRole(
  allowedRoles: StaffRole[],
  redirectTo = "/"
): Promise<StaffSession> {
  return requireStaffSession(allowedRoles, redirectTo);
}