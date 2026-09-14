export const PLANS = {
  personal: {
    name: 'Personal',
    amount: 4900,
    days: 30,
    templates: 5,
    description: 'For your own applications',
  },
  shop: {
    name: 'Shop',
    amount: 19900,
    days: 30,
    templates: 50,
    description: 'For print shops and cyber cafés',
  },
} as const;
export type PlanId = keyof typeof PLANS;
export function isPlan(value: unknown): value is PlanId {
  return value === 'personal' || value === 'shop';
}
export type Account = {
  signedIn: boolean;
  plan: PlanId | null;
  expiresAt: number | null;
  billingReady: boolean;
  testMode: boolean;
  storageReady: boolean;
  templatesUsed: number;
  templateLimit: number | null;
  orders: {
    id: string;
    plan: PlanId;
    amount: number;
    createdAt: number;
    refunded: boolean;
    active: boolean;
  }[];
};
