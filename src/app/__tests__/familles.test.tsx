import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import FamillesPage from "../[locale]/(admin)/admin/familles/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("FamillesPage", () => {
  it("should show loading state initially", () => {
    render(<FamillesPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should render page title after loading", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      expect(screen.getByText("families.title")).toBeInTheDocument();
    });
  });

  it("should display family count badge", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      // 8 families in demo data
      expect(screen.getByText("8")).toBeInTheDocument();
    });
  });

  it("should display family cards", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      expect(screen.getByText("families.title")).toBeInTheDocument();
    });

    // Family names from demo data
    expect(screen.getByText("Benali")).toBeInTheDocument();
    expect(screen.getByText("Khelifi")).toBeInTheDocument();
  });

  it("should show head of family label", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      expect(screen.getByText("families.title")).toBeInTheDocument();
    });

    const headLabels = screen.getAllByText(/families\.headOfFamily/);
    expect(headLabels.length).toBeGreaterThan(0);
  });

  it("should display covered members count badges", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      expect(screen.getByText("families.title")).toBeInTheDocument();
    });

    // Each family card shows member count - "X families.coveredMembers" is lowercase
    const coveredTexts = screen.getAllByText(/families\.coveredmembers/i);
    expect(coveredTexts.length).toBeGreaterThan(0);
  });

  it("should render view buttons for each family", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      expect(screen.getByText("families.title")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText("common.view");
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it("should display family member badges", async () => {
    render(<FamillesPage />);

    await waitFor(() => {
      expect(screen.getByText("families.title")).toBeInTheDocument();
    });

    // Family members are shown as badges with relationship
    // Fatima Benali is in the Benali family
    expect(screen.getByText(/Fatima/)).toBeInTheDocument();
  });
});
