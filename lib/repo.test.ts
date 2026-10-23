import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllPlans,
  getAllSessions,
  getPlan,
  getSession,
  getClientPlans,
  saveClientPlan,
  deleteClientPlan,
  planFromRow,
} from "./repo";

// Track all Supabase calls
const calls = { eq: [] as Array<[string, string, string]>, upsert: [] as Array<{ table: string; row: any }> };
// Rows a delete(...).select() reports as deleted (RLS makes a denied delete a no-op).
const db = { deleted: [] as unknown[] };

// Mock the Supabase client
vi.mock("./supabase", () => {
  const createBuilder = (table: string) => {
    const filters: Array<[string, string]> = [];
    return {
      select: () => createBuilder(table),
      eq: (col: string, val: string) => {
        calls.eq.push([table, col, val]);
        filters.push([col, val]);
        return createBuilder(table);
      },
      order: () => createBuilder(table),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      upsert: (row: any) => {
        calls.upsert.push({ table, row });
        return {
          select: () => Promise.resolve({ data: [], error: null }),
        };
      },
      delete: () => ({
        eq: (col: string, val: string) => {
          calls.eq.push([table, col, val]);
          return {
            select: () => Promise.resolve({ data: db.deleted, error: null }),
            then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
          };
        },
      }),
      then: (resolve: (value: { data: any[]; error: null }) => void) => {
        resolve({ data: [], error: null });
      },
    };
  };

  return {
    supabase: {
      from: (table: string) => createBuilder(table),
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "me" } }, error: null }),
      },
    },
  };
});

beforeEach(() => {
  calls.eq = [];
  calls.upsert = [];
  db.deleted = [];
});

describe("repo", () => {
  it("own lists are scoped to the signed-in user", async () => {
    await getAllSessions();
    await getAllPlans();
    expect(calls.eq).toEqual([
      ["sessions", "user_id", "me"],
      ["plans", "user_id", "me"],
    ]);
  });

  it("single plan and session lookups are scoped to the signed-in user", async () => {
    await getPlan("p1");
    await getSession("s1");
    expect(calls.eq).toEqual([
      ["plans", "id", "p1"],
      ["plans", "user_id", "me"],
      ["sessions", "id", "s1"],
      ["sessions", "user_id", "me"],
    ]);
  });

  it("client plans are scoped to the client and to plans I wrote", async () => {
    await getClientPlans("c1");
    expect(calls.eq).toEqual([
      ["plans", "user_id", "c1"],
      ["plans", "trainer_id", "me"],
    ]);
  });

  it("saveClientPlan writes the client as owner and me as trainer, not into data", async () => {
    await saveClientPlan("c1", {
      id: "p",
      name: "P",
      createdAt: 0,
      days: [],
      trainerId: "me",
    });
    expect(calls.upsert[0]).toMatchObject({
      table: "plans",
      row: { id: "p", user_id: "c1", trainer_id: "me" },
    });
    expect(calls.upsert[0].row.data).not.toHaveProperty("trainerId");
  });

  it("deleteClientPlan fails when nothing was deleted (e.g. the coaching just ended)", async () => {
    await expect(deleteClientPlan("c1", "p")).rejects.toThrow();
    db.deleted = [{ id: "p" }];
    await expect(deleteClientPlan("c1", "p")).resolves.toBeUndefined();
  });

  it("planFromRow exposes the trainer", () => {
    expect(
      planFromRow({
        data: { id: "p", name: "P", createdAt: 0, days: [] },
        trainer_id: "t",
      }).trainerId
    ).toBe("t");
  });
});
