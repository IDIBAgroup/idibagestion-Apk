const DEPARTMENT_MANAGEMENT_ROLES = new Set(["platform_admin", "owner", "admin", "manager"]);

export function canManageDepartments(role: string) {
  return DEPARTMENT_MANAGEMENT_ROLES.has(role);
}

export function belongsToDepartmentCompany(isOwner: boolean, hasActiveMembership: boolean) {
  return isOwner || hasActiveMembership;
}
