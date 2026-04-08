import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${geist.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position={locale === "ar" ? "top-left" : "top-right"} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
