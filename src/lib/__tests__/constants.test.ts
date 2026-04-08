import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  PAYMENT_METHODS,
  RELATIONSHIPS,
  DECEASED_RELATIONSHIPS,
  REPATRIATION_STATUSES,
  MEMBER_STATUSES,
  REFUSAL_REASONS,
  SUBSCRIPTION_TYPES,
  PAYMENT_PERIODS,
  PERIOD_FILTERS,
} from "../constants";

describe("Constants", () => {
  describe("COUNTRIES", () => {
    it("should have 6 countries", () => {
      expect(COUNTRIES).toHaveLength(6);
    });

    it("should include Algeria, Morocco, Tunisia", () => {
      const values = COUNTRIES.map((c) => c.value);
      expect(values).toContain("algeria");
      expect(values).toContain("morocco");
      expect(values).toContain("tunisia");
    });

    it("should have French and Arabic labels for each country", () => {
      COUNTRIES.forEach((country) => {
        expect(country.label_fr).toBeTruthy();
        expect(country.label_ar).toBeTruthy();
        expect(country.value).toBeTruthy();
      });
    });

    it('should include "other" option', () => {
      expect(COUNTRIES.find((c) => c.value === "other")).toBeDefined();
    });
  });

  describe("PAYMENT_METHODS", () => {
    it("should have 3 methods: cash, transfer, check", () => {
      expect(PAYMENT_METHODS).toHaveLength(3);
      const values = PAYMENT_METHODS.map((m) => m.value);
      expect(values).toEqual(["cash", "transfer", "check"]);
    });

    it("should have bilingual labels", () => {
      PAYMENT_METHODS.forEach((method) => {
        expect(method.label_fr).toBeTruthy();
        expect(method.label_ar).toBeTruthy();
      });
    });
  });

  describe("RELATIONSHIPS", () => {
    it("should have 8 relationships", () => {
      expect(RELATIONSHIPS).toHaveLength(8);
    });

    it("should include head, spouse, son, daughter", () => {
      const values = RELATIONSHIPS.map((r) => r.value);
      expect(values).toContain("head");
      expect(values).toContain("spouse");
      expect(values).toContain("son");
      expect(values).toContain("daughter");
    });

    it("should have bilingual labels", () => {
      RELATIONSHIPS.forEach((rel) => {
        expect(rel.label_fr).toBeTruthy();
        expect(rel.label_ar).toBeTruthy();
      });
    });
  });

  describe("DECEASED_RELATIONSHIPS", () => {
    it('should include "self" option', () => {
      expect(
        DECEASED_RELATIONSHIPS.find((r) => r.value === "self"),
      ).toBeDefined();
    });

    it('should not include "head" from relationships', () => {
      expect(
        DECEASED_RELATIONSHIPS.find((r) => r.value === "head"),
      ).toBeUndefined();
    });
  });

  describe("REPATRIATION_STATUSES", () => {
    it("should have 4 statuses", () => {
      expect(REPATRIATION_STATUSES).toHaveLength(4);
    });

    it("should follow the correct order: declared > in_progress > repatriated > closed", () => {
      const values = REPATRIATION_STATUSES.map((s) => s.value);
      expect(values).toEqual([
        "declared",
        "in_progress",
        "repatriated",
        "closed",
      ]);
    });
  });

  describe("MEMBER_STATUSES", () => {
    it("should have 3 statuses with colors", () => {
      expect(MEMBER_STATUSES).toHaveLength(3);
      MEMBER_STATUSES.forEach((status) => {
        expect(status.color).toBeTruthy();
        expect(status.color).toContain("bg-");
      });
    });

    it("should have pending, active, suspended", () => {
      const values = MEMBER_STATUSES.map((s) => s.value);
      expect(values).toEqual(["pending", "active", "suspended"]);
    });
  });

  describe("REFUSAL_REASONS", () => {
    it('should have 4 reasons including "other"', () => {
      expect(REFUSAL_REASONS).toHaveLength(4);
      expect(REFUSAL_REASONS.find((r) => r.value === "other")).toBeDefined();
    });
  });

  describe("SUBSCRIPTION_TYPES", () => {
    it("should have individual and family", () => {
      expect(SUBSCRIPTION_TYPES).toHaveLength(2);
      expect(SUBSCRIPTION_TYPES[0].value).toBe("individual");
      expect(SUBSCRIPTION_TYPES[1].value).toBe("family");
    });
  });

  describe("PAYMENT_PERIODS", () => {
    it("should generate 5 periods", () => {
      expect(PAYMENT_PERIODS).toHaveLength(5);
    });

    it("should have the format YYYY-YYYY", () => {
      PAYMENT_PERIODS.forEach((p) => {
        expect(p.value).toMatch(/^\d{4}-\d{4}$/);
        expect(p.label).toMatch(/^\d{4}-\d{4}$/);
      });
    });

    it("should include current year", () => {
      const currentYear = new Date().getFullYear();
      const values = PAYMENT_PERIODS.map((p) => p.value);
      const hasCurrentYear = values.some((v) =>
        v.startsWith(String(currentYear)),
      );
      expect(hasCurrentYear).toBe(true);
    });
  });

  describe("PERIOD_FILTERS", () => {
    it("should have 4 filter options", () => {
      expect(PERIOD_FILTERS).toHaveLength(4);
    });

    it("should include custom option", () => {
      expect(PERIOD_FILTERS.find((f) => f.value === "custom")).toBeDefined();
    });
  });
});
