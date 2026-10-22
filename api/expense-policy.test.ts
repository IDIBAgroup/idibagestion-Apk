import { describe, expect, it } from "vitest";
import { canReviewExpenses, canTransitionExpense } from "@/lib/finance/expense-policy";

describe("expense approval policy", () => {
  it("allows reviewers but not ordinary members to decide claims", () => {
    expect(canReviewExpenses("owner")).toBe(true);
    expect(canReviewExpenses("manager")).toBe(true);
    expect(canReviewExpenses("member")).toBe(false);
  });

  it("allows a pending claim to be approved or rejected exactly once", () => {
    expect(canTransitionExpense("pending", "approved")).toBe(true);
    expect(canTransitionExpense("pending", "rejected")).toBe(true);
    expect(canTransitionExpense("approved", "rejected")).toBe(false);
    expect(canTransitionExpense("rejected", "approved")).toBe(false);
  });
});
