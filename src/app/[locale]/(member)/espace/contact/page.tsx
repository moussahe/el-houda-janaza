"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (member) {
        await supabase.from("contact_messages").insert({
          member_id: member.id,
          subject,
          message,
        });
        setSuccess(true);
        setSubject("");
        setMessage("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("member.contact")}</h1>
      </div>

      {success ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">
              {t("member.contactSuccess")}
            </h2>
            <Button onClick={() => setSuccess(false)} variant="outline">
              {locale === "ar"
                ? "إرسال رسالة أخرى"
                : "Envoyer un autre message"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("member.contact")}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "أرسل رسالة إلى إدارة مسجد الهدى"
                : "Envoyez un message à l'administration"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">{t("member.contactSubject")}</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("member.contactMessage")}</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <Send className="h-4 w-4 me-2" />
                {loading ? t("common.loading") : t("member.contactSend")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
