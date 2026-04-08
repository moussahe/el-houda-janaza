"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(t("auth.loginError"));
        return;
      }

      // Check user role to redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from("members")
          .select("role, status")
          .eq("user_id", user.id)
          .single();

        if (member?.role === "admin") {
          router.push(`/${locale}/admin`);
        } else if (member?.status === "pending") {
          router.push(`/${locale}/espace`);
        } else {
          router.push(`/${locale}/espace`);
        }
      }
    } catch {
      setError(t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
      <div className="absolute top-4 end-4">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl text-primary-foreground">🕌</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("common.appName")}
          </h1>
          <p className="text-muted-foreground">{t("common.mosqueName")}</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.loginTitle")}</CardTitle>
            <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("common.login")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {t("auth.noAccount")}{" "}
              </span>
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                {t("auth.createAccount")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
