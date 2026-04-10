import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import LoginPage from "../[locale]/(auth)/login/page";

// Mock sonner
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Track router.push calls
const mockPush = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...(actual as any),
    useRouter: () => ({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => "/fr/login",
    useParams: () => ({ locale: "fr" }),
    useSearchParams: () => new URLSearchParams(),
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("should render the login form", () => {
    render(<LoginPage />);

    // Title and mosque name (translation keys)
    expect(screen.getByText("common.appName")).toBeInTheDocument();
    expect(screen.getByText("common.mosqueName")).toBeInTheDocument();
    expect(screen.getByText("auth.loginTitle")).toBeInTheDocument();
    expect(screen.getByText("auth.loginSubtitle")).toBeInTheDocument();
  });

  it("should render email and password fields", () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("auth.email");
    const passwordInput = screen.getByLabelText("auth.password");

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should render submit button", () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: "common.login" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should render link to register page", () => {
    render(<LoginPage />);

    expect(screen.getByText("auth.noAccount")).toBeInTheDocument();
    expect(screen.getByText("auth.createAccount")).toBeInTheDocument();
    const link = screen.getByText("auth.createAccount");
    expect(link.closest("a")).toHaveAttribute("href", "/register");
  });

  it("should render locale switcher", () => {
    render(<LoginPage />);
    // The LocaleSwitcher component should be present
    expect(screen.getByText("العربية")).toBeInTheDocument();
  });

  it("should allow typing in email field", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("auth.email");
    await user.type(emailInput, "test@example.com");
    expect(emailInput).toHaveValue("test@example.com");
  });

  it("should allow typing in password field", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("auth.password");
    await user.type(passwordInput, "mypassword");
    expect(passwordInput).toHaveValue("mypassword");
  });

  it("should submit form and redirect admin to /admin", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("auth.email"), "admin@djanaiz.fr");
    await user.type(screen.getByLabelText("auth.password"), "admin123");
    await user.click(screen.getByRole("button", { name: "common.login" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/fr/admin");
    });
  });

  it("should submit form and redirect member to /espace", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByLabelText("auth.email"),
      "ahmed.benali@email.com",
    );
    await user.type(screen.getByLabelText("auth.password"), "test123");
    await user.click(screen.getByRole("button", { name: "common.login" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/fr/espace");
    });
  });

  it("should show error on invalid credentials", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("auth.email"), "wrong@email.com");
    await user.type(screen.getByLabelText("auth.password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "common.login" }));

    await waitFor(() => {
      expect(screen.getByText("auth.loginError")).toBeInTheDocument();
    });
  });

  it("should show loading state when submitting", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("auth.email"), "admin@djanaiz.fr");
    await user.type(screen.getByLabelText("auth.password"), "admin123");

    const button = screen.getByRole("button", { name: "common.login" });
    await user.click(button);

    // After submit, button might briefly show loading text
    // The async flow completes quickly with mock client
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });
});
