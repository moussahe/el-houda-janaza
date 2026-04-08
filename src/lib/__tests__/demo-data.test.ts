import { describe, it, expect } from "vitest";
import { demoStore, demoAuthUsers } from "../demo-data";

describe("Demo Data", () => {
  describe("Auth users", () => {
    it("should have admin and member accounts", () => {
      expect(demoAuthUsers).toHaveLength(2);
      const admin = demoAuthUsers.find((u) => u.email === "admin@elhouda.fr");
      const member = demoAuthUsers.find(
        (u) => u.email === "ahmed.benali@email.com",
      );
      expect(admin).toBeDefined();
      expect(member).toBeDefined();
    });

    it("should have passwords", () => {
      demoAuthUsers.forEach((user) => {
        expect(user.password).toBeTruthy();
        expect(user.id).toBeTruthy();
      });
    });
  });

  describe("Members", () => {
    const members = demoStore.members;

    it("should have at least 10 members", () => {
      expect(members.length).toBeGreaterThanOrEqual(10);
    });

    it("should have exactly one admin", () => {
      const admins = members.filter((m: any) => m.role === "admin");
      expect(admins).toHaveLength(1);
    });

    it("should have the admin linked to auth user", () => {
      const admin = members.find((m: any) => m.role === "admin");
      expect(admin.user_id).toBe("auth-admin-001");
    });

    it("should have members with all required fields", () => {
      members.forEach((m: any) => {
        expect(m.id).toBeTruthy();
        expect(m.first_name).toBeTruthy();
        expect(m.last_name).toBeTruthy();
        expect(m.phone).toBeTruthy();
        expect(["pending", "active", "suspended"]).toContain(m.status);
        expect(["admin", "member"]).toContain(m.role);
        expect(["individual", "family"]).toContain(m.subscription_type);
        expect([
          "algeria",
          "morocco",
          "tunisia",
          "libya",
          "mauritania",
          "other",
        ]).toContain(m.country_of_origin);
      });
    });

    it("should have mix of statuses", () => {
      const statuses = new Set(members.map((m: any) => m.status));
      expect(statuses.has("active")).toBe(true);
      expect(statuses.has("pending")).toBe(true);
    });

    it("should have both individual and family subscriptions", () => {
      const types = new Set(members.map((m: any) => m.subscription_type));
      expect(types.has("individual")).toBe(true);
      expect(types.has("family")).toBe(true);
    });
  });

  describe("Families", () => {
    const families = demoStore.families;
    const members = demoStore.members;

    it("should have families", () => {
      expect(families.length).toBeGreaterThan(0);
    });

    it("should reference existing members as heads", () => {
      families.forEach((f: any) => {
        const headExists = members.some((m: any) => m.id === f.head_member_id);
        expect(headExists).toBe(true);
      });
    });

    it("should have a name for each family", () => {
      families.forEach((f: any) => {
        expect(f.name).toBeTruthy();
        expect(f.id).toBeTruthy();
      });
    });
  });

  describe("Family Members", () => {
    const familyMembers = demoStore.family_members;
    const families = demoStore.families;

    it("should have family members", () => {
      expect(familyMembers.length).toBeGreaterThan(0);
    });

    it("should reference existing families", () => {
      familyMembers.forEach((fm: any) => {
        const familyExists = families.some((f: any) => f.id === fm.family_id);
        expect(familyExists).toBe(true);
      });
    });

    it("should have valid relationships", () => {
      const validRelationships = [
        "head",
        "spouse",
        "son",
        "daughter",
        "father",
        "mother",
        "brother",
        "sister",
      ];
      familyMembers.forEach((fm: any) => {
        expect(validRelationships).toContain(fm.relationship);
      });
    });

    it("should have one head per family", () => {
      const familyIds = [
        ...new Set(familyMembers.map((fm: any) => fm.family_id)),
      ];
      familyIds.forEach((fid) => {
        const heads = familyMembers.filter(
          (fm: any) => fm.family_id === fid && fm.relationship === "head",
        );
        expect(heads.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Pricing Plans", () => {
    const plans = demoStore.pricing_plans;

    it("should have 2 plans: individual and family", () => {
      expect(plans).toHaveLength(2);
      const types = plans.map((p: any) => p.type);
      expect(types).toContain("individual");
      expect(types).toContain("family");
    });

    it("should have the correct amounts", () => {
      const individual = plans.find((p: any) => p.type === "individual");
      const family = plans.find((p: any) => p.type === "family");
      expect(individual.amount).toBe(85);
      expect(family.amount).toBe(120);
    });

    it("should be annual plans", () => {
      plans.forEach((p: any) => {
        expect(p.period).toBe("annual");
      });
    });

    it("should be active", () => {
      plans.forEach((p: any) => {
        expect(p.is_active).toBe(true);
      });
    });

    it("should have French and Arabic names", () => {
      plans.forEach((p: any) => {
        expect(p.name_fr).toBeTruthy();
        expect(p.name_ar).toBeTruthy();
      });
    });
  });

  describe("Payments", () => {
    const payments = demoStore.payments;
    const members = demoStore.members;

    it("should have payments", () => {
      expect(payments.length).toBeGreaterThan(10);
    });

    it("should reference existing members", () => {
      payments.forEach((p: any) => {
        const memberExists = members.some((m: any) => m.id === p.member_id);
        expect(memberExists).toBe(true);
      });
    });

    it("should have valid payment methods", () => {
      payments.forEach((p: any) => {
        expect(["cash", "transfer", "check"]).toContain(p.payment_method);
      });
    });

    it("should have positive amounts", () => {
      payments.forEach((p: any) => {
        expect(p.amount).toBeGreaterThan(0);
      });
    });

    it("should have period dates", () => {
      payments.forEach((p: any) => {
        expect(p.period_start).toBeTruthy();
        expect(p.period_end).toBeTruthy();
        expect(p.payment_date).toBeTruthy();
      });
    });

    it("period_end should be after period_start", () => {
      payments.forEach((p: any) => {
        expect(new Date(p.period_end).getTime()).toBeGreaterThan(
          new Date(p.period_start).getTime(),
        );
      });
    });
  });

  describe("Repatriation Cases", () => {
    const cases = demoStore.repatriation_cases;
    const members = demoStore.members;

    it("should have at least 2 cases", () => {
      expect(cases.length).toBeGreaterThanOrEqual(2);
    });

    it("should reference existing members", () => {
      cases.forEach((c: any) => {
        const memberExists = members.some((m: any) => m.id === c.member_id);
        expect(memberExists).toBe(true);
      });
    });

    it("should have valid statuses", () => {
      cases.forEach((c: any) => {
        expect(["declared", "in_progress", "repatriated", "closed"]).toContain(
          c.status,
        );
      });
    });

    it("should have deceased info", () => {
      cases.forEach((c: any) => {
        expect(c.deceased_name).toBeTruthy();
        expect(c.date_of_death).toBeTruthy();
        expect(c.destination_country).toBeTruthy();
      });
    });
  });

  describe("Repatriation Agents", () => {
    const agents = demoStore.repatriation_agents;

    it("should have agents", () => {
      expect(agents.length).toBeGreaterThan(0);
    });

    it("should have name and phone", () => {
      agents.forEach((a: any) => {
        expect(a.name).toBeTruthy();
        expect(a.phone).toBeTruthy();
      });
    });

    it("should have countries array", () => {
      agents.forEach((a: any) => {
        expect(Array.isArray(a.countries)).toBe(true);
        expect(a.countries.length).toBeGreaterThan(0);
      });
    });
  });

  describe("App Settings", () => {
    const settings = demoStore.app_settings;

    it("should have mosque name setting", () => {
      const name = settings.find((s: any) => s.key === "mosque_name");
      expect(name).toBeDefined();
      expect(name.value).toContain("El Houda");
    });

    it("should have cities list", () => {
      const cities = settings.find((s: any) => s.key === "cities");
      expect(cities).toBeDefined();
      expect(Array.isArray(cities.value)).toBe(true);
      expect(cities.value.length).toBeGreaterThan(0);
    });
  });

  describe("Contact Messages", () => {
    const messages = demoStore.contact_messages;
    const members = demoStore.members;

    it("should have at least one message", () => {
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should reference existing members", () => {
      messages.forEach((m: any) => {
        const memberExists = members.some((mem: any) => mem.id === m.member_id);
        expect(memberExists).toBe(true);
      });
    });
  });

  describe("Cross-referential integrity", () => {
    it("all family head_member_ids should have family subscription", () => {
      const families = demoStore.families;
      const members = demoStore.members;
      families.forEach((f: any) => {
        const head = members.find((m: any) => m.id === f.head_member_id);
        expect(head).toBeDefined();
        expect(head.subscription_type).toBe("family");
      });
    });

    it("repatriation agent_ids should reference existing agents", () => {
      const cases = demoStore.repatriation_cases;
      const agents = demoStore.repatriation_agents;
      cases.forEach((c: any) => {
        if (c.agent_id) {
          const agentExists = agents.some((a: any) => a.id === c.agent_id);
          expect(agentExists).toBe(true);
        }
      });
    });
  });
});
