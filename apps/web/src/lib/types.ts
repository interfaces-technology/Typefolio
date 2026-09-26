export const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2"] as const;

export type FontExtension = (typeof FONT_EXTENSIONS)[number];

export interface VariableAxis {
  tag: string;
  name?: string;
  min: number;
  defaultValue: number;
  max: number;
}

export interface FontMetadata {
  familyName: string;
  styleName?: string;
  weight?: number;
  italic?: boolean;
  postscriptName?: string;
  variableAxes?: VariableAxis[];
}

export interface FontFile extends FontMetadata {
  id: string;
  originalName: string;
  storedName: string;
  sha256: string;
  size: number;
  extension: FontExtension;
  uploadedAt: string;
}

export interface FontFamilyGroup {
  familyName: string;
  styleCount: number;
  fonts: FontFile[];
}

export type FontFamilySort = "family" | "uploadedAt";
export type SortOrder = "asc" | "desc";

export type DevicePlatform = "macos" | "windows" | "linux" | "ios";

export interface Device {
  id: string;
  name: string;
  platform: DevicePlatform;
  registeredAt: string;
  lastSeenAt: string;
  lastSyncAt?: string;
  installedFontIds: string[];
}

export interface Library {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  syncCode: string;
  fonts: FontFile[];
  devices?: Device[];
  createdAt: string;
  updatedAt: string;
}

export interface LibrarySummary {
  id: string;
  name: string;
  description?: string;
  fontCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PlanId = "free" | "pro";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired";

export interface EntitlementFeatures {
  sync: boolean;
  zipDownload: boolean;
  compare: boolean;
}

export interface Entitlement {
  plan: PlanId;
  status: SubscriptionStatus;
  isLaunchPricing: boolean;
  storageLimitBytes: number;
  storageUsedBytes: number;
  deviceLimit: number;
  deviceCount: number;
  features: EntitlementFeatures;
  currentPeriodEnd?: string;
}

export type CheckoutPriceId = "pro_annual" | "pro_launch" | "pro_monthly";

export interface BillingPlanPublic {
  id: CheckoutPriceId | "free";
  name: string;
  priceGbp: number;
  interval: "year" | "month" | null;
  storageLimitBytes: number;
  deviceLimit: number;
  features: string[];
  highlight: boolean;
  checkoutPriceId?: CheckoutPriceId;
  badge?: string;
  available?: boolean;
}

export interface BillingPlansResponse {
  plans: BillingPlanPublic[];
  launchOffer: {
    active: boolean;
    message: string;
  };
}

export interface MeResponse {
  user: { id: string; emailVerified: boolean };
  library: LibrarySummary;
  entitlement: Entitlement;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface FamilyListResponse {
  libraryId: string;
  sort: FontFamilySort;
  order: SortOrder;
  familyCount: number;
  fontCount: number;
  families: FontFamilyGroup[];
}

export interface LibraryResponse {
  library: Library;
  isOwner: boolean;
}

export const API_ERROR_CODES = {
  emailNotVerified: "EMAIL_NOT_VERIFIED",
  storageLimit: "STORAGE_LIMIT_EXCEEDED",
  deviceLimit: "DEVICE_LIMIT_EXCEEDED",
  syncUnavailable: "SYNC_NOT_AVAILABLE",
  alreadySubscribed: "ALREADY_SUBSCRIBED",
  zipDisabled: "ZIP_DISABLED",
} as const;
