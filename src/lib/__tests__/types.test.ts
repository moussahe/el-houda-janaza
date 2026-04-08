import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  PAYMENT_METHODS,
  RELATIONSHIPS,
  MEMBER_STATUSES,
  REPATRIATION_STATUSES,
  SUBSCRIPTION_TYPES,
} from "../constants";
import type {
  Country,
  PaymentMethod,
  Relationship,
  MemberStatus,
  RepatriationStatus,
  SubscriptionType,
} from "../types";

describe("Type-Constant consistency", () => {
  it("COUNTRIES values should match Country type values", () => {
    const expectedCountries: Country[] = [
      "algeria",
      "morocco",
      "tunisia",
      "libya",
      "mauritania",
      "other",
    ];
    const constantValues = COUNTRIES.map((c) => c.value);
    expect(constantValues).toEqual(expectedCountries);
  });

  it("PAYMENT_METHODS values should match PaymentMethod type", () => {
    const expected: PaymentMethod[] = ["cash", "transfer", "check"];
    const values = PAYMENT_METHODS.map((m) => m.value);
    expect(values).toEqual(expected);
  });

  it("RELATIONSHIPS values should match Relationship type", () => {
    const expected: Relationship[] = [
      "head",
      "spouse",
      "son",
      "daughter",
      "father",
      "mother",
      "brother",
      "sister",
    ];
    const values = RELATIONSHIPS.map((r) => r.value);
    expect(values).toEqual(expected);
  });

  it("MEMBER_STATUSES values should match MemberStatus type", () => {
    const expected: MemberStatus[] = ["pending", "active", "suspended"];
    const values = MEMBER_STATUSES.map((s) => s.value);
    expect(values).toEqual(expected);
  });

  it("REPATRIATION_STATUSES values should match RepatriationStatus type", () => {
    const expected: RepatriationStatus[] = [
      "declared",
      "in_progress",
      "repatriated",
      "closed",
    ];
    const values = REPATRIATION_STATUSES.map((s) => s.value);
    expect(values).toEqual(expected);
  });

  it("SUBSCRIPTION_TYPES values should match SubscriptionType type", () => {
    const expected: SubscriptionType[] = ["individual", "family"];
    const values = SUBSCRIPTION_TYPES.map((s) => s.value);
    expect(values).toEqual(expected);
  });
});
