import { describe, expect, it } from "vitest";
import { canTransitionInvoiceReminder } from "./invoice-reminder-router";

describe("customer invoice reminder lifecycle", () => {
  it("allows a scheduled reminder to be confirmed, failed, or cancelled", () => {
    expect(canTransitionInvoiceReminder("scheduled", "sent")).toBe(true);
    expect(canTransitionInvoiceReminder("scheduled", "failed")).toBe(true);
    expect(canTransitionInvoiceReminder("scheduled", "cancelled")).toBe(true);
  });

  it("keeps terminal reminders immutable", () => {
    expect(canTransitionInvoiceReminder("sent", "scheduled")).toBe(false);
    expect(canTransitionInvoiceReminder("failed", "sent")).toBe(false);
    expect(canTransitionInvoiceReminder("cancelled", "sent")).toBe(false);
  });
});
