import { describe, expect, it } from "vitest";
import { calculateItems, canTransitionSalesDocument, invoicePayloadFromAcceptedQuote } from "./sales-document-router";

describe("commercial document totals", () => {
  it("calculates line VAT from the active company rule and rounds FCFA amounts", () => {
    expect(calculateItems([
      { description: "Service", quantity: 2, unitPrice: 1250 },
    ], 18)).toEqual([
      { description: "Service", quantity: 2, unitPrice: 1250, tax: 450, total: 2950 },
    ]);
  });

  it("keeps a document without configured VAT at the tax-free amount", () => {
    expect(calculateItems([
      { description: "Service", quantity: 1, unitPrice: 1250 },
    ], 0)).toEqual([
      { description: "Service", quantity: 1, unitPrice: 1250, tax: 0, total: 1250 },
    ]);
  });

  it("allows only the defined quote lifecycle transitions", () => {
    expect(canTransitionSalesDocument("quote", "draft", "sent")).toBe(true);
    expect(canTransitionSalesDocument("quote", "sent", "counter_proposal")).toBe(true);
    expect(canTransitionSalesDocument("quote", "draft", "accepted")).toBe(false);
    expect(canTransitionSalesDocument("quote", "converted", "sent")).toBe(false);
  });

  it("keeps order and delivery transitions separate from quote statuses", () => {
    expect(canTransitionSalesDocument("order", "draft", "confirmed")).toBe(true);
    expect(canTransitionSalesDocument("delivery", "shipped", "delivered")).toBe(true);
    expect(canTransitionSalesDocument("order", "draft", "sent")).toBe(false);
  });

  it("allows invoice issuance and payment transitions without allowing reopening paid invoices", () => {
    expect(canTransitionSalesDocument("invoice", "draft", "pending")).toBe(true);
    expect(canTransitionSalesDocument("invoice", "pending", "paid")).toBe(true);
    expect(canTransitionSalesDocument("invoice", "pending", "overdue")).toBe(true);
    expect(canTransitionSalesDocument("invoice", "paid", "pending")).toBe(false);
  });

  it("converts an accepted quote to a single draft invoice while retaining its tax and lines", () => {
    const invoice = invoicePayloadFromAcceptedQuote({
      kind: "quote", number: "DEV-2026-0001", clientName: "Client", date: "2026-01-01", expiryDate: "2026-02-01",
      amount: 1000, tax: 180, total: 1180, status: "accepted", items: [{ description: "Service", quantity: 1, unitPrice: 1000, tax: 180, total: 1180 }],
      createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    }, "42", "FAC-2026-0001", "2026-02-02", "2026-03-04", "2026-02-02T12:00:00.000Z");
    expect(invoice).toMatchObject({
      kind: "invoice", number: "FAC-2026-0001", sourceQuoteId: "42", status: "draft",
      amount: 1000, tax: 180, total: 1180, dueDate: "2026-03-04",
    });
    expect(invoice.items).toHaveLength(1);
    expect(invoice.notes).toContain("DEV-2026-0001");
  });
});
