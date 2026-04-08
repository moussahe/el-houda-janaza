"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Home, Eye } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import { RELATIONSHIPS, MEMBER_STATUSES } from "@/lib/constants";

export default function FamillesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("families")
        .select(
          "*, head_member:members!families_head_member_id_fkey(id, first_name, last_name, phone, status), members:family_members(*)",
        )
        .order("name");
      setFamilies(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.loading")}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("families.title")}</h1>
        <Badge variant="secondary">{families.length}</Badge>
      </div>

      {families.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("common.noResults")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {families.map((family) => (
            <Card key={family.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{family.name}</h3>
                      <Badge variant="outline">
                        {family.members?.length || 0}{" "}
                        {t("families.coveredMembers").toLowerCase()}
                      </Badge>
                      {family.head_member && (
                        <Badge
                          className={
                            MEMBER_STATUSES.find(
                              (s) => s.value === family.head_member.status,
                            )?.color || ""
                          }
                        >
                          {
                            MEMBER_STATUSES.find(
                              (s) => s.value === family.head_member.status,
                            )?.[labelKey]
                          }
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("families.headOfFamily")}:{" "}
                      <span className="font-medium text-foreground">
                        {family.head_member?.last_name}{" "}
                        {family.head_member?.first_name}
                      </span>
                      {family.head_member?.phone && (
                        <span> — {family.head_member.phone}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {family.members?.map((fm: any) => (
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
                  {family.head_member && (
                    <Link href={`/admin/membres/${family.head_member.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 me-1" />
                        {t("common.view")}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
