import {
  Country,
  PaymentMethod,
  Relationship,
  RepatriationStatus,
  MemberStatus,
  RefusalReason,
} from "./types";

export const COUNTRIES: {
  value: Country;
  label_fr: string;
  label_ar: string;
}[] = [
  { value: "algeria", label_fr: "Algérie", label_ar: "الجزائر" },
  { value: "morocco", label_fr: "Maroc", label_ar: "المغرب" },
  { value: "tunisia", label_fr: "Tunisie", label_ar: "تونس" },
  { value: "libya", label_fr: "Libye", label_ar: "ليبيا" },
  { value: "mauritania", label_fr: "Mauritanie", label_ar: "موريتانيا" },
  { value: "other", label_fr: "Autre", label_ar: "أخرى" },
];

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label_fr: string;
  label_ar: string;
}[] = [
  { value: "cash", label_fr: "Espèces", label_ar: "نقداً" },
  { value: "transfer", label_fr: "Virement", label_ar: "تحويل بنكي" },
  { value: "check", label_fr: "Chèque", label_ar: "شيك" },
];

export const RELATIONSHIPS: {
  value: Relationship;
  label_fr: string;
  label_ar: string;
}[] = [
  { value: "head", label_fr: "Chef de famille", label_ar: "رب الأسرة" },
  { value: "spouse", label_fr: "Conjoint(e)", label_ar: "الزوج(ة)" },
  { value: "son", label_fr: "Fils", label_ar: "ابن" },
  { value: "daughter", label_fr: "Fille", label_ar: "ابنة" },
  { value: "father", label_fr: "Père", label_ar: "أب" },
  { value: "mother", label_fr: "Mère", label_ar: "أم" },
  { value: "brother", label_fr: "Frère", label_ar: "أخ" },
  { value: "sister", label_fr: "Sœur", label_ar: "أخت" },
];

export const DECEASED_RELATIONSHIPS = [
  { value: "self", label_fr: "Lui-même", label_ar: "نفسه" },
  ...RELATIONSHIPS.filter((r) => r.value !== "head"),
];

export const REPATRIATION_STATUSES: {
  value: RepatriationStatus;
  label_fr: string;
  label_ar: string;
}[] = [
  { value: "declared", label_fr: "Déclaré", label_ar: "مُعلن" },
  { value: "in_progress", label_fr: "En cours", label_ar: "قيد التنفيذ" },
  { value: "repatriated", label_fr: "Rapatrié", label_ar: "تم الترحيل" },
  { value: "closed", label_fr: "Clôturé", label_ar: "مُغلق" },
];

export const MEMBER_STATUSES: {
  value: MemberStatus;
  label_fr: string;
  label_ar: string;
  color: string;
}[] = [
  {
    value: "pending",
    label_fr: "En attente",
    label_ar: "قيد الانتظار",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "active",
    label_fr: "Actif",
    label_ar: "نشط",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "suspended",
    label_fr: "Suspendu",
    label_ar: "معلّق",
    color: "bg-red-100 text-red-800",
  },
];

export const REFUSAL_REASONS: {
  value: RefusalReason;
  label_fr: string;
  label_ar: string;
}[] = [
  {
    value: "incomplete_info",
    label_fr: "Informations incomplètes",
    label_ar: "معلومات ناقصة",
  },
  {
    value: "payment_not_received",
    label_fr: "Paiement non reçu",
    label_ar: "لم يتم استلام الدفع",
  },
  { value: "duplicate", label_fr: "Doublon", label_ar: "مكرر" },
  { value: "other", label_fr: "Autre", label_ar: "أخرى" },
];

export const SUBSCRIPTION_TYPES = [
  { value: "individual" as const, label_fr: "Individuel", label_ar: "فردي" },
  { value: "family" as const, label_fr: "Famille", label_ar: "عائلي" },
];

export const PAYMENT_PERIODS = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const start = currentYear - 2 + i;
    return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` };
  });
})();

export const PERIOD_FILTERS = [
  { value: "this_month", label_fr: "Ce mois", label_ar: "هذا الشهر" },
  { value: "this_quarter", label_fr: "Ce trimestre", label_ar: "هذا الربع" },
  { value: "this_year", label_fr: "Cette année", label_ar: "هذه السنة" },
  { value: "custom", label_fr: "Personnalisé", label_ar: "مخصص" },
];
