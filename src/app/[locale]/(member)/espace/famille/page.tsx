"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Users } from "lucide-react";
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
import type { FamilyMember } from "@/lib/types";
import { RELATIONSHIPS } from "@/lib/constants";

export default function FamillePage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFamily, setIsFamily] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from("members")
        .select("id, subscription_type")
        .eq("user_id", user.id)
        .single();

      if (member) {
        setIsFamily(member.subscription_type === "family");

        if (member.subscription_type === "family") {
          const { data: family } = await supabase
            .from("families")
            .select("id")
            .eq("head_member_id", member.id)
            .single();

          if (family) {
            const { data: fmData } = await supabase
              .from("family_members")
              .select("*")
              .eq("family_id", family.id)
              .order("relationship");
            setFamilyMembers((fmData as FamilyMember[]) || []);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("member.myFamily")}</h1>
      </div>

      {!isFamily ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("member.noCoveredMembers")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("member.coveredMembers")}</CardTitle>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyMembers.map((fm: any) => (
                    <TableRow key={fm.id}>
                      <TableCell className="font-medium">
                        {fm.last_name} {fm.first_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {
                            RELATIONSHIPS.find(
                              (r) => r.value === fm.relationship,
                            )?.[labelKey]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fm.date_of_birth ? formatDate(fm.date_of_birth) : "-"}
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
