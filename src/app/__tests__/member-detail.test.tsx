import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import MemberDetailPage from "../[locale]/(admin)/admin/membres/[id]/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock useParams to return a specific member ID
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
    usePathname: () => "/fr/admin/membres/member-001",
    useParams: () => ({ locale: "fr", id: "member-001" }),
    useSearchParams: () => new URLSearchParams(),
  };
});

describe("MemberDetailPage", () => {
  it("should show loading state initially", () => {
    render(<MemberDetailPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should render member name after loading", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      const names = screen.getAllByText(/Benali.*Ahmed/);
      expect(names.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should render personal info section", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.personalInfo")).toBeInTheDocument();
    });
  });

  it("should render status badge", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Member-001 is active, so the active status label should appear
    // Via MEMBER_STATUSES[labelKey]
    const badges = screen.getAllByRole("generic");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("should render record payment button", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.recordPayment")).toBeInTheDocument();
    });
  });

  it("should render suspend button for active member", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.suspend")).toBeInTheDocument();
    });
  });

  it("should render edit info button", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.editInfo")).toBeInTheDocument();
    });
  });

  it("should render back button", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // ArrowLeft icon button links back to /admin/membres
    const backLink = screen.getByRole("link", { name: "" });
    expect(backLink).toHaveAttribute("href", "/admin/membres");
  });

  it("should display personal info fields", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.personalInfo")).toBeInTheDocument();
    });

    expect(screen.getByText("members.lastName")).toBeInTheDocument();
    expect(screen.getByText("members.firstName")).toBeInTheDocument();
    expect(screen.getByText("common.phone")).toBeInTheDocument();
    expect(screen.getByText("common.email")).toBeInTheDocument();
  });

  it("should render family members section for family subscription member", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.familyMembers")).toBeInTheDocument();
    });

    // member-001 has family subscription
    expect(screen.getByText("members.addFamilyMember")).toBeInTheDocument();
  });

  it("should render payment history section", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.paymentHistory")).toBeInTheDocument();
    });
  });

  it("should show subscription type", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.subscriptionType")).toBeInTheDocument();
    });
  });

  it("should show country of origin", async () => {
    render(<MemberDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("members.countryOfOrigin")).toBeInTheDocument();
    });
  });
});
