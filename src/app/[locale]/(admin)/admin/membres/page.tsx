"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import type { Member, Country } from "@/lib/types";
import {
  MEMBER_STATUSES,
  SUBSCRIPTION_TYPES,
  COUNTRIES,
} from "@/lib/constants";

export default function MembresPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Add member form
  const [newMember, setNewMember] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country_of_origin: "algeria" as Country,
    subscription_type: "individual" as "individual" | "family",
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("members")
        .select("*")
        .order("last_name", { ascending: true });
      setMembers((data as Member[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("members").insert({
        ...newMember,
        status: "active",
        role: "member",
      });
      if (!error) {
        setShowAddDialog(false);
        setNewMember({
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          country_of_origin: "algeria",
          subscription_type: "individual",
        });
        loadMembers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = members.filter((m: any) => {
    const matchSearch =
      search === "" ||
      `${m.last_name} ${m.first_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    const matchType =
      typeFilter === "all" || m.subscription_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const getStatusBadge = (status: string) => {
    const s = MEMBER_STATUSES.find((ms) => ms.value === status);
    return s ? (
      <Badge className={s.color}>{s[labelKey]}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("members.title")}</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t("members.addMember")}
        </Button>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("members.addMember")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("members.lastName")}</Label>
                  <Input
                    value={newMember.last_name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, last_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("members.firstName")}</Label>
                  <Input
                    value={newMember.first_name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, first_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("members.phone")}</Label>
                <Input
                  value={newMember.phone}
                  onChange={(e) =>
                    setNewMember({ ...newMember, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("common.address")}</Label>
                  <Input
                    value={newMember.address}
                    onChange={(e) =>
                      setNewMember({ ...newMember, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.city")}</Label>
                  <Input
                    value={newMember.city}
                    onChange={(e) =>
                      setNewMember({ ...newMember, city: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("members.countryOfOrigin")}</Label>
                <Select
                  value={newMember.country_of_origin}
                  onValueChange={(v) =>
                    setNewMember({
                      ...newMember,
                      country_of_origin: v as Country,
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
              <div className="space-y-2">
                <Label>{t("members.subscriptionType")}</Label>
                <Select
                  value={newMember.subscription_type}
                  onValueChange={(v) =>
                    setNewMember({
                      ...newMember,
                      subscription_type: (v ?? "") as any,
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
              <Button onClick={addMember} className="w-full">
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("members.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {MEMBER_STATUSES.map((s: any) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s[labelKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v ?? "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("members.formula")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {SUBSCRIPTION_TYPES.map((s: any) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s[labelKey]}
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
              {t("common.noResults")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("members.name")}</TableHead>
                  <TableHead>{t("members.phone")}</TableHead>
                  <TableHead>{t("members.formula")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.last_name} {member.first_name}
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {
                          SUBSCRIPTION_TYPES.find(
                            (s) => s.value === member.subscription_type,
                          )?.[labelKey]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/membres/${member.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 me-1" />
                          {t("common.view")}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            {filtered.length} {t("members.title").toLowerCase()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
