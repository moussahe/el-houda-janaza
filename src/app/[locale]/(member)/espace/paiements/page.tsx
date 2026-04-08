"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Payment } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/constants";

export default function MemberPaiementsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (member) {
        const { data } = await supabase
          .from("payments")
          .select("*")
          .eq("member_id", member.id)
          .order("payment_date", { ascending: false });
        setPayments((data as Payment[]) || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR");
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
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("member.myPayments")}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t("member.noPayments")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.amount")}</TableHead>
                  <TableHead>{t("payments.method")}</TableHead>
                  <TableHead>{t("payments.period")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.payment_date)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {
                          PAYMENT_METHODS.find(
                            (m) => m.value === p.payment_method,
                          )?.[labelKey]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(p.period_start)} - {formatDate(p.period_end)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
