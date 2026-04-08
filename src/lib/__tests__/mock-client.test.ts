import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockClient, resetMockStore } from "../supabase/mock-client";

describe("Mock Supabase Client", () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    // Reset the store and create a fresh client for each test
    resetMockStore();
    client = createMockClient();
  });

  describe("Auth", () => {
    it("should sign in with valid admin credentials", async () => {
      const { data, error } = (await client.auth.signInWithPassword({
        email: "admin@elhouda.fr",
        password: "admin123",
      })) as any;

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("admin@elhouda.fr");
    });

    it("should sign in with valid member credentials", async () => {
      const { data, error } = (await client.auth.signInWithPassword({
        email: "ahmed.benali@email.com",
        password: "test123",
      })) as any;

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("ahmed.benali@email.com");
    });

    it("should fail with invalid credentials", async () => {
      const { data, error } = (await client.auth.signInWithPassword({
        email: "wrong@email.com",
        password: "wrongpass",
      })) as any;

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });

    it("should return user after sign in", async () => {
      await client.auth.signInWithPassword({
        email: "admin@elhouda.fr",
        password: "admin123",
      });

      const { data } = (await client.auth.getUser()) as any;
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("admin@elhouda.fr");
    });

    it("should return null user when not signed in", async () => {
      await client.auth.signOut();
      const { data } = (await client.auth.getUser()) as any;
      expect(data.user).toBeNull();
    });

    it("should sign out", async () => {
      await client.auth.signInWithPassword({
        email: "admin@elhouda.fr",
        password: "admin123",
      });
      await client.auth.signOut();
      const { data } = (await client.auth.getUser()) as any;
      expect(data.user).toBeNull();
    });

    it("should sign up new user", async () => {
      const { data, error } = (await client.auth.signUp({
        email: "new@test.com",
        password: "newpass123",
      })) as any;

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("new@test.com");
    });
  });

  describe("SELECT queries", () => {
    it("should select all members", async () => {
      const { data, error } = await client.from("members").select("*");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });

    it("should filter with eq", async () => {
      const { data } = await client
        .from("members")
        .select("*")
        .eq("status", "active");

      expect(data).toBeDefined();
      data.forEach((m: any) => {
        expect(m.status).toBe("active");
      });
    });

    it("should filter with in", async () => {
      const { data } = await client
        .from("members")
        .select("*")
        .in("status", ["pending", "active"]);

      expect(data).toBeDefined();
      data.forEach((m: any) => {
        expect(["pending", "active"]).toContain(m.status);
      });
    });

    it("should order results ascending", async () => {
      const { data } = await client
        .from("members")
        .select("*")
        .order("last_name", { ascending: true });

      expect(data).toBeDefined();
      for (let i = 1; i < data.length; i++) {
        expect(data[i].last_name >= data[i - 1].last_name).toBe(true);
      }
    });

    it("should order results descending", async () => {
      const { data } = await client
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false });

      expect(data).toBeDefined();
      for (let i = 1; i < data.length; i++) {
        expect(data[i].payment_date <= data[i - 1].payment_date).toBe(true);
      }
    });

    it("should limit results", async () => {
      const { data } = await client.from("members").select("*").limit(3);

      expect(data).toBeDefined();
      expect(data.length).toBeLessThanOrEqual(3);
    });

    it("should return single result", async () => {
      const allMembers = (await client.from("members").select("*")) as any;
      const firstId = allMembers.data[0].id;

      const { data } = await client
        .from("members")
        .select("*")
        .eq("id", firstId)
        .single();

      expect(data).toBeDefined();
      expect(data.id).toBe(firstId);
      expect(Array.isArray(data)).toBe(false);
    });

    it("should return count with head option", async () => {
      const { count } = await client
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      expect(count).toBeDefined();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThan(0);
    });

    it("should resolve relations in select", async () => {
      const { data } = await client
        .from("payments")
        .select("*, member:members(first_name, last_name)")
        .limit(1);

      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].member).toBeDefined();
      expect(data[0].member.first_name).toBeTruthy();
      expect(data[0].member.last_name).toBeTruthy();
    });
  });

  describe("INSERT queries", () => {
    it("should insert a new member", async () => {
      const initialCount = (
        (await client
          .from("members")
          .select("*", { count: "exact", head: true })) as any
      ).count;

      const { data, error } = await client
        .from("members")
        .insert({
          first_name: "Test",
          last_name: "User",
          phone: "06 00 00 00 00",
          status: "pending",
          role: "member",
          subscription_type: "individual",
          country_of_origin: "algeria",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.first_name).toBe("Test");
      expect(data.id).toBeTruthy();

      const newCount = (
        (await client
          .from("members")
          .select("*", { count: "exact", head: true })) as any
      ).count;
      expect(newCount).toBe(initialCount + 1);
    });

    it("should auto-generate id and timestamps", async () => {
      const { data } = await client
        .from("members")
        .insert({
          first_name: "Auto",
          last_name: "ID",
          phone: "06 11 11 11 11",
          status: "pending",
          role: "member",
          subscription_type: "individual",
          country_of_origin: "algeria",
        })
        .select()
        .single();

      expect(data.id).toBeTruthy();
      expect(data.created_at).toBeTruthy();
    });
  });

  describe("UPDATE queries", () => {
    it("should update a member status", async () => {
      const { data: members } = await client
        .from("members")
        .select("*")
        .eq("status", "pending")
        .limit(1);

      if (members && members.length > 0) {
        const memberId = members[0].id;

        await client
          .from("members")
          .update({ status: "active" })
          .eq("id", memberId);

        const { data: updated } = await client
          .from("members")
          .select("*")
          .eq("id", memberId)
          .single();

        expect(updated.status).toBe("active");
      }
    });
  });

  describe("DELETE queries", () => {
    it("should delete a record", async () => {
      // First insert something to delete
      const { data: inserted } = await client
        .from("contact_messages")
        .insert({
          member_id: "member-001",
          subject: "To delete",
          message: "Will be deleted",
          is_read: false,
        })
        .select()
        .single();

      const insertedId = inserted.id;

      await client.from("contact_messages").delete().eq("id", insertedId);

      const { data: found } = await client
        .from("contact_messages")
        .select("*")
        .eq("id", insertedId);

      expect(found.length).toBe(0);
    });
  });

  describe("UPSERT queries", () => {
    it("should upsert app settings", async () => {
      await client
        .from("app_settings")
        .upsert({ key: "test_setting", value: "test_value" });

      const { data } = await client
        .from("app_settings")
        .select("*")
        .eq("key", "test_setting")
        .single();

      expect(data).toBeDefined();
      expect(data.value).toBe("test_value");
    });

    it("should update existing setting on upsert", async () => {
      await client
        .from("app_settings")
        .upsert({ key: "mosque_name", value: "Updated Name" });

      const { data } = await client
        .from("app_settings")
        .select("*")
        .eq("key", "mosque_name")
        .single();

      expect(data.value).toBe("Updated Name");
    });
  });

  describe("Combined queries (as used in app)", () => {
    it("should handle dashboard queries", async () => {
      const [
        { count: membersCount },
        { count: familiesCount },
        { data: pending },
      ] = await Promise.all([
        client
          .from("members")
          .select("*", { count: "exact", head: true })
          .eq("status", "active") as any,
        client
          .from("families")
          .select("*", { count: "exact", head: true }) as any,
        client
          .from("members")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5) as any,
      ]);

      expect(typeof membersCount).toBe("number");
      expect(typeof familiesCount).toBe("number");
      expect(Array.isArray(pending)).toBe(true);
    });

    it("should handle payments with member relation", async () => {
      const { data } = await client
        .from("payments")
        .select("*, member:members(first_name, last_name)")
        .order("payment_date", { ascending: false })
        .limit(10);

      expect(data).toBeDefined();
      data.forEach((p: any) => {
        expect(p.amount).toBeDefined();
        expect(p.member).toBeDefined();
      });
    });

    it("should handle repatriation cases with relations", async () => {
      const { data } = await client
        .from("repatriation_cases")
        .select("*, member:members(first_name, last_name)")
        .in("status", ["declared", "in_progress"]);

      expect(data).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty table query gracefully", async () => {
      // Query with a filter that matches nothing
      const { data, error } = await client
        .from("members")
        .select("*")
        .eq("id", "nonexistent-id");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(0);
    });

    it("should handle single() with no match", async () => {
      const { data, error } = await client
        .from("members")
        .select("*")
        .eq("id", "nonexistent")
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it("should handle non-existent table", async () => {
      const { data, error } = await client
        .from("nonexistent_table")
        .select("*");

      expect(error).toBeDefined();
    });
  });
});
