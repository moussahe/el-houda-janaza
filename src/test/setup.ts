import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
  getMessages: () => ({}),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/fr/admin",
  useParams: () => ({ locale: "fr" }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock @/i18n/navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
  redirect: vi.fn(),
  usePathname: () => "/fr/admin",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
