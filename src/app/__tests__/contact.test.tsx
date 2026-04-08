import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import ContactPage from "../[locale]/(member)/espace/contact/page";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("ContactPage", () => {
  it("should render contact page title", () => {
    render(<ContactPage />);
    const titles = screen.getAllByText("member.contact");
    expect(titles.length).toBeGreaterThanOrEqual(1);
    // The h1 title should be present
    expect(titles[0]).toBeInTheDocument();
  });

  it("should render subject input", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText("member.contactSubject")).toBeInTheDocument();
  });

  it("should render message textarea", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText("member.contactMessage")).toBeInTheDocument();
  });

  it("should render submit button", () => {
    render(<ContactPage />);
    const button = screen.getByRole("button", { name: /member\.contactSend/ });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should allow typing in subject field", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    const subject = screen.getByLabelText("member.contactSubject");
    await user.type(subject, "Test Subject");
    expect(subject).toHaveValue("Test Subject");
  });

  it("should allow typing in message field", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    const message = screen.getByLabelText("member.contactMessage");
    await user.type(message, "Test message content");
    expect(message).toHaveValue("Test message content");
  });

  it("should render description text", () => {
    render(<ContactPage />);
    // French description text
    expect(screen.getByText(/Envoyez un message/)).toBeInTheDocument();
  });
});
