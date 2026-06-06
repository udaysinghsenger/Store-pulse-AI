import { supabase } from "./supabase";
import type { IssueType } from "./types";

type StaffRosterRow = {
  id: string;
  store_id: string;
  staff_name: string;
  role: string;
  floor_zone: string | null;
  shift_start: string | null;
  shift_end: string | null;
  available: boolean | null;
};

type AssignmentInput = {
  store_id: string;
  issue_type: IssueType;
  section?: string;
  visit_time?: string;
};

type AssignmentResult = {
  assigned_role: string;
  assigned_to: string;
  section?: string;
  assignment_reason: string;
  reassignment_allowed: boolean;
  staff_present: StaffRosterRow[];
};

function timeToMinutes(value?: string | null) {
  if (!value) return null;

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function getVisitMinutes(visitTime?: string) {
  if (!visitTime) {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  const date = new Date(visitTime);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getHours() * 60 + date.getMinutes();
}

function isOnShift(staff: StaffRosterRow, visitMinutes: number | null) {
  if (visitMinutes === null) return true;

  const start = timeToMinutes(staff.shift_start);
  const end = timeToMinutes(staff.shift_end);

  if (start === null || end === null) return true;

  if (start <= end) {
    return visitMinutes >= start && visitMinutes <= end;
  }

  return visitMinutes >= start || visitMinutes <= end;
}

function sectionMatches(staffZone?: string | null, section?: string) {
  if (!staffZone || !section) return false;

  const staff = staffZone.toLowerCase();
  const target = section.toLowerCase();

  if (staff === "all sections") return true;

  return staff.includes(target) || target.includes(staff);
}

function requiredRoleForIssue(issueType: IssueType) {
  if (issueType === "inventory_issue") return "Floor Staff";
  if (issueType === "maintenance_issue") return "Floor Staff";
  if (issueType === "queue_issue") return "Store Supervisor";
  if (issueType === "staff_issue") return "Store Supervisor";
  if (issueType === "pricing_issue") return "Store Manager";

  return "Store Supervisor";
}

export async function assignTaskOwner(
  input: AssignmentInput
): Promise<AssignmentResult> {
  const requiredRole = requiredRoleForIssue(input.issue_type);
  const visitMinutes = getVisitMinutes(input.visit_time);

  const { data, error } = await supabase
    .from("staff_roster")
    .select("*")
    .eq("store_id", input.store_id)
    .eq("available", true);

  if (error) {
    throw new Error(error.message);
  }

  const availableStaff = ((data || []) as StaffRosterRow[]).filter((staff) =>
    isOnShift(staff, visitMinutes)
  );

  const roleMatches = availableStaff.filter(
    (staff) => staff.role === requiredRole
  );

  const sectionMatch = roleMatches.find((staff) =>
    sectionMatches(staff.floor_zone, input.section)
  );

  if (sectionMatch) {
    return {
      assigned_role: sectionMatch.role,
      assigned_to: sectionMatch.staff_name,
      section: input.section,
      assignment_reason: `${sectionMatch.staff_name} was selected because they are scheduled in ${sectionMatch.floor_zone} during the feedback visit time.`,
      reassignment_allowed: input.issue_type !== "staff_issue",
      staff_present: availableStaff,
    };
  }

  const fallbackRoleMatch = roleMatches[0];

  if (fallbackRoleMatch) {
    return {
      assigned_role: fallbackRoleMatch.role,
      assigned_to: fallbackRoleMatch.staff_name,
      section: input.section,
      assignment_reason: `${fallbackRoleMatch.staff_name} was selected because they are available during the feedback visit time and match the required role: ${requiredRole}.`,
      reassignment_allowed: input.issue_type !== "staff_issue",
      staff_present: availableStaff,
    };
  }

  const supervisorFallback = availableStaff.find(
    (staff) => staff.role === "Store Supervisor"
  );

  if (supervisorFallback) {
    return {
      assigned_role: supervisorFallback.role,
      assigned_to: supervisorFallback.staff_name,
      section: input.section,
      assignment_reason: `${supervisorFallback.staff_name} was selected because no matching section staff was available, so the task was routed to the store supervisor.`,
      reassignment_allowed: input.issue_type !== "staff_issue",
      staff_present: availableStaff,
    };
  }

  return {
    assigned_role: requiredRole,
    assigned_to: "",
    section: input.section,
    assignment_reason:
      "No scheduled staff member matched the required section and shift time.",
    reassignment_allowed: input.issue_type !== "staff_issue",
    staff_present: availableStaff,
  };
}