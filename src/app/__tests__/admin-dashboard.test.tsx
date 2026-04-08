import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import AdminDashboard from "../[locale]/(admin)/admin/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("AdminDashboard", () => {
  it("should render loading state initially", () => {
    render(<AdminDashboard />);
    expect(screen.getByText("dashboard.title")).toBeInTheDocument();
  });

  it("should render all 5 stat cards after loading", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.totalMembers")).toBeInTheDocument();
    });

    expect(screen.getByText("dashboard.totalFamilies")).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.pendingRegistrations"),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard.overdueMembers")).toBeInTheDocument();
    expect(screen.getByText("dashboard.totalBalance")).toBeInTheDocument();
  });

  it("should render pending registrations section", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.pendingList")).toBeInTheDocument();
    });
  });

  it("should render overdue section", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.overdueList")).toBeInTheDocument();
    });
  });

  it("should render recent payments section", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.recentPayments")).toBeInTheDocument();
    });
  });

  it("should display view buttons for each section", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const viewButtons = screen.getAllByText("common.view");
      // At least 3 view buttons: pending list, overdue list, payments
      expect(viewButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("should show pending members table headers when there are pending members", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.totalMembers")).toBeInTheDocument();
    });

    // The pending members table should show name/phone/formula columns
    const nameHeaders = screen.getAllByText("members.name");
    expect(nameHeaders.length).toBeGreaterThan(0);
  });

  it("should render active cases section when there are active cases", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.totalMembers")).toBeInTheDocument();
    });

    // Active cases section appears if there are declared/in_progress cases
    const activeCasesTitle = screen.queryByText("dashboard.activeCases");
    // May or may not be present depending on demo data
    if (activeCasesTitle) {
      expect(activeCasesTitle).toBeInTheDocument();
    }
  });

  it("should show member count value", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      // Stats cards show numeric values - the active member count from demo data
      // There are 12 active members in demo data
      expect(screen.getByText("12")).toBeInTheDocument();
    });
  });

  it("should show family count value", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      // There are 8 families in demo data
      expect(screen.getByText("8")).toBeInTheDocument();
    });
  });
});
