export type ExpenseStatus = "pending" | "approved" | "rejected";
export type ExpenseDecision = Exclude<ExpenseStatus, "pending">;

const reviewRoles = new Set(["platform_admin", "owner", "admin", "manager"]);

export function canReviewExpenses(role: string) {
  return reviewRoles.has(role);
}

export function canTransitionExpense(current: ExpenseStatus, next: ExpenseDecision) {
  return current === "pending" && (next === "approved" || next === "rejected");
}
