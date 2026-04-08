import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import TarifsPage from "../[locale]/(admin)/admin/tarifs/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("TarifsPage", () => {
  it("should show loading state initially", () => {
    render(<TarifsPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should render page title after loading", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.title")).toBeInTheDocument();
    });
  });

  it("should display individual and family plan cards", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.individualPlan")).toBeInTheDocument();
      expect(screen.getByText("pricing.familyPlan")).toBeInTheDocument();
    });
  });

  it("should display price amount inputs", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.title")).toBeInTheDocument();
    });

    const amountLabels = screen.getAllByText(/pricing\.amount/);
    expect(amountLabels.length).toBe(2);
  });

  it("should display period dropdowns", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.title")).toBeInTheDocument();
    });

    const periodLabels = screen.getAllByText("pricing.period");
    expect(periodLabels.length).toBe(2);
  });

  it("should display update buttons for each plan", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.title")).toBeInTheDocument();
    });

    const updateButtons = screen.getAllByText("pricing.updatePricing");
    expect(updateButtons.length).toBe(2);
  });

  it("should display the pricing note", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.priceNote")).toBeInTheDocument();
    });
  });

  it("should display annual/monthly text", async () => {
    render(<TarifsPage />);

    await waitFor(() => {
      expect(screen.getByText("pricing.title")).toBeInTheDocument();
    });

    // Both plans show the period text - "pricing.annual" is inside a span with "/ " prefix
    const annualTexts = screen.getAllByText(/pricing\.annual/);
    expect(annualTexts.length).toBeGreaterThan(0);
  });
});
