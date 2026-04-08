import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import PaiementsPage from "../[locale]/(admin)/admin/paiements/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("PaiementsPage", () => {
  it("should render page title", () => {
    render(<PaiementsPage />);
    expect(screen.getByText("payments.title")).toBeInTheDocument();
  });

  it("should render export CSV button", () => {
    render(<PaiementsPage />);
    expect(screen.getByText("common.export")).toBeInTheDocument();
  });

  it("should render record payment button", () => {
    render(<PaiementsPage />);
    expect(screen.getByText("payments.recordPayment")).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    render(<PaiementsPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should load and display payments after loading", async () => {
    render(<PaiementsPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Table headers
    expect(screen.getByText("common.date")).toBeInTheDocument();
    expect(screen.getByText("payments.member")).toBeInTheDocument();
    expect(screen.getByText("common.amount")).toBeInTheDocument();
    expect(screen.getByText("payments.method")).toBeInTheDocument();
    expect(screen.getByText("payments.period")).toBeInTheDocument();
  });

  it("should show search input", () => {
    render(<PaiementsPage />);
    const searchInput = screen.getByPlaceholderText(
      "members.searchPlaceholder",
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("should show payment method filter", () => {
    render(<PaiementsPage />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("should show total collected amount", async () => {
    render(<PaiementsPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // "payments.totalCollected:" is split across elements
    expect(screen.getByText(/payments\.totalCollected/)).toBeInTheDocument();
  });

  it("should show payment count", async () => {
    render(<PaiementsPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Payment count in footer - payments.title appears multiple times (header + footer)
    const titles = screen.getAllByText(/payments\.title/i);
    expect(titles.length).toBeGreaterThanOrEqual(2);
  });
});
