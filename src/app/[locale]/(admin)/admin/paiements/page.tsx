"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CreditCard, Plus, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Member, PaymentMethod } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/constants";

export default function PaiementsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchMember, setSearchMember] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const [form, setForm] = useState({
    member_id: "",
    amount: "",
    payment_method: "cash" as PaymentMethod,
    payment_date: new Date().toISOString().split("T")[0],
    period_start: "",
    period_end: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const [{ data: paymentsData }, { data: membersData }] = await Promise.all(
        [
          supabase
            .from("payments")
            .select("*, member:members(first_name, last_name)")
            .order("payment_date", { ascending: false }),
          supabase
            .from("members")
            .select("id, first_name, last_name, phone")
            .eq("status", "active")
            .order("last_name"),
        ],
      );
      setPayments(paymentsData || []);
      setMembers((membersData as Member[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    try {
      const supabase = createClient();
      await supabase.from("payments").insert({
        member_id: form.member_id,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        period_start: form.period_start,
        period_end: form.period_end,
        notes: form.notes || null,
      });
      setShowDialog(false);
      setForm({
        member_id: "",
        amount: "",
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        period_start: "",
        period_end: "",
        notes: "",
      });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Membre",
      "Montant",
      "Méthode",
      "Période début",
      "Période fin",
      "Notes",
    ];
    const rows = payments.map((p: any) => [
      p.payment_date,
      `${p.member?.last_name} ${p.member?.first_name}`,
      p.amount,
      p.payment_method,
      p.period_start,
      p.period_end,
      p.notes || "",
    ]);
    const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filtered = payments.filter((p: any) => {
    const matchMethod =
      methodFilter === "all" || p.payment_method === methodFilter;
    const matchSearch =
      searchMember === "" ||
      `${p.member?.last_name} ${p.member?.first_name}`
        .toLowerCase()
        .includes(searchMember.toLowerCase());
    return matchMethod && matchSearch;
  });

  const totalFiltered = filtered.reduce(
    (sum: any, p: any) => sum + Number(p.amount),
    0,
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR");
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const filteredMembers = members.filter(
    (m) =>
      `${m.last_name} ${m.first_name}`
        .toLowerCase()
        .includes(searchMember.toLowerCase()) ||
      m.phone?.includes(searchMember),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("payments.title")}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 me-2" />
            {t("common.export")}
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t("payments.recordPayment")}
          </Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("payments.recordPayment")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("payments.selectMember")}</Label>
                  <Select
                    value={form.member_id}
                    onValueChange={(v) =>
                      setForm({ ...form, member_id: v ?? "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("payments.selectMember")} />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.last_name} {m.first_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("common.amount")} (€)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("payments.paymentMethod")}</Label>
                    <Select
                      value={form.payment_method}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          payment_method: (v ?? "") as PaymentMethod,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m: any) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m[labelKey]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.date")}</Label>
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) =>
                      setForm({ ...form, payment_date: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("payments.periodStart")}</Label>
                    <Input
                      type="date"
                      value={form.period_start}
                      onChange={(e) =>
                        setForm({ ...form, period_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("payments.periodEnd")}</Label>
                    <Input
                      type="date"
                      value={form.period_end}
                      onChange={(e) =>
                        setForm({ ...form, period_end: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.notes")}</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
                <Button onClick={recordPayment} className="w-full">
                  {t("common.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("members.searchPlaceholder")}
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select
              value={methodFilter}
              onValueChange={(v) => setMethodFilter(v ?? "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("payments.paymentMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {PAYMENT_METHODS.map((m: any) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m[labelKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("payments.noPayments")}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("payments.member")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
                    <TableHead>{t("payments.method")}</TableHead>
                    <TableHead>{t("payments.period")}</TableHead>
                    <TableHead>{t("common.notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="font-medium">
                        {p.member?.last_name} {p.member?.first_name}
                      </TableCell>
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
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {p.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {filtered.length} {t("payments.title").toLowerCase()}
                </span>
                <span className="font-semibold">
                  {t("payments.totalCollected")}:{" "}
                  {formatCurrency(totalFiltered)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
