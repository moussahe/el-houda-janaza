import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import InscriptionsPage from "../[locale]/(admin)/admin/inscriptions/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("InscriptionsPage", () => {
  it("should show loading state initially", () => {
    render(<InscriptionsPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should render page title after loading", async () => {
    render(<InscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText("registrations.title")).toBeInTheDocument();
    });
  });

  it("should show pending members count badge", async () => {
    render(<InscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText("registrations.title")).toBeInTheDocument();
    });

    // There are 2 pending members in demo data
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should display pending member cards with validate and refuse buttons", async () => {
    render(<InscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText("registrations.title")).toBeInTheDocument();
    });

    // Each pending member should have validate and refuse buttons
    const validateButtons = screen.getAllByText("registrations.validate");
    const refuseButtons = screen.getAllByText("registrations.refuse");

    expect(validateButtons.length).toBe(2);
    expect(refuseButtons.length).toBe(2);
  });

  it("should show pending member names", async () => {
    render(<InscriptionsPage />);

    await waitFor(() => {
      // Saidi Malik and Djebbar Farid are pending
      expect(screen.getByText(/Saidi/)).toBeInTheDocument();
      // Djebbar may appear multiple times (name + family member badge)
      const djebbarElements = screen.getAllByText(/Djebbar/);
      expect(djebbarElements.length).toBeGreaterThan(0);
    });
  });

  it("should display member info fields", async () => {
    render(<InscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText("registrations.title")).toBeInTheDocument();
    });

    // Phone label is embedded in "common.phone: " span, text is split
    // Use a regex to find the text containing the key
    const phoneLabels = screen.getAllByText(/common\.phone/);
    expect(phoneLabels.length).toBeGreaterThan(0);
  });

  it("should display registration date", async () => {
    render(<InscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText("registrations.title")).toBeInTheDocument();
    });

    // The registration date label is in a span with ": " suffix
    const dateLabels = screen.getAllByText(/registrations\.registrationDate/);
    expect(dateLabels.length).toBeGreaterThan(0);
  });
});
