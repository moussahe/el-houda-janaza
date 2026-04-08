"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquare, Mail, MailOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function MessagesPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("contact_messages")
        .select("*, member:members(first_name, last_name, phone)")
        .order("created_at", { ascending: false });
      setMessages(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openMessage = async (msg: any) => {
    setSelectedMessage(msg);
    setReply(msg.admin_reply || "");
    if (!msg.is_read) {
      try {
        const supabase = createClient();
        await supabase
          .from("contact_messages")
          .update({ is_read: true })
          .eq("id", msg.id);
        // Update local state
        setMessages(
          messages.map((m: any) => (m.id === msg.id ? { ...m, is_read: true } : m)),
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !reply.trim()) return;
    try {
      const supabase = createClient();
      await supabase
        .from("contact_messages")
        .update({ admin_reply: reply })
        .eq("id", selectedMessage.id);
      toast.success(locale === "ar" ? "تم الرد" : "Réponse enregistrée");
      setSelectedMessage({ ...selectedMessage, admin_reply: reply });
      loadMessages();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const unreadCount = messages.filter((m: any) => !m.is_read).length;

  if (loading)
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.loading")}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("admin.messages")}</h1>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages list */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{locale === "ar" ? "لا توجد رسائل" : "Aucun message"}</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg: any) => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedMessage?.id === msg.id ? "ring-2 ring-primary" : ""} ${!msg.is_read ? "border-primary/50 bg-primary/5" : ""}`}
                onClick={() => openMessage(msg)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {msg.is_read ? (
                        <MailOpen className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      ) : (
                        <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${!msg.is_read ? "text-primary" : ""}`}
                        >
                          {msg.member?.last_name} {msg.member?.first_name}
                        </p>
                        <p className="text-sm font-semibold truncate">
                          {msg.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!msg.is_read && (
                        <Badge variant="default" className="text-xs">
                          {locale === "ar" ? "جديد" : "Nouveau"}
                        </Badge>
                      )}
                      {msg.admin_reply && (
                        <Badge variant="outline" className="text-xs">
                          {locale === "ar" ? "تم الرد" : "Répondu"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message detail */}
        <div>
          {selectedMessage ? (
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedMessage.subject}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === "ar" ? "من" : "De"}:{" "}
                      {selectedMessage.member?.last_name}{" "}
                      {selectedMessage.member?.first_name}
                      {selectedMessage.member?.phone &&
                        ` — ${selectedMessage.member.phone}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(selectedMessage.created_at)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-medium">
                    {locale === "ar" ? "الرد" : "Répondre"}
                  </Label>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder={
                      locale === "ar"
                        ? "اكتب ردك هنا..."
                        : "Écrivez votre réponse ici..."
                    }
                  />
                  <Button onClick={sendReply} className="w-full">
                    <Send className="h-4 w-4 me-2" />
                    {locale === "ar" ? "إرسال الرد" : "Envoyer la réponse"}
                  </Button>
                </div>

                {selectedMessage.admin_reply && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">
                        {locale === "ar"
                          ? "ردك السابق"
                          : "Votre réponse précédente"}
                      </p>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedMessage.admin_reply}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>
                  {locale === "ar"
                    ? "اختر رسالة للقراءة"
                    : "Sélectionnez un message pour le lire"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
