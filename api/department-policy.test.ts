import { describe, expect, it } from "vitest";
import { belongsToDepartmentCompany, canManageDepartments } from "@/lib/hr/department-policy";
import { subscriptionFeatureForRoute } from "@/lib/subscription-features";

describe("department access policy", () => {
  it("allows department management only to company managers and administrators", () => {
    expect(["platform_admin", "owner", "admin", "manager"].every(canManageDepartments)).toBe(true);
    expect(["member", "guest", "unknown"].some(canManageDepartments)).toBe(false);
  });

  it("accepts a company owner or active member for department assignments", () => {
    expect(belongsToDepartmentCompany(true, false)).toBe(true);
    expect(belongsToDepartmentCompany(false, true)).toBe(true);
    expect(belongsToDepartmentCompany(false, false)).toBe(false);
  });

  it("gates the administration route with the HR subscription feature", () => {
    expect(subscriptionFeatureForRoute("/admin/departments")).toBe("hr");
  });
});
