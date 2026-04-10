"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

const navItems = [
  { key: "dashboard", href: "/espace", icon: LayoutDashboard },
  { key: "myFamily", href: "/espace/famille", icon: Users },
  { key: "myPayments", href: "/espace/paiements", icon: CreditCard },
  { key: "contact", href: "/espace/contact", icon: MessageSquare },
];

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("member");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    if (href === "/espace") {
      return pathname === localePath;
    }
    return pathname.startsWith(localePath);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <span className="text-sm">🕌</span>
            </div>
            <span className="font-bold text-sm">Djanaiz</span>
          </div>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  isActive(item.href)
                    ? "border-sidebar-primary text-sidebar-primary-foreground"
                    : "border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground/80",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t(item.key)}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
