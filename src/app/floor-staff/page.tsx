import { requireStaffRole } from "@/lib/server-auth";
import FloorStaffClient from "./FloorStaffClient";

export default async function FloorStaffPage() {
  const session = await requireStaffRole(["floor_staff"], "/floor-staff");

  return <FloorStaffClient session={session} />;
}