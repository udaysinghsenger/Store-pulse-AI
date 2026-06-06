export type StaffRole = "manager" | "supervisor" | "floor_staff" | "head_office";

export type StaffSession = {
  id: string;
  role: StaffRole;
  display_name: string;
};