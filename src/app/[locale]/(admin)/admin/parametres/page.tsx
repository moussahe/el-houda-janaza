"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Settings, Plus, Trash2, Download, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants";
import type { Country } from "@/lib/types";

export default function ParametresPage() {
  const t = useTranslations();
  const locale = useLocale();
  const labelKey = locale === "ar" ? "label_ar" : "label_fr";

  const [mosqueInfo, setMosqueInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [cities, setCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [newAgent, setNewAgent] = useState({
    name: "",
    phone: "",
    countries: ["algeria"] as Country[],
  });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = createClient();
      const [{ data: settings }, { data: agentsData }] = await Promise.all([
        supabase.from("app_settings").select("*"),
        supabase.from("repatriation_agents").select("*").eq("is_active", true),
      ]);

      if (settings) {
        const get = (key: string) =>
          settings.find((s: any) => s.key === key)?.value;
        setMosqueInfo({
          name: get("mosque_name") || "",
          phone: get("mosque_phone") || "",
          email: get("mosque_email") || "",
        });
        setCities(get("cities") || []);
      }
      setAgents(agentsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveMosqueInfo = async () => {
    try {
      const supabase = createClient();
      await Promise.all([
        supabase
          .from("app_settings")
          .upsert({ key: "mosque_name", value: mosqueInfo.name }),
        supabase
          .from("app_settings")
          .upsert({ key: "mosque_phone", value: mosqueInfo.phone }),
        supabase
          .from("app_settings")
          .upsert({ key: "mosque_email", value: mosqueInfo.email }),
      ]);
      toast.success(locale === "ar" ? "تم الحفظ" : "Enregistré");
    } catch (error) {
      console.error(error);
    }
  };

  const addCity = async () => {
    if (!newCity.trim()) return;
    const updated = [...cities, newCity.trim()];
    try {
      const supabase = createClient();
      await supabase
        .from("app_settings")
        .upsert({ key: "cities", value: updated });
      setCities(updated);
      setNewCity("");
    } catch (error) {
      console.error(error);
    }
  };

  const removeCity = async (index: number) => {
    const updated = cities.filter((_, i) => i !== index);
    try {
      const supabase = createClient();
      await supabase
        .from("app_settings")
        .upsert({ key: "cities", value: updated });
      setCities(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const addAgent = async () => {
    if (!newAgent.name || !newAgent.phone) return;
    try {
      const supabase = createClient();
      await supabase.from("repatriation_agents").insert({
        name: newAgent.name,
        phone: newAgent.phone,
        countries: newAgent.countries,
      });
      setNewAgent({ name: "", phone: "", countries: ["algeria"] });
      loadSettings();
    } catch (error) {
      console.error(error);
    }
  };

  const removeAgent = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from("repatriation_agents")
        .update({ is_active: false })
        .eq("id", id);
      loadSettings();
    } catch (error) {
      console.error(error);
    }
  };

  const changePassword = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });
      if (error) throw error;
      toast.success(
        locale === "ar" ? "تم تغيير كلمة المرور" : "Mot de passe modifié",
      );
      setPasswords({ current: "", new: "" });
    } catch (error) {
      console.error(error);
      toast.error(locale === "ar" ? "خطأ" : "Erreur");
    }
  };

  const exportMembers = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("members")
        .select("*")
        .order("last_name");
      if (!data) return;
      const headers = [
        "Nom",
        "Prénom",
        "Téléphone",
        "Email",
        "Adresse",
        "Ville",
        "Pays",
        "Formule",
        "Statut",
      ];
      const rows = data.map((m: any) => [
        m.last_name,
        m.first_name,
        m.phone,
        m.email || "",
        m.address,
        m.city,
        m.country_of_origin,
        m.subscription_type,
        m.status,
      ]);
      const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `membres_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (error) {
      console.error(error);
    }
  };

  const exportPayments = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("payments")
        .select("*, member:members(first_name, last_name)")
        .order("payment_date", { ascending: false });
      if (!data) return;
      const headers = [
        "Date",
        "Membre",
        "Montant",
        "Méthode",
        "Période début",
        "Période fin",
        "Notes",
      ];
      const rows = data.map((p: any) => [
        p.payment_date,
        `${(p as any).member?.last_name} ${(p as any).member?.first_name}`,
        p.amount,
        p.payment_method,
        p.period_start,
        p.period_end,
        p.notes || "",
      ]);
      const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paiements_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.loading")}
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
      </div>

      {/* Mosque info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.mosqueInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("settings.mosqueName")}</Label>
            <Input
              value={mosqueInfo.name}
              onChange={(e) =>
                setMosqueInfo({ ...mosqueInfo, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("settings.mosquePhone")}</Label>
              <Input
                value={mosqueInfo.phone}
                onChange={(e) =>
                  setMosqueInfo({ ...mosqueInfo, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.mosqueEmail")}</Label>
              <Input
                value={mosqueInfo.email}
                onChange={(e) =>
                  setMosqueInfo({ ...mosqueInfo, email: e.target.value })
                }
              />
            </div>
          </div>
          <Button onClick={saveMosqueInfo}>
            <Save className="h-4 w-4 me-2" />
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>

      {/* Cities */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.cities")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {cities.map((city, i) => (
              <Badge key={i} variant="secondary" className="gap-1 py-1.5">
                {city}
                <button
                  onClick={() => removeCity(i)}
                  className="ms-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder={t("settings.addCity")}
              onKeyDown={(e) => e.key === "Enter" && addCity()}
            />
            <Button onClick={addCity} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.agents")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.map((agent: any) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-sm text-muted-foreground">{agent.phone}</p>
                <div className="flex gap-1 mt-1">
                  {agent.countries?.map((c: Country) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {COUNTRIES.find((co) => co.value === c)?.[labelKey]}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAgent(agent.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("settings.addAgent")}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("settings.agentName")}</Label>
                <Input
                  value={newAgent.name}
                  onChange={(e) =>
                    setNewAgent({ ...newAgent, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.agentPhone")}</Label>
                <Input
                  value={newAgent.phone}
                  onChange={(e) =>
                    setNewAgent({ ...newAgent, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <Button onClick={addAgent} variant="outline" className="w-full">
              <Plus className="h-4 w-4 me-2" />
              {t("settings.addAgent")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("settings.newPassword")}</Label>
            <Input
              type="password"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
            />
          </div>
          <Button onClick={changePassword}>{t("common.save")}</Button>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.exportData")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={exportMembers}
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 me-2" />
            {t("settings.exportMembers")}
          </Button>
          <Button
            variant="outline"
            onClick={exportPayments}
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 me-2" />
            {t("settings.exportPayments")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
