import { demoStore, demoAuthUsers } from "../demo-data";

// Deep clone the store so mutations don't affect the source module
let store: Record<string, any[]> = JSON.parse(JSON.stringify(demoStore));

let currentUser: { id: string; email: string } | null = null;

// Persist auth across page loads via localStorage
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("demo_user");
    if (saved) currentUser = JSON.parse(saved);
  } catch {
    // ignore parse errors
  }
}

// ============================================
// Query Builder
// ============================================

class MockQueryBuilder {
  private tableName: string;
  private selectFields: string = "*";
  private filters: { type: string; field: string; value: any }[] = [];
  private orderByField: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isCount: boolean = false;
  private isHead: boolean = false;
  private insertData: any = null;
  private updateData: any = null;
  private isDeleteOp: boolean = false;
  private isUpsert: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = "*", options?: { count?: string; head?: boolean }) {
    this.selectFields = fields;
    if (options?.count) this.isCount = true;
    if (options?.head) this.isHead = true;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ type: "eq", field, value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ type: "neq", field, value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ type: "in", field, value: values });
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push({ type: "gt", field, value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ type: "gte", field, value });
    return this;
  }

  lt(field: string, value: any) {
    this.filters.push({ type: "lt", field, value });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ type: "lte", field, value });
    return this;
  }

  like(field: string, value: string) {
    this.filters.push({ type: "like", field, value });
    return this;
  }

  ilike(field: string, value: string) {
    this.filters.push({ type: "ilike", field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  insert(data: any) {
    this.insertData = Array.isArray(data) ? data : data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDeleteOp = true;
    return this;
  }

  upsert(data: any) {
    this.isUpsert = true;
    this.insertData = data;
    return this;
  }

  // Make the builder thenable so it works with `await`
  then(resolve: (value: any) => void, reject?: (error: any) => void) {
    try {
      const result = this.execute();
      resolve(result);
    } catch (error) {
      if (reject) reject(error);
      else
        resolve({ data: null, error: { message: String(error) }, count: null });
    }
  }

  // -------- Execution logic --------

  private execute(): any {
    const table = store[this.tableName];
    if (!table) {
      return {
        data: null,
        error: { message: `Table ${this.tableName} not found` },
        count: null,
      };
    }

    // Handle INSERT (not upsert)
    if (this.insertData !== null && !this.isUpsert) {
      return this.handleInsert(table);
    }

    // Handle UPSERT
    if (this.isUpsert && this.insertData !== null) {
      return this.handleUpsert(table);
    }

    // Handle UPDATE
    if (this.updateData !== null) {
      return this.handleUpdate(table);
    }

    // Handle DELETE
    if (this.isDeleteOp) {
      return this.handleDelete(table);
    }

    // Handle SELECT
    return this.handleSelect(table);
  }

  // ---- INSERT ----
  private handleInsert(table: any[]): any {
    const items = Array.isArray(this.insertData)
      ? this.insertData
      : [this.insertData];
    const created: any[] = [];

    for (const item of items) {
      const newItem = {
        id: `${this.tableName.replace(/s$/, "")}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...item,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      };
      table.push(newItem);
      created.push(newItem);
    }

    if (this.isSingle) {
      return { data: created[0] || null, error: null };
    }
    return { data: created, error: null };
  }

  // ---- UPSERT ----
  private handleUpsert(table: any[]): any {
    const items = Array.isArray(this.insertData)
      ? this.insertData
      : [this.insertData];
    const results: any[] = [];

    for (const item of items) {
      // For app_settings, match by key
      if (this.tableName === "app_settings") {
        const existing = table.find((row: any) => row.key === item.key);
        if (existing) {
          Object.assign(existing, item, {
            updated_at: new Date().toISOString(),
          });
          results.push(existing);
        } else {
          const newItem = { ...item, updated_at: new Date().toISOString() };
          table.push(newItem);
          results.push(newItem);
        }
      } else {
        // Generic upsert by id
        const existing = item.id
          ? table.find((row: any) => row.id === item.id)
          : null;
        if (existing) {
          Object.assign(existing, item, {
            updated_at: new Date().toISOString(),
          });
          results.push(existing);
        } else {
          const newItem = {
            id:
              item.id ||
              `${this.tableName.replace(/s$/, "")}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...item,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          table.push(newItem);
          results.push(newItem);
        }
      }
    }

    if (this.isSingle) {
      return { data: results[0] || null, error: null };
    }
    return { data: results.length === 1 ? results[0] : results, error: null };
  }

  // ---- UPDATE ----
  private handleUpdate(table: any[]): any {
    let matched = [...table];

    // Apply filters to find rows to update
    for (const filter of this.filters) {
      matched = this.applyFilter(matched, filter);
    }

    // Mutate original rows in the store
    matched.forEach((row) => {
      const original = table.find((t: any) => t.id === row.id);
      if (original) {
        Object.assign(original, this.updateData, {
          updated_at: new Date().toISOString(),
        });
      }
    });

    if (this.isSingle) {
      const updated = matched[0]
        ? table.find((t: any) => t.id === matched[0].id)
        : null;
      return { data: updated || null, error: null };
    }
    return { data: matched, error: null };
  }

  // ---- DELETE ----
  private handleDelete(table: any[]): any {
    for (const filter of this.filters) {
      if (filter.type === "eq") {
        const idx = table.findIndex(
          (item: any) => item[filter.field] === filter.value,
        );
        if (idx > -1) table.splice(idx, 1);
      } else if (filter.type === "in") {
        // Delete all matching items (iterate backwards to safely splice)
        for (let i = table.length - 1; i >= 0; i--) {
          if ((filter.value as any[]).includes(table[i][filter.field])) {
            table.splice(i, 1);
          }
        }
      }
    }
    return { data: null, error: null };
  }

  // ---- SELECT ----
  private handleSelect(table: any[]): any {
    let results = [...table];

    // Apply filters
    for (const filter of this.filters) {
      results = this.applyFilter(results, filter);
    }

    // Apply ordering
    if (this.orderByField) {
      const field = this.orderByField;
      const asc = this.orderAscending;
      results.sort((a, b) => {
        const av = a[field] ?? "";
        const bv = b[field] ?? "";
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return asc ? cmp : -cmp;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }

    // Resolve relations if select fields contain ':'
    if (this.selectFields !== "*" && this.selectFields.includes(":")) {
      results = results.map((item) => this.resolveRelations(item));
    }

    // Handle count + head (count-only query)
    if (this.isCount && this.isHead) {
      return { data: null, error: null, count: results.length };
    }

    // Handle single
    if (this.isSingle) {
      if (results.length === 0) {
        return {
          data: null,
          error: { message: "Row not found", code: "PGRST116" },
        };
      }
      return { data: results[0], error: null };
    }

    return { data: results, error: null, count: results.length };
  }

  // ---- Filter logic ----
  private applyFilter(
    rows: any[],
    filter: { type: string; field: string; value: any },
  ): any[] {
    switch (filter.type) {
      case "eq":
        return rows.filter((item) => item[filter.field] === filter.value);
      case "neq":
        return rows.filter((item) => item[filter.field] !== filter.value);
      case "in":
        return rows.filter((item) =>
          (filter.value as any[]).includes(item[filter.field]),
        );
      case "gt":
        return rows.filter((item) => item[filter.field] > filter.value);
      case "gte":
        return rows.filter((item) => item[filter.field] >= filter.value);
      case "lt":
        return rows.filter((item) => item[filter.field] < filter.value);
      case "lte":
        return rows.filter((item) => item[filter.field] <= filter.value);
      case "like":
        return rows.filter((item) => {
          const pattern = (filter.value as string).replace(/%/g, ".*");
          return new RegExp(`^${pattern}$`).test(
            String(item[filter.field] ?? ""),
          );
        });
      case "ilike":
        return rows.filter((item) => {
          const pattern = (filter.value as string).replace(/%/g, ".*");
          return new RegExp(`^${pattern}$`, "i").test(
            String(item[filter.field] ?? ""),
          );
        });
      default:
        return rows;
    }
  }

  // ---- Relation resolution ----
  private resolveRelations(item: any): any {
    const result = { ...item };

    // Parse patterns like:
    // "*, member:members(first_name, last_name)"
    // "*, head_member:members!families_head_member_id_fkey(id, first_name, last_name, phone, status), members:family_members(*)"
    // "*, member:members(first_name, last_name), agent:repatriation_agents(name, phone)"
    const relationPattern = /(\w+):(\w+)(?:![^\(]*)?\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = relationPattern.exec(this.selectFields)) !== null) {
      const [, alias, relTable, fields] = match;
      const fieldList = fields.split(",").map((f) => f.trim());

      // Special case: family_members listed as "members:family_members(*)"
      // Return all family_members that belong to this family
      if (relTable === "family_members" && this.tableName === "families") {
        result[alias] = (store.family_members || []).filter(
          (fm: any) => fm.family_id === item.id,
        );
        continue;
      }

      // Try to find the foreign key for this relation
      // Convention: alias_id  or  relTable(singular)_id
      const singularRelTable = relTable.replace(/s$/, "");
      const fkCandidates = [
        `${alias}_id`,
        `${singularRelTable}_id`,
        `head_${alias}_id`,
        `head_member_id`,
      ];

      let fkValue: any = null;
      for (const fk of fkCandidates) {
        if (item[fk] !== undefined && item[fk] !== null) {
          fkValue = item[fk];
          break;
        }
      }

      if (fkValue && store[relTable]) {
        const related = store[relTable].find((r: any) => r.id === fkValue);
        if (related) {
          if (fieldList.length === 1 && fieldList[0] === "*") {
            result[alias] = { ...related };
          } else {
            const picked: any = {};
            fieldList.forEach((f) => {
              picked[f] = related[f];
            });
            result[alias] = picked;
          }
        } else {
          result[alias] = null;
        }
      } else if (!result[alias]) {
        // Don't override if already set (e.g., family_members case)
        result[alias] = null;
      }
    }

    return result;
  }
}

// ============================================
// Auth
// ============================================

class MockAuth {
  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const user = demoAuthUsers.find(
      (u) => u.email === email && u.password === password,
    );
    if (!user) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      };
    }
    currentUser = { id: user.id, email: user.email };
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_user", JSON.stringify(currentUser));
    }
    return {
      data: {
        user: currentUser,
        session: { access_token: "demo-token", user: currentUser },
      },
      error: null,
    };
  }

  async signUp({ email, password }: { email: string; password: string }) {
    // Check if email already exists
    const existing = demoAuthUsers.find((u) => u.email === email);
    if (existing) {
      return {
        data: { user: null },
        error: { message: "User already registered" },
      };
    }

    const newUser = { id: `auth-${Date.now()}`, email, password };
    demoAuthUsers.push(newUser);
    currentUser = { id: newUser.id, email: newUser.email };
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_user", JSON.stringify(currentUser));
    }
    return { data: { user: currentUser }, error: null };
  }

  async getUser() {
    return { data: { user: currentUser }, error: null };
  }

  async getSession() {
    if (currentUser) {
      return {
        data: {
          session: { access_token: "demo-token", user: currentUser },
        },
        error: null,
      };
    }
    return { data: { session: null }, error: null };
  }

  async signOut() {
    currentUser = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_user");
    }
    return { error: null };
  }

  async updateUser({
    password,
  }: {
    password?: string;
    email?: string;
    data?: any;
  }) {
    if (currentUser && password) {
      const authUser = demoAuthUsers.find((u) => u.id === currentUser!.id);
      if (authUser) authUser.password = password;
    }
    return { data: { user: currentUser }, error: null };
  }

  async resetPasswordForEmail(_email: string) {
    return { data: {}, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Fire initial event with current state
    if (currentUser) {
      setTimeout(() => {
        callback("SIGNED_IN", {
          access_token: "demo-token",
          user: currentUser,
        });
      }, 0);
    }
    return {
      data: {
        subscription: {
          id: "mock-sub",
          unsubscribe: () => {},
        },
      },
    };
  }
}

// ============================================
// Client
// ============================================

export class MockSupabaseClient {
  auth = new MockAuth();

  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  }

  // Some libraries call .channel() or .realtime — stub them out
  channel(_name: string) {
    return {
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
      unsubscribe: () => {},
    };
  }

  removeChannel(_channel: any) {
    return {};
  }
}

export function createMockClient() {
  return new MockSupabaseClient();
}

// Utility to reset the store (useful for testing)
export function resetMockStore() {
  store = JSON.parse(JSON.stringify(demoStore));
}
