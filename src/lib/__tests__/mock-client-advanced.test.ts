import { describe, it, expect, beforeEach } from "vitest";
import { createMockClient, resetMockStore } from "../supabase/mock-client";

describe("Mock Client - Advanced Query Patterns", () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    resetMockStore();
    client = createMockClient();
  });

  describe("Relation resolution", () => {
    it("should resolve payments -> member relation", async () => {
      const { data } = (await client
        .from("payments")
        .select("*, member:members(first_name, last_name)")
        .limit(5)) as any;

      expect(data.length).toBeGreaterThan(0);
      data.forEach((p: any) => {
        expect(p.member).toBeDefined();
        expect(p.member.first_name).toBeTruthy();
        expect(p.member.last_name).toBeTruthy();
        // Should NOT have other member fields
        expect(p.member.phone).toBeUndefined();
      });
    });

    it("should resolve repatriation_cases -> member + agent relations", async () => {
      const { data } = (await client
        .from("repatriation_cases")
        .select(
          "*, member:members(first_name, last_name), agent:repatriation_agents(name, phone)",
        )) as any;

      expect(data.length).toBeGreaterThan(0);
      data.forEach((c: any) => {
        expect(c.member).toBeDefined();
        if (c.agent_id) {
          expect(c.agent).toBeDefined();
          expect(c.agent.name).toBeTruthy();
        }
      });
    });

    it("should resolve contact_messages -> member relation", async () => {
      const { data } = (await client
        .from("contact_messages")
        .select("*, member:members(first_name, last_name, phone)")) as any;

      expect(data.length).toBeGreaterThan(0);
      data.forEach((m: any) => {
        expect(m.member).toBeDefined();
        expect(m.member.first_name).toBeTruthy();
        expect(m.member.phone).toBeTruthy();
      });
    });

    it("should resolve families -> head_member + family_members", async () => {
      const { data } = (await client
        .from("families")
        .select(
          "*, head_member:members!families_head_member_id_fkey(id, first_name, last_name, phone, status), members:family_members(*)",
        )) as any;

      expect(data.length).toBeGreaterThan(0);
      data.forEach((f: any) => {
        expect(f.head_member).toBeDefined();
        expect(f.head_member.first_name).toBeTruthy();
        expect(f.members).toBeDefined();
        expect(Array.isArray(f.members)).toBe(true);
        expect(f.members.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Complex filters", () => {
    it("should combine eq + order + limit", async () => {
      const { data } = (await client
        .from("members")
        .select("*")
        .eq("status", "active")
        .order("last_name", { ascending: true })
        .limit(3)) as any;

      expect(data.length).toBeLessThanOrEqual(3);
      data.forEach((m: any) => expect(m.status).toBe("active"));
      for (let i = 1; i < data.length; i++) {
        expect(data[i].last_name >= data[i - 1].last_name).toBe(true);
      }
    });

    it("should handle in() with multiple values", async () => {
      const { data } = (await client
        .from("repatriation_cases")
        .select("*")
        .in("status", ["declared", "in_progress"])) as any;

      data.forEach((c: any) => {
        expect(["declared", "in_progress"]).toContain(c.status);
      });
    });

    it("should chain multiple eq filters", async () => {
      const { data } = (await client
        .from("members")
        .select("*")
        .eq("status", "active")
        .eq("subscription_type", "family")) as any;

      data.forEach((m: any) => {
        expect(m.status).toBe("active");
        expect(m.subscription_type).toBe("family");
      });
    });
  });

  describe("Mutation flows", () => {
    it("should handle full registration flow: insert member + create family + add family members", async () => {
      // 1. Insert new member
      const { data: member } = (await client
        .from("members")
        .insert({
          first_name: "Nouveau",
          last_name: "Membre",
          phone: "06 99 99 99 99",
          email: "nouveau@test.com",
          address: "1 rue Test",
          city: "Villefranche",
          country_of_origin: "algeria",
          subscription_type: "family",
          status: "pending",
          role: "member",
        })
        .select()
        .single()) as any;

      expect(member).toBeDefined();
      expect(member.id).toBeTruthy();

      // 2. Create family
      const { data: family } = (await client
        .from("families")
        .insert({
          head_member_id: member.id,
          name: "Membre",
        })
        .select()
        .single()) as any;

      expect(family).toBeDefined();

      // 3. Add family members
      await client.from("family_members").insert({
        family_id: family.id,
        member_id: member.id,
        first_name: "Nouveau",
        last_name: "Membre",
        relationship: "head",
      });

      await client.from("family_members").insert({
        family_id: family.id,
        first_name: "Epouse",
        last_name: "Membre",
        relationship: "spouse",
      });

      // Verify
      const { data: fms } = (await client
        .from("family_members")
        .select("*")
        .eq("family_id", family.id)) as any;

      expect(fms.length).toBe(2);
    });

    it("should handle validation flow: update status + record payment", async () => {
      // Get a pending member
      const { data: pending } = (await client
        .from("members")
        .select("*")
        .eq("status", "pending")
        .limit(1)) as any;

      if (pending.length > 0) {
        const memberId = pending[0].id;

        // Validate
        await client
          .from("members")
          .update({ status: "active" })
          .eq("id", memberId);

        // Record payment
        await client.from("payments").insert({
          member_id: memberId,
          amount: 85,
          payment_method: "cash",
          period_start: "2026-01-01",
          period_end: "2026-12-31",
        });

        // Verify member is active
        const { data: updated } = (await client
          .from("members")
          .select("*")
          .eq("id", memberId)
          .single()) as any;

        expect(updated.status).toBe("active");

        // Verify payment exists
        const { data: payments } = (await client
          .from("payments")
          .select("*")
          .eq("member_id", memberId)) as any;

        expect(payments.length).toBeGreaterThan(0);
      }
    });

    it("should handle repatriation case lifecycle", async () => {
      const { data: members } = (await client
        .from("members")
        .select("*")
        .eq("status", "active")
        .limit(1)) as any;

      const memberId = members[0].id;

      // Create case
      const { data: newCase } = (await client
        .from("repatriation_cases")
        .insert({
          member_id: memberId,
          deceased_name: "Test Defunt",
          deceased_relationship: "self",
          date_of_death: "2026-04-01",
          destination_country: "algeria",
          status: "declared",
        })
        .select()
        .single()) as any;

      expect(newCase.status).toBe("declared");

      // Progress through statuses
      await client
        .from("repatriation_cases")
        .update({ status: "in_progress" })
        .eq("id", newCase.id);
      await client
        .from("repatriation_cases")
        .update({ status: "repatriated" })
        .eq("id", newCase.id);
      await client
        .from("repatriation_cases")
        .update({ status: "closed", cost_final: 4500 })
        .eq("id", newCase.id);

      const { data: closed } = (await client
        .from("repatriation_cases")
        .select("*")
        .eq("id", newCase.id)
        .single()) as any;

      expect(closed.status).toBe("closed");
      expect(closed.cost_final).toBe(4500);
    });

    it("should handle settings upsert flow", async () => {
      // Update mosque name
      await client
        .from("app_settings")
        .upsert({ key: "mosque_name", value: "Mosquee Test" });

      const { data } = (await client
        .from("app_settings")
        .select("*")
        .eq("key", "mosque_name")
        .single()) as any;

      expect(data.value).toBe("Mosquee Test");

      // Add new setting
      await client
        .from("app_settings")
        .upsert({ key: "new_setting", value: "test" });

      const { data: newSetting } = (await client
        .from("app_settings")
        .select("*")
        .eq("key", "new_setting")
        .single()) as any;

      expect(newSetting).toBeDefined();
    });

    it("should handle contact message flow", async () => {
      const { data: members } = (await client
        .from("members")
        .select("*")
        .limit(1)) as any;

      // Send message
      const { data: msg } = (await client
        .from("contact_messages")
        .insert({
          member_id: members[0].id,
          subject: "Test sujet",
          message: "Contenu du message test",
          is_read: false,
        })
        .select()
        .single()) as any;

      expect(msg.is_read).toBe(false);

      // Mark as read
      await client
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", msg.id);

      // Add reply
      await client
        .from("contact_messages")
        .update({ admin_reply: "Reponse admin" })
        .eq("id", msg.id);

      const { data: updated } = (await client
        .from("contact_messages")
        .select("*")
        .eq("id", msg.id)
        .single()) as any;

      expect(updated.is_read).toBe(true);
      expect(updated.admin_reply).toBe("Reponse admin");
    });

    it("should handle member suspension and reactivation", async () => {
      const { data: active } = (await client
        .from("members")
        .select("*")
        .eq("status", "active")
        .limit(1)) as any;

      const id = active[0].id;

      // Suspend
      await client.from("members").update({ status: "suspended" }).eq("id", id);
      let { data } = (await client
        .from("members")
        .select("*")
        .eq("id", id)
        .single()) as any;
      expect(data.status).toBe("suspended");

      // Reactivate
      await client.from("members").update({ status: "active" }).eq("id", id);
      ({ data } = (await client
        .from("members")
        .select("*")
        .eq("id", id)
        .single()) as any);
      expect(data.status).toBe("active");
    });

    it("should handle family member add and remove", async () => {
      const { data: families } = (await client
        .from("families")
        .select("*")
        .limit(1)) as any;
      const familyId = families[0].id;

      const initialCount = (
        (await client
          .from("family_members")
          .select("*", { count: "exact", head: true })
          .eq("family_id", familyId)) as any
      ).count;

      // Add
      const { data: newFm } = (await client
        .from("family_members")
        .insert({
          family_id: familyId,
          first_name: "Nouveau",
          last_name: "Enfant",
          relationship: "son",
        })
        .select()
        .single()) as any;

      let count = (
        (await client
          .from("family_members")
          .select("*", { count: "exact", head: true })
          .eq("family_id", familyId)) as any
      ).count;
      expect(count).toBe(initialCount + 1);

      // Remove
      await client.from("family_members").delete().eq("id", newFm.id);

      count = (
        (await client
          .from("family_members")
          .select("*", { count: "exact", head: true })
          .eq("family_id", familyId)) as any
      ).count;
      expect(count).toBe(initialCount);
    });

    it("should handle pricing plan update", async () => {
      const { data: plans } = (await client
        .from("pricing_plans")
        .select("*")
        .eq("type", "individual")) as any;
      const plan = plans[0];

      await client
        .from("pricing_plans")
        .update({ amount: 90 })
        .eq("id", plan.id);

      const { data: updated } = (await client
        .from("pricing_plans")
        .select("*")
        .eq("id", plan.id)
        .single()) as any;
      expect(updated.amount).toBe(90);
    });

    it("should handle agent CRUD", async () => {
      // Create
      const { data: agent } = (await client
        .from("repatriation_agents")
        .insert({
          name: "Nouvel Agent",
          phone: "+213 555 000 000",
          countries: ["algeria", "tunisia"],
          is_active: true,
        })
        .select()
        .single()) as any;

      expect(agent.name).toBe("Nouvel Agent");

      // Soft delete (deactivate)
      await client
        .from("repatriation_agents")
        .update({ is_active: false })
        .eq("id", agent.id);

      const { data: deactivated } = (await client
        .from("repatriation_agents")
        .select("*")
        .eq("id", agent.id)
        .single()) as any;
      expect(deactivated.is_active).toBe(false);
    });
  });

  describe("Auth flows", () => {
    it("should handle full signup -> get profile -> signout flow", async () => {
      const { data: signupData } = (await client.auth.signUp({
        email: "test@flow.com",
        password: "flow123",
      })) as any;

      expect(signupData.user).toBeDefined();
      const userId = signupData.user.id;

      // Insert member linked to auth user
      await client.from("members").insert({
        user_id: userId,
        first_name: "Flow",
        last_name: "Test",
        phone: "06 00 00 00 01",
        status: "pending",
        role: "member",
        subscription_type: "individual",
        country_of_origin: "algeria",
      });

      // Get member by user_id
      const { data: member } = (await client
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .single()) as any;

      expect(member).toBeDefined();
      expect(member.first_name).toBe("Flow");

      // Sign out
      await client.auth.signOut();
      const {
        data: { user },
      } = (await client.auth.getUser()) as any;
      expect(user).toBeNull();

      // Sign back in
      const { data: loginData } = (await client.auth.signInWithPassword({
        email: "test@flow.com",
        password: "flow123",
      })) as any;
      expect(loginData.user.email).toBe("test@flow.com");
    });

    it("should handle admin login -> check role flow", async () => {
      await client.auth.signInWithPassword({
        email: "admin@djanaiz.fr",
        password: "admin123",
      });

      const {
        data: { user },
      } = (await client.auth.getUser()) as any;
      const { data: member } = (await client
        .from("members")
        .select("role, status")
        .eq("user_id", user.id)
        .single()) as any;

      // The mock select returns all fields, so role is present
      expect(member).toBeDefined();
      expect(member.role).toBe("admin");
      expect(member.status).toBe("active");
    });

    it("should handle password change", async () => {
      await client.auth.signInWithPassword({
        email: "admin@djanaiz.fr",
        password: "admin123",
      });

      await client.auth.updateUser({ password: "newpass456" });

      // Sign out and back in with new password
      await client.auth.signOut();

      const { data: newLogin } = (await client.auth.signInWithPassword({
        email: "admin@djanaiz.fr",
        password: "newpass456",
      })) as any;
      expect(newLogin.user).toBeDefined();
    });
  });

  describe("Dashboard data aggregation", () => {
    it("should compute correct balance (payments in - repatriation costs out)", async () => {
      const { data: payments } = (await client
        .from("payments")
        .select("amount")) as any;
      const { data: costs } = (await client
        .from("repatriation_cases")
        .select("cost_final")
        .eq("status", "closed")) as any;

      const totalIn = payments.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0,
      );
      const totalOut = costs.reduce(
        (sum: number, c: any) => sum + Number(c.cost_final || 0),
        0,
      );
      const balance = totalIn - totalOut;

      expect(totalIn).toBeGreaterThan(0);
      expect(balance).toBeDefined();
      expect(typeof balance).toBe("number");
    });

    it("should get all KPI counts correctly", async () => {
      const { count: activeMembers } = (await client
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")) as any;
      const { count: familiesCount } = (await client
        .from("families")
        .select("*", { count: "exact", head: true })) as any;
      const { data: pending } = (await client
        .from("members")
        .select("*")
        .eq("status", "pending")) as any;
      const { data: activeCases } = (await client
        .from("repatriation_cases")
        .select("*")
        .in("status", ["declared", "in_progress"])) as any;

      expect(activeMembers).toBeGreaterThan(0);
      expect(familiesCount).toBeGreaterThan(0);
      expect(pending.length).toBeGreaterThanOrEqual(0);
      expect(activeCases).toBeDefined();
    });
  });

  describe("CSV export data preparation", () => {
    it("should prepare members export data", async () => {
      const { data } = (await client
        .from("members")
        .select("*")
        .order("last_name")) as any;

      expect(data.length).toBeGreaterThan(0);
      const headers = [
        "last_name",
        "first_name",
        "phone",
        "email",
        "address",
        "city",
        "country_of_origin",
        "subscription_type",
        "status",
      ];
      data.forEach((m: any) => {
        headers.forEach((h) => {
          expect(m).toHaveProperty(h);
        });
      });
    });

    it("should prepare payments export with member names", async () => {
      const { data } = (await client
        .from("payments")
        .select("*, member:members(first_name, last_name)")
        .order("payment_date", { ascending: false })) as any;

      expect(data.length).toBeGreaterThan(0);
      data.forEach((p: any) => {
        expect(p.payment_date).toBeTruthy();
        expect(p.amount).toBeDefined();
        expect(p.member).toBeDefined();
      });
    });
  });

  describe("Search and filter simulation", () => {
    it("should simulate member name search", async () => {
      const { data: all } = (await client.from("members").select("*")) as any;
      const searchTerm = "ben";
      const filtered = all.filter((m: any) =>
        `${m.last_name} ${m.first_name}`.toLowerCase().includes(searchTerm),
      );
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should simulate member phone search", async () => {
      const { data: all } = (await client.from("members").select("*")) as any;
      const firstPhone = all[0].phone;
      // Use the last segment as-is (e.g. "56 78") to match against the phone string
      const searchSegment = firstPhone.slice(-5);
      const filtered = all.filter((m: any) => m.phone.includes(searchSegment));
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should simulate status + type filter combination", async () => {
      const { data: all } = (await client.from("members").select("*")) as any;

      const statusFilter = "active";
      const typeFilter = "family";

      const filtered = all.filter(
        (m: any) =>
          m.status === statusFilter && m.subscription_type === typeFilter,
      );

      filtered.forEach((m: any) => {
        expect(m.status).toBe("active");
        expect(m.subscription_type).toBe("family");
      });
    });

    it("should simulate payment method filter", async () => {
      const { data: all } = (await client
        .from("payments")
        .select("*, member:members(first_name, last_name)")) as any;

      const methodFilter = "cash";
      const filtered = all.filter(
        (p: any) => p.payment_method === methodFilter,
      );

      filtered.forEach((p: any) => {
        expect(p.payment_method).toBe("cash");
      });
    });
  });

  describe("Data validation rules", () => {
    it("all active members should have phone numbers", async () => {
      const { data } = (await client
        .from("members")
        .select("*")
        .eq("status", "active")) as any;
      data.forEach((m: any) => {
        expect(m.phone).toBeTruthy();
        expect(m.phone.length).toBeGreaterThanOrEqual(10);
      });
    });

    it("all payments should have positive amounts", async () => {
      const { data } = (await client.from("payments").select("*")) as any;
      data.forEach((p: any) => {
        expect(Number(p.amount)).toBeGreaterThan(0);
      });
    });

    it("all pricing plans should have positive amounts", async () => {
      const { data } = (await client.from("pricing_plans").select("*")) as any;
      data.forEach((p: any) => {
        expect(Number(p.amount)).toBeGreaterThan(0);
      });
    });

    it("payment periods should be valid date ranges", async () => {
      const { data } = (await client.from("payments").select("*")) as any;
      data.forEach((p: any) => {
        const start = new Date(p.period_start);
        const end = new Date(p.period_end);
        expect(end.getTime()).toBeGreaterThan(start.getTime());
      });
    });

    it("repatriation cases should reference valid countries", async () => {
      const validCountries = [
        "algeria",
        "morocco",
        "tunisia",
        "libya",
        "mauritania",
        "other",
      ];
      const { data } = (await client
        .from("repatriation_cases")
        .select("*")) as any;
      data.forEach((c: any) => {
        expect(validCountries).toContain(c.destination_country);
      });
    });
  });
});
