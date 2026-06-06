import { requireStaffRole } from "@/lib/server-auth";
import SupervisorClient from "./SupervisorClient";

export default async function SupervisorPage() {
  const session = await requireStaffRole(["supervisor"], "/supervisor");

  return <SupervisorClient session={session} />;
}