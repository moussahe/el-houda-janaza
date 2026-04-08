export type UserRole = "admin" | "member";

export type MemberStatus = "pending" | "active" | "suspended";

export type SubscriptionType = "individual" | "family";

export type PaymentMethod = "cash" | "transfer" | "check";

export type RepatriationStatus =
  | "declared"
  | "in_progress"
  | "repatriated"
  | "closed";

export type Country =
  | "algeria"
  | "morocco"
  | "tunisia"
  | "libya"
  | "mauritania"
  | "other";

export type Relationship =
  | "head"
  | "spouse"
  | "son"
  | "daughter"
  | "father"
  | "mother"
  | "brother"
  | "sister";

export type RefusalReason =
  | "incomplete_info"
  | "payment_not_received"
  | "duplicate"
  | "other";

export interface Member {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  date_of_birth: string | null;
  nationality: string;
  country_of_origin: Country;
  subscription_type: SubscriptionType;
  status: MemberStatus;
  role: UserRole;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  head_member_id: string;
  name: string;
  created_at: string;
  head_member?: Member;
  members?: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  family_id: string;
  member_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  relationship: Relationship;
  created_at: string;
  member?: Member;
}

export interface PricingPlan {
  id: string;
  name_fr: string;
  name_ar: string;
  type: SubscriptionType;
  amount: number;
  period: "monthly" | "annual";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  period_start: string;
  period_end: string;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  member?: Member;
}

export interface RepatriationCase {
  id: string;
  member_id: string;
  deceased_name: string;
  deceased_relationship: Relationship | "self";
  date_of_death: string;
  destination_country: Country;
  agent_id: string | null;
  cost_estimate: number | null;
  cost_final: number | null;
  status: RepatriationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  member?: Member;
  agent?: RepatriationAgent;
}

export interface RepatriationAgent {
  id: string;
  name: string;
  phone: string;
  countries: Country[];
  is_active: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  member_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  admin_reply: string | null;
  created_at: string;
  member?: Member;
}

export interface DashboardStats {
  total_members: number;
  total_families: number;
  pending_registrations: number;
  overdue_members: number;
  total_balance: number;
  recent_payments: Payment[];
  pending_members: Member[];
  overdue_list: Member[];
  active_cases: RepatriationCase[];
}
