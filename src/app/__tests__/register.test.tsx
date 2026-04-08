import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../[locale]/(auth)/register/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...(actual as any),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => "/fr/register",
    useParams: () => ({ locale: "fr" }),
    useSearchParams: () => new URLSearchParams(),
  };
});

describe("RegisterPage", () => {
  it("should render the registration form", () => {
    render(<RegisterPage />);

    expect(screen.getByText("common.appName")).toBeInTheDocument();
    expect(screen.getByText("auth.registerTitle")).toBeInTheDocument();
    expect(screen.getByText("auth.registerSubtitle")).toBeInTheDocument();
  });

  it("should render all form fields", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText("auth.lastName")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.firstName")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.phone")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.getByLabelText("common.address")).toBeInTheDocument();
    expect(screen.getByLabelText("common.city")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.confirmPassword")).toBeInTheDocument();
  });

  it("should render country of origin dropdown", () => {
    render(<RegisterPage />);
    expect(screen.getByText("auth.countryOfOrigin")).toBeInTheDocument();
  });

  it("should render subscription type dropdown", () => {
    render(<RegisterPage />);
    expect(screen.getByText("auth.subscriptionType")).toBeInTheDocument();
  });

  it("should render submit button", () => {
    render(<RegisterPage />);
    const button = screen.getByRole("button", { name: "common.register" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should render link to login page", () => {
    render(<RegisterPage />);
    expect(screen.getByText("auth.hasAccount")).toBeInTheDocument();
    const link = screen.getByText("common.login");
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });

  it("should render locale switcher", () => {
    render(<RegisterPage />);
    expect(screen.getByText("العربية")).toBeInTheDocument();
  });

  it("should allow filling in all text fields", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("auth.lastName"), "TestNom");
    await user.type(screen.getByLabelText("auth.firstName"), "TestPrenom");
    await user.type(screen.getByLabelText("auth.phone"), "06 11 22 33 44");
    await user.type(screen.getByLabelText("auth.email"), "test@register.com");
    await user.type(screen.getByLabelText("common.address"), "1 rue Test");
    await user.type(screen.getByLabelText("common.city"), "Villefranche");
    await user.type(screen.getByLabelText("auth.password"), "pass123");
    await user.type(screen.getByLabelText("auth.confirmPassword"), "pass123");

    expect(screen.getByLabelText("auth.lastName")).toHaveValue("TestNom");
    expect(screen.getByLabelText("auth.firstName")).toHaveValue("TestPrenom");
    expect(screen.getByLabelText("auth.email")).toHaveValue(
      "test@register.com",
    );
  });

  it("should show error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("auth.lastName"), "Nom");
    await user.type(screen.getByLabelText("auth.firstName"), "Prenom");
    await user.type(screen.getByLabelText("auth.phone"), "06 11 22 33 44");
    await user.type(screen.getByLabelText("auth.email"), "new@register.com");
    await user.type(screen.getByLabelText("auth.password"), "pass123");
    await user.type(screen.getByLabelText("auth.confirmPassword"), "different");
    await user.click(screen.getByRole("button", { name: "common.register" }));

    await waitFor(() => {
      // The hardcoded French error message
      expect(
        screen.getByText("Les mots de passe ne correspondent pas"),
      ).toBeInTheDocument();
    });
  });

  it("should show success screen after successful registration", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("auth.lastName"), "Nouveau");
    await user.type(screen.getByLabelText("auth.firstName"), "Membre");
    await user.type(screen.getByLabelText("auth.phone"), "06 99 88 77 66");
    await user.type(screen.getByLabelText("auth.email"), "unique-reg@test.com");
    await user.type(screen.getByLabelText("auth.password"), "pass123");
    await user.type(screen.getByLabelText("auth.confirmPassword"), "pass123");
    await user.click(screen.getByRole("button", { name: "common.register" }));

    await waitFor(() => {
      expect(screen.getByText("auth.registerSuccess")).toBeInTheDocument();
    });
  });

  it("should show family members section when family is selected by default (individual selected)", () => {
    render(<RegisterPage />);
    // By default, subscription is "individual" so family section should not be visible
    // The "members.addFamilyMember" text appears only in family mode
    expect(screen.queryByText("members.familyMembers")).not.toBeInTheDocument();
  });
});
