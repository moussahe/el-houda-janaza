import { createBrowserClient } from "@supabase/ssr";
import { createMockClient } from "./mock-client";

const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "your-project-url" ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "";

export function createClient() {
  if (isDemoMode) {
    return createMockClient() as any;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
