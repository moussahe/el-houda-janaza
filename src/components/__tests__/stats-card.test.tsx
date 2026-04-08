import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "../../components/admin/stats-card";
import { Users } from "lucide-react";

describe("StatsCard", () => {
  it("should render title and value", () => {
    render(<StatsCard title="Total Members" value={42} icon={Users} />);

    expect(screen.getByText("Total Members")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render string value", () => {
    render(<StatsCard title="Balance" value="1 234 €" icon={Users} />);

    expect(screen.getByText("1 234 €")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    render(
      <StatsCard
        title="Members"
        value={10}
        icon={Users}
        description="Active only"
      />,
    );

    expect(screen.getByText("Active only")).toBeInTheDocument();
  });

  it("should apply alert styling when alert is true", () => {
    const { container } = render(
      <StatsCard title="Overdue" value={5} icon={Users} alert={true} />,
    );

    // Check that destructive classes are applied
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("destructive");
  });

  it("should not apply alert styling by default", () => {
    const { container } = render(
      <StatsCard title="Normal" value={5} icon={Users} />,
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("destructive");
  });

  it("should accept custom className", () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value={1}
        icon={Users}
        className="custom-class"
      />,
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("custom-class");
  });
});
