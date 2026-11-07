import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mutate } from "swr";
import {
  type Coaching,
  myClients,
  myPendingInvites,
  invitesForMe,
  myTrainer,
  coachingErrorMessage,
  clientLabel,
  respondToInvite,
  cancelInvite,
  endCoaching,
  addClient,
} from "./coaching";

vi.mock("swr", () => ({ mutate: vi.fn(() => Promise.resolve()) }));

// Every RPC but invite_client fails as if the invite / coaching changed elsewhere.
const rpc = vi.fn((fn: string) =>
  Promise.resolve(
    fn === "invite_client"
      ? { data: "new-invite", error: null }
      : {
          data: null,
          error: { message: fn === "end_coaching" ? "coaching_not_found" : "invite_not_found" },
        },
  ),
);
vi.mock("./supabase", () => ({
  supabase: {
    rpc: (fn: string) => rpc(fn),
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: "tok" } } }) },
  },
}));

beforeEach(() => {
  vi.mocked(mutate).mockClear();
  rpc.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

/** The server route answering with `status` and `body`. */
function serverSays(status: number, body: object) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const row = (o: Partial<Coaching>): Coaching => ({
  id: "1",
  trainerId: "t",
  trainerEmail: "t@x",
  clientEmail: "c@x",
  clientName: null,
  clientId: null,
  status: "pending",
  createdAt: 0,
  ...o,
});

describe("coaching", () => {
  it("selectors split coachings by role and status", () => {
    const all = [
      row({ id: "a", status: "active", clientId: "c" }),
      row({ id: "p" }),
      row({ id: "in", trainerId: "other", clientEmail: "t@x" }),
      row({ id: "mine", trainerId: "other", clientId: "t", status: "active" }),
      row({ id: "old", status: "ended", clientId: "c" }),
    ];
    expect(myClients(all, "t").map((c) => c.id)).toEqual(["a"]);
    expect(myPendingInvites(all, "t").map((c) => c.id)).toEqual(["p"]);
    expect(invitesForMe(all, "t").map((c) => c.id)).toEqual(["in"]);
    expect(myTrainer(all, "t")?.id).toBe("mine");
  });

  it.each([
    ["cannot_invite_self", "You can't invite yourself."],
    ["already_invited", "You've already added or invited this email."],
    ["rate_limited", "Too many emails sent just now. Try again in a little while."],
    ["not_trainer", "Only trainers can add clients. Ask the app's admin to make you one."],
    [
      "already_has_trainer",
      "You already have a trainer. Leave them first (Account page) to accept a new one.",
    ],
    ["invalid_email", "Enter a valid email."],
    ["invite_not_found", "This invite is no longer available."],
    ["coaching_not_found", "This coaching has already ended."],
    ["boom", "Something went wrong. Try again."],
  ])("%s -> message", (code, text) =>
    expect(coachingErrorMessage({ message: code })).toBe(text)
  );

  it.each([
    ["respondToInvite", () => respondToInvite("i", true), "invite_not_found"],
    ["cancelInvite", () => cancelInvite("i"), "invite_not_found"],
    ["endCoaching", () => endCoaching("c"), "coaching_not_found"],
  ])("%s refreshes coachings when it fails, so the stale card goes", async (_name, call, code) => {
    await expect(call()).rejects.toMatchObject({ message: code });
    expect(mutate).toHaveBeenCalledWith("coachings");
  });

  it("addClient asks the server as the signed-in user", async () => {
    const fetchMock = serverSays(200, { result: "added" });
    await expect(addClient("c@x", "C")).resolves.toBe("added");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/clients",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "c@x", name: "C" }),
        headers: expect.objectContaining({ authorization: "Bearer tok" }),
      }),
    );
    expect(mutate).toHaveBeenCalledWith("coachings");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("addClient falls back to a plain invite when the server can't create accounts", async () => {
    serverSays(501, { error: "not_configured" });
    await expect(addClient("c@x", "")).resolves.toBe("invited");
    expect(rpc).toHaveBeenCalledWith("invite_client");
  });

  it("addClient passes the server's error code on and refreshes coachings", async () => {
    serverSays(400, { error: "already_invited" });
    await expect(addClient("c@x", "")).rejects.toMatchObject({ message: "already_invited" });
    expect(mutate).toHaveBeenCalledWith("coachings");
  });

  it("clientLabel prefers the trainer's name for the client", () => {
    expect(clientLabel(row({ clientName: "Manželka" }))).toBe("Manželka");
    expect(clientLabel(row({}))).toBe("c@x");
  });
});
