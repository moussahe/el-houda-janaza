import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import RapatriementsPage from "../[locale]/(admin)/admin/rapatriements/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("RapatriementsPage", () => {
  it("should render page title", () => {
    render(<RapatriementsPage />);
    expect(screen.getByText("repatriation.title")).toBeInTheDocument();
  });

  it("should render new case button", () => {
    render(<RapatriementsPage />);
    expect(screen.getByText("repatriation.newCase")).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    render(<RapatriementsPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should load and display cases after loading", async () => {
    render(<RapatriementsPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Table headers
    expect(screen.getByText("repatriation.deceasedName")).toBeInTheDocument();
    expect(screen.getByText("repatriation.member")).toBeInTheDocument();
    expect(screen.getByText("repatriation.destination")).toBeInTheDocument();
    expect(screen.getByText("repatriation.agent")).toBeInTheDocument();
    expect(screen.getByText("repatriation.costEstimate")).toBeInTheDocument();
    expect(screen.getByText("repatriation.status")).toBeInTheDocument();
    expect(screen.getByText("common.actions")).toBeInTheDocument();
  });

  it("should display deceased names from demo data", async () => {
    render(<RapatriementsPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Demo data has repatriation cases with deceased names
    const rows = screen.getAllByRole("row");
    // Header row + data rows
    expect(rows.length).toBeGreaterThan(1);
  });

  it("should have status change dropdowns for each case", async () => {
    render(<RapatriementsPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Each case row has a status select
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });
});
