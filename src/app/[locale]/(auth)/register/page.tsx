"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { COUNTRIES, RELATIONSHIPS, SUBSCRIPTION_TYPES } from "@/lib/constants";
import { Country, Relationship } from "@/lib/types";
import { Plus, Trash2, CheckCircle } from "lucide-react";

interface FamilyMemberInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  relationship: Relationship;
}

export default function RegisterPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    countryOfOrigin: "algeria" as Country,
    subscriptionType: "individual" as "individual" | "family",
    address: "",
    city: "",
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>([]);

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        first_name: "",
        last_name: form.lastName,
        date_of_birth: "",
        relationship: "spouse",
      },
    ]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (
    index: number,
    field: keyof FamilyMemberInput,
    value: string,
  ) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError || !authData.user) {
        setError(t("auth.registerError"));
        return;
      }

      // 2. Create member record
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          user_id: authData.user.id,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          country_of_origin: form.countryOfOrigin,
          subscription_type: form.subscriptionType,
          status: "pending",
          role: "member",
        })
        .select()
        .single();

      if (memberError || !member) {
        setError(t("auth.registerError"));
        return;
      }

      // 3. If family subscription, create family and members
      if (form.subscriptionType === "family" && familyMembers.length > 0) {
        const { data: family } = await supabase
          .from("families")
          .insert({
            head_member_id: member.id,
            name: form.lastName,
          })
          .select()
          .single();

        if (family) {
          // Add head as family member
          await supabase.from("family_members").insert({
            family_id: family.id,
            member_id: member.id,
            first_name: form.firstName,
            last_name: form.lastName,
            relationship: "head",
          });

          // Add other family members
          for (const fm of familyMembers) {
            await supabase.from("family_members").insert({
              family_id: family.id,
              first_name: fm.first_name,
              last_name: fm.last_name,
              date_of_birth: fm.date_of_birth || null,
              relationship: fm.relationship,
            });
          }
        }
      }

      setSuccess(true);
    } catch {
      setError(t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-primary" />
            <h2 className="text-xl font-semibold">{t("auth.registerTitle")}</h2>
            <p className="text-muted-foreground">{t("auth.registerSuccess")}</p>
            <Link href="/login">
              <Button className="mt-4">{t("common.login")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-4 py-8">
      <div className="absolute top-4 end-4">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl text-primary-foreground">🕌</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("common.appName")}
          </h1>
          <p className="text-muted-foreground">{t("common.mosqueName")}</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.registerTitle")}</CardTitle>
            <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t("common.city")}</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("auth.countryOfOrigin")}</Label>
                <Select
                  value={form.countryOfOrigin}
                  onValueChange={(v) =>
                    setForm({ ...form, countryOfOrigin: (v ?? "") as Country })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c: any) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c[labelKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("auth.subscriptionType")}</Label>
                <Select
                  value={form.subscriptionType}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      subscriptionType: v as "individual" | "family",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TYPES.map((s: any) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s[labelKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Family members section */}
              {form.subscriptionType === "family" && (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {t("members.familyMembers")}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFamilyMember}
                    >
                      <Plus className="h-4 w-4 me-1" />
                      {t("common.add")}
                    </Button>
                  </div>

                  {familyMembers.map((fm, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("members.firstName")}
                        </Label>
                        <Input
                          value={fm.first_name}
                          onChange={(e) =>
                            updateFamilyMember(
                              index,
                              "first_name",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("members.relationship")}
                        </Label>
                        <Select
                          value={fm.relationship}
                          onValueChange={(v) =>
                            updateFamilyMember(index, "relationship", v ?? "")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIPS.filter(
                              (r) => r.value !== "head",
                            ).map((r: any) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r[labelKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFamilyMember(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {familyMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {t("members.addFamilyMember")}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("auth.confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("common.register")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {t("auth.hasAccount")}{" "}
              </span>
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                {t("common.login")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
