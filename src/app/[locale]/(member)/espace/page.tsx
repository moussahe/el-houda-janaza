"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import type { Member, Payment } from "@/lib/types";
import { SUBSCRIPTION_TYPES, PAYMENT_METHODS } from "@/lib/constants";

export default function MemberDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [familyCount, setFamilyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (memberData) {
        setMember(memberData as Member);

        const [{ data: paymentsData }, { data: familyData }] =
          await Promise.all([
            supabase
              .from("payments")
              .select("*")
              .eq("member_id", memberData.id)
              .order("payment_date", { ascending: false })
              .limit(3),
            memberData.subscription_type === "family"
              ? supabase
                  .from("families")
                  .select("id")
                  .eq("head_member_id", memberData.id)
                  .single()
                  .then(async (res: any) => {
                    if (res.data) {
                      const { count } = await supabase
                        .from("family_members")
                        .select("*", { count: "exact", head: true })
                        .eq("family_id", res.data.id);
                      return { data: count };
                    }
                    return { data: 0 };
                  })
              : Promise.resolve({ data: 0 }),
          ]);

        setPayments((paymentsData as Payment[]) || []);
        setFamilyCount((familyData as any) || 0);
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
  if (!member)
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.noResults")}
      </div>
    );

  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: "bg-green-50 border-green-200 text-green-800",
      message: t("member.activeStatus"),
    },
    pending: {
      icon: Clock,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      message: t("member.pendingStatus"),
    },
    suspended: {
      icon: XCircle,
      color: "bg-red-50 border-red-200 text-red-800",
      message: t("member.suspendedStatus"),
    },
  };

  const config =
    statusConfig[member.status as keyof typeof statusConfig] ||
    statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("member.dashboard")}</h1>

      {/* Status card */}
      <Card className={`border-2 ${config.color}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <StatusIcon className="h-10 w-10" />
            <div>
              <h2 className="text-lg font-semibold">{t("member.status")}</h2>
              <p>{config.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {member.status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              {t("auth.pendingMessage")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info cards */}
      {member.status === "active" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("members.subscriptionType")}
                  </p>
                  <p className="font-semibold">
                    {
                      SUBSCRIPTION_TYPES.find(
                        (s) => s.value === member.subscription_type,
                      )?.[labelKey]
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {member.subscription_type === "family" && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("member.coveredMembers")}
                    </p>
                    <p className="font-semibold">
                      {familyCount} {locale === "ar" ? "شخص" : "personnes"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent payments */}
      {member.status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("member.myPayments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("member.noPayments")}
              </p>
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
                        {formatDate(p.period_start)} -{" "}
                        {formatDate(p.period_end)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
