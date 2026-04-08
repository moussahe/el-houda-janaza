import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the specific modules
const mockPush = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/fr/admin",
}));

import { LocaleSwitcher } from "../../components/shared/locale-switcher";

describe("LocaleSwitcher", () => {
  it("should render with Arabic text when locale is fr", () => {
    render(<LocaleSwitcher />);
    expect(screen.getByText("العربية")).toBeInTheDocument();
  });

  it("should switch locale on click", () => {
    render(<LocaleSwitcher />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockPush).toHaveBeenCalledWith("/ar/admin");
  });
});
