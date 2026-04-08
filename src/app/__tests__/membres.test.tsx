import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import MembresPage from "../[locale]/(admin)/admin/membres/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("MembresPage", () => {
  it("should render page title", () => {
    render(<MembresPage />);
    expect(screen.getByText("members.title")).toBeInTheDocument();
  });

  it("should render add member button", () => {
    render(<MembresPage />);
    expect(screen.getByText("members.addMember")).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    render(<MembresPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should load and display members after loading", async () => {
    render(<MembresPage />);

    await waitFor(() => {
      // Members table should appear
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // Table headers
    expect(screen.getByText("members.name")).toBeInTheDocument();
    expect(screen.getByText("members.phone")).toBeInTheDocument();
    expect(screen.getByText("members.formula")).toBeInTheDocument();
    expect(screen.getByText("common.status")).toBeInTheDocument();
    expect(screen.getByText("common.actions")).toBeInTheDocument();
  });

  it("should display member data in table", async () => {
    render(<MembresPage />);

    await waitFor(() => {
      // Benali Ahmed is in demo data
      expect(screen.getByText(/Benali/)).toBeInTheDocument();
    });
  });

  it("should render search input", () => {
    render(<MembresPage />);
    const searchInput = screen.getByPlaceholderText(
      "members.searchPlaceholder",
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("should filter members by search term", async () => {
    const user = userEvent.setup();
    render(<MembresPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "members.searchPlaceholder",
    );
    await user.type(searchInput, "Benali");

    await waitFor(() => {
      expect(screen.getByText(/Benali/)).toBeInTheDocument();
    });
  });

  it("should show member count", async () => {
    render(<MembresPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    // 15 members in demo data
    expect(screen.getByText(/15.*members\.title/i)).toBeInTheDocument();
  });

  it("should render view buttons for each member", async () => {
    render(<MembresPage />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText("common.view");
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it("should show status and type filter dropdowns", () => {
    render(<MembresPage />);
    // The filter dropdowns should be rendered
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });
});
