import { describe, it, expect } from "vitest";
import {
  type Coaching,
  myClients,
  myPendingInvites,
  invitesForMe,
  myTrainer,
  coachingErrorMessage,
  clientLabel,
} from "./coaching";

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
    ["boom", "Something went wrong. Try again."],
  ])("%s -> message", (code, text) =>
    expect(coachingErrorMessage({ message: code })).toBe(text)
  );

  it("clientLabel prefers the trainer's name for the client", () => {
    expect(clientLabel(row({ clientName: "Manželka" }))).toBe("Manželka");
    expect(clientLabel(row({}))).toBe("c@x");
  });
});
