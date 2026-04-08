"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check, X, UserPlus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import type { Member, FamilyMember, PaymentMethod } from "@/lib/types";
import {
  SUBSCRIPTION_TYPES,
  PAYMENT_METHODS,
  REFUSAL_REASONS,
  RELATIONSHIPS,
} from "@/lib/constants";

export default function InscriptionsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [pendingMembers, setPendingMembers] = useState<
    (Member & { family_members?: FamilyMember[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");
  const [refusalOther, setRefusalOther] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash" as PaymentMethod,
    period_start: "",
    period_end: "",
  });

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const supabase = createClient();
      const { data: members } = await supabase
        .from("members")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (members) {
        // Load family members for each pending member with family subscription
        const enriched = await Promise.all(
          members.map(async (m: any) => {
            if (m.subscription_type === "family") {
              const { data: family } = await supabase
                .from("families")
                .select("id")
                .eq("head_member_id", m.id)
                .single();
              if (family) {
                const { data: fm } = await supabase
                  .from("family_members")
                  .select("*")
                  .eq("family_id", family.id);
                return { ...m, family_members: fm || [] };
              }
            }
            return { ...m, family_members: [] };
          }),
        );
        setPendingMembers(enriched);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateMember = async () => {
    if (!selectedMember) return;
    try {
      const supabase = createClient();

      // Update status to active
      await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", selectedMember.id);

      // Record payment
      if (paymentForm.amount) {
        await supabase.from("payments").insert({
          member_id: selectedMember.id,
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          period_start: paymentForm.period_start,
          period_end: paymentForm.period_end,
        });
      }

      setShowValidateDialog(false);
      setSelectedMember(null);
      setPaymentForm({
        amount: "",
        payment_method: "cash",
        period_start: "",
        period_end: "",
      });
      loadPending();
    } catch (error) {
      console.error(error);
    }
  };

  const refuseMember = async () => {
    if (!selectedMember) return;
    try {
      const supabase = createClient();
      const reason =
        refusalReason === "other"
          ? refusalOther
          : REFUSAL_REASONS.find((r: any) => r.value === refusalReason)?.[labelKey];
      await supabase
        .from("members")
        .update({
          status: "suspended",
          notes: `Refusé: ${reason}`,
        })
        .eq("id", selectedMember.id);

      setShowRefuseDialog(false);
      setSelectedMember(null);
      setRefusalReason("");
      setRefusalOther("");
      loadPending();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR");

  if (loading)
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.loading")}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("registrations.title")}</h1>
        {pendingMembers.length > 0 && (
          <Badge variant="destructive">{pendingMembers.length}</Badge>
        )}
      </div>

      {pendingMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("registrations.noRegistrations")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {member.last_name} {member.first_name}
                      </h3>
                      <Badge variant="outline">
                        {
                          SUBSCRIPTION_TYPES.find(
                            (s) => s.value === member.subscription_type,
                          )?.[labelKey]
                        }
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          {t("common.phone")}:{" "}
                        </span>
                        <span className="font-medium">{member.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("common.email")}:{" "}
                        </span>
                        <span className="font-medium">
                          {member.email || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("common.city")}:{" "}
                        </span>
                        <span className="font-medium">
                          {member.city || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("registrations.registrationDate")}:{" "}
                        </span>
                        <span className="font-medium">
                          {formatDate(member.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Family members */}
                    {member.family_members &&
                      member.family_members.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {t("registrations.declaredMembers")}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {member.family_members.map((fm: FamilyMember) => (
                              <Badge key={fm.id} variant="secondary">
                                {fm.first_name} {fm.last_name} (
                                {
                                  RELATIONSHIPS.find(
                                    (r) => r.value === fm.relationship,
                                  )?.[labelKey]
                                }
                                )
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowValidateDialog(true);
                      }}
                    >
                      <Check className="h-4 w-4 me-1" />
                      {t("registrations.validate")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedMember(member);
                        setShowRefuseDialog(true);
                      }}
                    >
                      <X className="h-4 w-4 me-1" />
                      {t("registrations.refuse")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Validate dialog */}
      <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("registrations.validateAndPay")}</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedMember.last_name} {selectedMember.first_name} —{" "}
                {
                  SUBSCRIPTION_TYPES.find(
                    (s) => s.value === selectedMember.subscription_type,
                  )?.[labelKey]
                }
              </p>
              <Separator />
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
              <Button onClick={validateMember} className="w-full">
                {t("registrations.validateAndPay")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refuse dialog */}
      <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("registrations.refuse")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("registrations.refusalReason")}</Label>
              <Select
                value={refusalReason}
                onValueChange={(v) => setRefusalReason(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFUSAL_REASONS.map((r: any) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r[labelKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {refusalReason === "other" && (
              <div className="space-y-2">
                <Label>{t("registrations.refusalOtherReason")}</Label>
                <Input
                  value={refusalOther}
                  onChange={(e) => setRefusalOther(e.target.value)}
                />
              </div>
            )}
            <Button
              variant="destructive"
              onClick={refuseMember}
              className="w-full"
            >
              {t("registrations.refuse")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
