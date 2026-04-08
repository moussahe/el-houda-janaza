"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Users, Home, UserPlus, AlertTriangle, Wallet } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
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
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import type { Member, Payment, RepatriationCase } from "@/lib/types";
import {
  COUNTRIES,
  PAYMENT_METHODS,
  MEMBER_STATUSES,
  REPATRIATION_STATUSES,
} from "@/lib/constants";

export default function AdminDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [stats, setStats] = useState({
    totalMembers: 0,
    totalFamilies: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalBalance: 0,
  });
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [activeCases, setActiveCases] = useState<RepatriationCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const supabase = createClient();

      const [
        { count: membersCount },
        { count: familiesCount },
        { data: pending },
        { data: payments },
        { data: cases },
        { data: totalPayments },
        { data: totalCosts },
      ] = await Promise.all([
        supabase
          .from("members")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.from("families").select("*", { count: "exact", head: true }),
        supabase
          .from("members")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("payments")
          .select("*, member:members(first_name, last_name)")
          .order("payment_date", { ascending: false })
          .limit(10),
        supabase
          .from("repatriation_cases")
          .select("*, member:members(first_name, last_name)")
          .in("status", ["declared", "in_progress"]),
        supabase.from("payments").select("amount"),
        supabase
          .from("repatriation_cases")
          .select("cost_final")
          .eq("status", "closed"),
      ]);

      const totalIn =
        totalPayments?.reduce(
          (sum: number, p: any) => sum + Number(p.amount),
          0,
        ) || 0;
      const totalOut =
        totalCosts?.reduce(
          (sum: number, c: any) => sum + Number(c.cost_final || 0),
          0,
        ) || 0;

      setStats({
        totalMembers: membersCount || 0,
        totalFamilies: familiesCount || 0,
        pendingCount: pending?.length || 0,
        overdueCount: 0, // TODO: compute based on payment dates
        totalBalance: totalIn - totalOut,
      });
      setPendingMembers((pending as Member[]) || []);
      setRecentPayments((payments as any[]) || []);
      setActiveCases((cases as any[]) || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      locale === "ar" ? "ar-DZ" : "fr-FR",
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title={t("dashboard.totalMembers")}
          value={stats.totalMembers}
          icon={Users}
        />
        <StatsCard
          title={t("dashboard.totalFamilies")}
          value={stats.totalFamilies}
          icon={Home}
        />
        <StatsCard
          title={t("dashboard.pendingRegistrations")}
          value={stats.pendingCount}
          icon={UserPlus}
          alert={stats.pendingCount > 0}
        />
        <StatsCard
          title={t("dashboard.overdueMembers")}
          value={stats.overdueCount}
          icon={AlertTriangle}
          alert={stats.overdueCount > 0}
        />
        <StatsCard
          title={t("dashboard.totalBalance")}
          value={formatCurrency(stats.totalBalance)}
          icon={Wallet}
        />
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending registrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t("dashboard.pendingList")}
            </CardTitle>
            <Link href="/admin/inscriptions">
              <Button variant="outline" size="sm">
                {t("common.view")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("dashboard.noPending")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("members.name")}</TableHead>
                    <TableHead>{t("members.phone")}</TableHead>
                    <TableHead>{t("members.formula")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.last_name} {member.first_name}
                      </TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {member.subscription_type === "individual"
                            ? t("members.individual")
                            : t("members.family")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Overdue members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t("dashboard.overdueList")}
            </CardTitle>
            <Link href="/admin/membres">
              <Button variant="outline" size="sm">
                {t("common.view")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("dashboard.noOverdue")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {t("dashboard.recentPayments")}
          </CardTitle>
          <Link href="/admin/paiements">
            <Button variant="outline" size="sm">
              {t("common.view")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("dashboard.noPayments")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("payments.member")}</TableHead>
                  <TableHead>{t("common.amount")}</TableHead>
                  <TableHead>{t("payments.method")}</TableHead>
                  <TableHead>{t("payments.period")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="font-medium">
                      {payment.member?.last_name} {payment.member?.first_name}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PAYMENT_METHODS.find(
                          (m) => m.value === payment.payment_method,
                        )?.[labelKey] || payment.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.period_start)} -{" "}
                      {formatDate(payment.period_end)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Active repatriation cases */}
      {activeCases.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t("dashboard.activeCases")}
            </CardTitle>
            <Link href="/admin/rapatriements">
              <Button variant="outline" size="sm">
                {t("common.view")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("repatriation.deceasedName")}</TableHead>
                  <TableHead>{t("repatriation.destination")}</TableHead>
                  <TableHead>{t("repatriation.status")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCases.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.deceased_name}
                    </TableCell>
                    <TableCell>
                      {
                        COUNTRIES.find(
                          (co) => co.value === c.destination_country,
                        )?.[labelKey]
                      }
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {
                          REPATRIATION_STATUSES.find(
                            (s) => s.value === c.status,
                          )?.[labelKey]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(c.date_of_death)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
