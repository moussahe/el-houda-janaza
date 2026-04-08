"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plane, Plus } from "lucide-react";
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
import type { Member, Country, RepatriationStatus } from "@/lib/types";
import {
  COUNTRIES,
  DECEASED_RELATIONSHIPS,
  REPATRIATION_STATUSES,
} from "@/lib/constants";

export default function RapatriementsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [cases, setCases] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const [form, setForm] = useState({
    member_id: "",
    deceased_name: "",
    deceased_relationship: "self",
    date_of_death: "",
    destination_country: "algeria" as Country,
    agent_id: "",
    cost_estimate: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const [{ data: casesData }, { data: membersData }, { data: agentsData }] =
        await Promise.all([
          supabase
            .from("repatriation_cases")
            .select(
              "*, member:members(first_name, last_name), agent:repatriation_agents(name, phone)",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("members")
            .select("id, first_name, last_name")
            .eq("status", "active")
            .order("last_name"),
          supabase
            .from("repatriation_agents")
            .select("*")
            .eq("is_active", true),
        ]);
      setCases(casesData || []);
      setMembers((membersData as Member[]) || []);
      setAgents(agentsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createCase = async () => {
    try {
      const supabase = createClient();
      await supabase.from("repatriation_cases").insert({
        member_id: form.member_id,
        deceased_name: form.deceased_name,
        deceased_relationship: form.deceased_relationship,
        date_of_death: form.date_of_death,
        destination_country: form.destination_country,
        agent_id: form.agent_id || null,
        cost_estimate: form.cost_estimate
          ? parseFloat(form.cost_estimate)
          : null,
        notes: form.notes || null,
      });
      setShowDialog(false);
      setForm({
        member_id: "",
        deceased_name: "",
        deceased_relationship: "self",
        date_of_death: "",
        destination_country: "algeria",
        agent_id: "",
        cost_estimate: "",
        notes: "",
      });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (caseId: string, status: RepatriationStatus) => {
    try {
      const supabase = createClient();
      await supabase
        .from("repatriation_cases")
        .update({ status })
        .eq("id", caseId);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR");
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "declared":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "repatriated":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("repatriation.title")}</h1>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t("repatriation.newCase")}
        </Button>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("repatriation.newCase")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("repatriation.member")}</Label>
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
                  <Label>{t("repatriation.deceasedName")}</Label>
                  <Input
                    value={form.deceased_name}
                    onChange={(e) =>
                      setForm({ ...form, deceased_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("repatriation.deceasedRelationship")}</Label>
                  <Select
                    value={form.deceased_relationship}
                    onValueChange={(v) =>
                      setForm({ ...form, deceased_relationship: v ?? "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECEASED_RELATIONSHIPS.map((r: any) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r[labelKey]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("repatriation.dateOfDeath")}</Label>
                  <Input
                    type="date"
                    value={form.date_of_death}
                    onChange={(e) =>
                      setForm({ ...form, date_of_death: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("repatriation.destination")}</Label>
                  <Select
                    value={form.destination_country}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        destination_country: (v ?? "") as Country,
                      })
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
              </div>
              <div className="space-y-2">
                <Label>{t("repatriation.agent")}</Label>
                <Select
                  value={form.agent_id}
                  onValueChange={(v) => setForm({ ...form, agent_id: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("repatriation.agent")} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} — {a.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("repatriation.costEstimate")} (€)</Label>
                <Input
                  type="number"
                  value={form.cost_estimate}
                  onChange={(e) =>
                    setForm({ ...form, cost_estimate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button onClick={createCase} className="w-full">
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t("repatriation.noCases")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("repatriation.deceasedName")}</TableHead>
                  <TableHead>{t("repatriation.member")}</TableHead>
                  <TableHead>{t("repatriation.destination")}</TableHead>
                  <TableHead>{t("repatriation.agent")}</TableHead>
                  <TableHead>{t("repatriation.costEstimate")}</TableHead>
                  <TableHead>{t("repatriation.status")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.deceased_name}
                    </TableCell>
                    <TableCell>
                      {c.member?.last_name} {c.member?.first_name}
                    </TableCell>
                    <TableCell>
                      {
                        COUNTRIES.find(
                          (co) => co.value === c.destination_country,
                        )?.[labelKey]
                      }
                    </TableCell>
                    <TableCell>{c.agent?.name || "-"}</TableCell>
                    <TableCell>
                      {c.cost_estimate ? formatCurrency(c.cost_estimate) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(c.status)}>
                        {
                          REPATRIATION_STATUSES.find(
                            (s) => s.value === c.status,
                          )?.[labelKey]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.status}
                        onValueChange={(v) =>
                          updateStatus(c.id, v as RepatriationStatus)
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REPATRIATION_STATUSES.map((s: any) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s[labelKey]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
