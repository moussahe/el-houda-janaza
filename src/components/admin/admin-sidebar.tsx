"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  UserPlus,
  CreditCard,
  Tag,
  Plane,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "members", href: "/admin/membres", icon: Users },
  { key: "families", href: "/admin/familles", icon: Home },
  { key: "registrations", href: "/admin/inscriptions", icon: UserPlus },
  { key: "payments", href: "/admin/paiements", icon: CreditCard },
  { key: "pricing", href: "/admin/tarifs", icon: Tag },
  { key: "repatriation", href: "/admin/rapatriements", icon: Plane },
  { key: "messages", href: "/admin/messages", icon: MessageSquare },
  { key: "settings", href: "/admin/parametres", icon: Settings },
];

export function AdminSidebar() {
  const t = useTranslations("admin");
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
    if (href === "/admin") {
      return pathname === localePath;
    }
    return pathname.startsWith(localePath);
  };

  return (
    <aside className="fixed inset-y-0 start-0 z-30 w-64 bg-sidebar text-sidebar-foreground border-e border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🕌</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm truncate">El Houda</h2>
            <p className="text-xs text-sidebar-foreground/60">Janaza</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <LocaleSwitcher />
        <Separator className="bg-sidebar-border" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard") === "لوحة التحكم" ? "تسجيل الخروج" : "Déconnexion"}
        </Button>
      </div>
    </aside>
  );
}
