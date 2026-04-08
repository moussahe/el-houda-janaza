"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Tag, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { PricingPlan } from "@/lib/types";

export default function TarifsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<
    Record<string, { amount: string; period: string }>
  >({});

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("type");
      setPlans((data as PricingPlan[]) || []);
      const editState: Record<string, { amount: string; period: string }> = {};
      data?.forEach((p: any) => {
        editState[p.id] = { amount: String(p.amount), period: p.period };
      });
      setEditing(editState);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId: string) => {
    try {
      const supabase = createClient();
      const edit = editing[planId];
      await supabase
        .from("pricing_plans")
        .update({
          amount: parseFloat(edit.amount),
          period: edit.period,
        })
        .eq("id", planId);
      toast.success(
        locale === "ar" ? "تم التحديث بنجاح" : "Tarif mis à jour avec succès",
      );
      loadPlans();
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  if (loading)
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.loading")}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("pricing.title")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>
                {plan.type === "individual"
                  ? t("pricing.individualPlan")
                  : t("pricing.familyPlan")}
              </CardTitle>
              <CardDescription>
                {locale === "ar" ? plan.name_ar : plan.name_fr}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(plan.amount)}
                <span className="text-base font-normal text-muted-foreground">
                  /{" "}
                  {plan.period === "annual"
                    ? t("pricing.annual")
                    : t("pricing.monthly")}
                </span>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>{t("pricing.amount")} (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editing[plan.id]?.amount || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [plan.id]: {
                          ...editing[plan.id],
                          amount: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("pricing.period")}</Label>
                  <Select
                    value={editing[plan.id]?.period || "annual"}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        [plan.id]: { ...editing[plan.id], period: v ?? "" },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">
                        {t("pricing.monthly")}
                      </SelectItem>
                      <SelectItem value="annual">
                        {t("pricing.annual")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => updatePlan(plan.id)} className="w-full">
                  <Save className="h-4 w-4 me-2" />
                  {t("pricing.updatePricing")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{t("pricing.priceNote")}</p>
    </div>
  );
}
