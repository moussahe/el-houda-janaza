import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Simple wrapper - mocks are already set up in setup.ts
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
