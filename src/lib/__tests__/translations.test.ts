import { describe, it, expect } from "vitest";
import fr from "../../messages/fr.json";
import ar from "../../messages/ar.json";

describe("Translations", () => {
  const flattenKeys = (obj: any, prefix = ""): string[] => {
    return Object.keys(obj).reduce((acc: string[], key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        return [...acc, ...flattenKeys(obj[key], path)];
      }
      return [...acc, path];
    }, []);
  };

  const frKeys = flattenKeys(fr);
  const arKeys = flattenKeys(ar);

  it("should have the same number of keys in FR and AR", () => {
    expect(frKeys.length).toBe(arKeys.length);
  });

  it("every FR key should exist in AR", () => {
    const missingInAr = frKeys.filter((k) => !arKeys.includes(k));
    expect(missingInAr).toEqual([]);
  });

  it("every AR key should exist in FR", () => {
    const missingInFr = arKeys.filter((k) => !frKeys.includes(k));
    expect(missingInFr).toEqual([]);
  });

  it("no FR translation should be empty", () => {
    const empty = frKeys.filter((k) => {
      const parts = k.split(".");
      let val: any = fr;
      for (const p of parts) val = val[p];
      return val === "" || val === null || val === undefined;
    });
    expect(empty).toEqual([]);
  });

  it("no AR translation should be empty", () => {
    const empty = arKeys.filter((k) => {
      const parts = k.split(".");
      let val: any = ar;
      for (const p of parts) val = val[p];
      return val === "" || val === null || val === undefined;
    });
    expect(empty).toEqual([]);
  });

  it("should have all major sections", () => {
    const sections = [
      "common",
      "auth",
      "admin",
      "dashboard",
      "members",
      "families",
      "registrations",
      "payments",
      "pricing",
      "repatriation",
      "settings",
      "member",
    ];
    sections.forEach((section) => {
      expect(fr).toHaveProperty(section);
      expect(ar).toHaveProperty(section);
    });
  });

  it("AR translations should contain Arabic characters", () => {
    const arabicRegex = /[\u0600-\u06FF]/;
    const getValues = (obj: any): string[] => {
      return Object.values(obj).reduce((acc: string[], val) => {
        if (typeof val === "object" && val !== null) {
          return [...acc, ...getValues(val)];
        }
        return [...acc, String(val)];
      }, []);
    };

    const arValues = getValues(ar);
    arValues.forEach((val) => {
      expect(arabicRegex.test(val)).toBe(true);
    });
  });

  it("FR translations should not contain Arabic characters", () => {
    const arabicRegex = /[\u0600-\u06FF]/;
    const getValues = (obj: any): string[] => {
      return Object.values(obj).reduce((acc: string[], val) => {
        if (typeof val === "object" && val !== null) {
          return [...acc, ...getValues(val)];
        }
        return [...acc, String(val)];
      }, []);
    };

    const frValues = getValues(fr);
    frValues.forEach((val) => {
      expect(arabicRegex.test(val)).toBe(false);
    });
  });
});
