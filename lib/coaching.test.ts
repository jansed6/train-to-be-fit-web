import { describe, it, expect, vi, beforeEach } from "vitest";
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
} from "./coaching";

vi.mock("swr", () => ({ mutate: vi.fn(() => Promise.resolve()) }));

// Every RPC fails as if the invite / coaching changed elsewhere.
vi.mock("./supabase", () => ({
  supabase: {
    rpc: (fn: string) =>
      Promise.resolve({
        data: null,
        error: { message: fn === "end_coaching" ? "coaching_not_found" : "invite_not_found" },
      }),
  },
}));

beforeEach(() => vi.mocked(mutate).mockClear());

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
    ["already_invited", "You've already invited this email."],
    [
      "already_has_trainer",
      "You already have a trainer. End that coaching first to accept a new one.",
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

  it("clientLabel prefers the trainer's name for the client", () => {
    expect(clientLabel(row({ clientName: "Manželka" }))).toBe("Manželka");
    expect(clientLabel(row({}))).toBe("c@x");
  });
});
