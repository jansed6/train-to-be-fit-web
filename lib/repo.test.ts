import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllPlans,
  getAllSessions,
  getClientPlans,
  saveClientPlan,
  planFromRow,
} from "./repo";

// Track all Supabase calls
const calls = { eq: [] as Array<[string, string, string]>, upsert: [] as Array<{ table: string; row: any }> };

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
        eq: () => Promise.resolve({ error: null }),
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

  it("planFromRow exposes the trainer", () => {
    expect(
      planFromRow({
        data: { id: "p", name: "P", createdAt: 0, days: [] },
        trainer_id: "t",
      }).trainerId
    ).toBe("t");
  });
});
