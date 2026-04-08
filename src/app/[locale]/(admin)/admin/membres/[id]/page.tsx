"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  UserX,
  UserCheck,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import type {
  Member,
  Payment,
  FamilyMember,
  Family,
  PaymentMethod,
  Relationship,
} from "@/lib/types";
import {
  COUNTRIES,
  PAYMENT_METHODS,
  RELATIONSHIPS,
  SUBSCRIPTION_TYPES,
  MEMBER_STATUSES,
} from "@/lib/constants";

export default function MemberDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Member>>({});

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash" as PaymentMethod,
    period_start: "",
    period_end: "",
    notes: "",
  });

  const [newFamilyMember, setNewFamilyMember] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    relationship: "spouse" as Relationship,
  });

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    try {
      const supabase = createClient();

      const [{ data: memberData }, { data: paymentsData }] = await Promise.all([
        supabase.from("members").select("*").eq("id", memberId).single(),
        supabase
          .from("payments")
          .select("*")
          .eq("member_id", memberId)
          .order("payment_date", { ascending: false }),
      ]);

      if (memberData) {
        setMember(memberData as Member);
        setEditForm(memberData);

        // Load family if family subscription
        if (memberData.subscription_type === "family") {
          const { data: familyData } = await supabase
            .from("families")
            .select("*, members:family_members(*)")
            .eq("head_member_id", memberId)
            .single();

          if (familyData) {
            setFamily(familyData as any);
            setFamilyMembers((familyData as any).members || []);
          }
        }
      }
      setPayments((paymentsData as Payment[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    try {
      const supabase = createClient();
      await supabase.from("members").update(editForm).eq("id", memberId);
      setEditing(false);
      loadMember();
    } catch (error) {
      console.error(error);
    }
  };

  const recordPayment = async () => {
    try {
      const supabase = createClient();
      await supabase.from("payments").insert({
        member_id: memberId,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        period_start: paymentForm.period_start,
        period_end: paymentForm.period_end,
        notes: paymentForm.notes || null,
      });
      setShowPaymentDialog(false);
      setPaymentForm({
        amount: "",
        payment_method: "cash",
        period_start: "",
        period_end: "",
        notes: "",
      });
      loadMember();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleStatus = async () => {
    if (!member) return;
    const newStatus = member.status === "active" ? "suspended" : "active";
    try {
      const supabase = createClient();
      await supabase
        .from("members")
        .update({ status: newStatus })
        .eq("id", memberId);
      loadMember();
    } catch (error) {
      console.error(error);
    }
  };

  const addFamilyMemberFn = async () => {
    if (!family) return;
    try {
      const supabase = createClient();
      await supabase.from("family_members").insert({
        family_id: family.id,
        first_name: newFamilyMember.first_name,
        last_name: newFamilyMember.last_name,
        date_of_birth: newFamilyMember.date_of_birth || null,
        relationship: newFamilyMember.relationship,
      });
      setShowFamilyDialog(false);
      setNewFamilyMember({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        relationship: "spouse",
      });
      loadMember();
    } catch (error) {
      console.error(error);
    }
  };

  const removeFamilyMemberFn = async (fmId: string) => {
    try {
      const supabase = createClient();
      await supabase.from("family_members").delete().eq("id", fmId);
      loadMember();
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

  const statusInfo = MEMBER_STATUSES.find(
    (s: any) => s.value === member.status,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/membres">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {member.last_name} {member.first_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {statusInfo && (
                <Badge className={statusInfo.color}>
                  {statusInfo[labelKey]}
                </Badge>
              )}
              <Badge variant="outline">
                {
                  SUBSCRIPTION_TYPES.find(
                    (s) => s.value === member.subscription_type,
                  )?.[labelKey]
                }
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPaymentDialog(true)}>
            <CreditCard className="h-4 w-4 me-2" />
            {t("members.recordPayment")}
          </Button>
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("members.recordPayment")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("common.amount")} (€)</Label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("payments.paymentMethod")}</Label>
                  <Select
                    value={paymentForm.payment_method}
                    onValueChange={(v) =>
                      setPaymentForm({
                        ...paymentForm,
                        payment_method: v as PaymentMethod,
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("payments.periodStart")}</Label>
                    <Input
                      type="date"
                      value={paymentForm.period_start}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          period_start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("payments.periodEnd")}</Label>
                    <Input
                      type="date"
                      value={paymentForm.period_end}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          period_end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.notes")}</Label>
                  <Textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                  />
                </div>
                <Button onClick={recordPayment} className="w-full">
                  {t("common.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant={member.status === "active" ? "destructive" : "default"}
            onClick={toggleStatus}
          >
            {member.status === "active" ? (
              <>
                <UserX className="h-4 w-4 me-2" />
                {t("members.suspend")}
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 me-2" />
                {t("members.reactivate")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Personal info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("members.personalInfo")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="h-4 w-4 me-1" />
            {t("members.editInfo")}
          </Button>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("members.lastName")}</Label>
                  <Input
                    value={editForm.last_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("members.firstName")}</Label>
                  <Input
                    value={editForm.first_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("common.phone")}</Label>
                  <Input
                    value={editForm.phone || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.email")}</Label>
                  <Input
                    value={editForm.email || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("common.address")}</Label>
                  <Input
                    value={editForm.address || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.city")}</Label>
                  <Input
                    value={editForm.city || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, city: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("members.countryOfOrigin")}</Label>
                <Select
                  value={editForm.country_of_origin}
                  onValueChange={(v) =>
                    setEditForm({
                      ...editForm,
                      country_of_origin: (v ?? "") as any,
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
              <div className="flex gap-2">
                <Button onClick={saveEdit}>{t("common.save")}</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setEditForm(member);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("members.lastName")}
                </p>
                <p className="font-medium">{member.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("members.firstName")}
                </p>
                <p className="font-medium">{member.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.phone")}
                </p>
                <p className="font-medium">{member.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.email")}
                </p>
                <p className="font-medium">{member.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.address")}
                </p>
                <p className="font-medium">{member.address || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.city")}
                </p>
                <p className="font-medium">{member.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("members.countryOfOrigin")}
                </p>
                <p className="font-medium">
                  {
                    COUNTRIES.find(
                      (c) => c.value === member.country_of_origin,
                    )?.[labelKey]
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("members.subscriptionType")}
                </p>
                <p className="font-medium">
                  {
                    SUBSCRIPTION_TYPES.find(
                      (s) => s.value === member.subscription_type,
                    )?.[labelKey]
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family members */}
      {member.subscription_type === "family" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("members.familyMembers")}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFamilyDialog(true)}
            >
              <Plus className="h-4 w-4 me-1" />
              {t("members.addFamilyMember")}
            </Button>
            <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("members.addFamilyMember")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("members.firstName")}</Label>
                      <Input
                        value={newFamilyMember.first_name}
                        onChange={(e) =>
                          setNewFamilyMember({
                            ...newFamilyMember,
                            first_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("members.lastName")}</Label>
                      <Input
                        value={newFamilyMember.last_name}
                        onChange={(e) =>
                          setNewFamilyMember({
                            ...newFamilyMember,
                            last_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("members.relationship")}</Label>
                    <Select
                      value={newFamilyMember.relationship}
                      onValueChange={(v) =>
                        setNewFamilyMember({
                          ...newFamilyMember,
                          relationship: v as Relationship,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.filter(
                          (r: any) => r.value !== "head",
                        ).map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r[labelKey]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("members.dateOfBirth")}</Label>
                    <Input
                      type="date"
                      value={newFamilyMember.date_of_birth}
                      onChange={(e) =>
                        setNewFamilyMember({
                          ...newFamilyMember,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button onClick={addFamilyMemberFn} className="w-full">
                    {t("common.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {familyMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("member.noCoveredMembers")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("members.name")}</TableHead>
                    <TableHead>{t("members.relationship")}</TableHead>
                    <TableHead>{t("members.dateOfBirth")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyMembers.map((fm: any) => (
                    <TableRow key={fm.id}>
                      <TableCell className="font-medium">
                        {fm.last_name} {fm.first_name}
                      </TableCell>
                      <TableCell>
                        {
                          RELATIONSHIPS.find(
                            (r) => r.value === fm.relationship,
                          )?.[labelKey]
                        }
                      </TableCell>
                      <TableCell>
                        {fm.date_of_birth ? formatDate(fm.date_of_birth) : "-"}
                      </TableCell>
                      <TableCell>
                        {fm.relationship !== "head" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeFamilyMemberFn(fm.id)}
                          >
                            <Trash2 className="h-4 w-4 me-1" />
                            {t("members.removeFamilyMember")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>{t("members.paymentHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("payments.noPayments")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.amount")}</TableHead>
                  <TableHead>{t("payments.method")}</TableHead>
                  <TableHead>{t("payments.period")}</TableHead>
                  <TableHead>{t("common.notes")}</TableHead>
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
                    <TableCell>
                      {formatDate(p.period_start)} - {formatDate(p.period_end)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.notes || "-"}
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
