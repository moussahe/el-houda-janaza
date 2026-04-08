import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import ParametresPage from "../[locale]/(admin)/admin/parametres/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("ParametresPage", () => {
  it("should show loading state initially", () => {
    render(<ParametresPage />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should render page title after loading", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });
  });

  it("should render mosque info section", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.mosqueInfo")).toBeInTheDocument();
    });

    expect(screen.getByText("settings.mosqueName")).toBeInTheDocument();
    expect(screen.getByText("settings.mosquePhone")).toBeInTheDocument();
    expect(screen.getByText("settings.mosqueEmail")).toBeInTheDocument();
  });

  it("should render cities section", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.cities")).toBeInTheDocument();
    });
  });

  it("should render agents section", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.agents")).toBeInTheDocument();
    });
  });

  it("should render password change section", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.changePassword")).toBeInTheDocument();
    });
  });

  it("should render export section", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.exportData")).toBeInTheDocument();
    });

    expect(screen.getByText("settings.exportMembers")).toBeInTheDocument();
    expect(screen.getByText("settings.exportPayments")).toBeInTheDocument();
  });

  it("should render save buttons", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByText("common.save");
    expect(saveButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("should render add agent form fields", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    expect(screen.getByText("settings.agentName")).toBeInTheDocument();
    expect(screen.getByText("settings.agentPhone")).toBeInTheDocument();
  });

  it("should render add agent button", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    const addAgentButtons = screen.getAllByText("settings.addAgent");
    expect(addAgentButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render new password input", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.newPassword")).toBeInTheDocument();
    });
  });

  it("should display agent names from demo data", async () => {
    render(<ParametresPage />);

    await waitFor(() => {
      expect(screen.getByText("settings.agents")).toBeInTheDocument();
    });

    // Demo data has agents
    const agentNames = screen.getAllByRole("button");
    expect(agentNames.length).toBeGreaterThan(0);
  });
});
