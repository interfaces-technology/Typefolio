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
  familyId?: string;
  originalName: string;
  storedName: string;
  sha256: string;
  size: number;
  extension: FontExtension;
  uploadedAt: string;
}

export type FontClassification =
  | "serif"
  | "sans"
  | "mono"
  | "display"
  | "other";

export interface FontFamilyGroup {
  id?: string;
  slug?: string;
  familyName: string;
  foundry?: string;
  version?: string;
  classification?: FontClassification;
  mood?: string[];
  license?: string;
  source?: string;
  languages?: string[];
  glyphCount?: number;
  favoritedAt?: string;
  editedFields?: string[];
  totalSize?: number;
  styleCount: number;
  fonts: FontFile[];
  createdAt?: string;
  updatedAt?: string;
}

export type CollectionItemType = "family" | "reference" | "note";
export type FavoriteItemType = "family" | "reference";
export type ActivityAction = "added" | "updated" | "removed" | "synced";
export type ReferenceFontRole = "used" | "related";
export type ShareVisibility = "link" | "invited";

export interface CollectionSummary {
  id: string;
  libraryId: string;
  slug: string;
  name: string;
  description?: string;
  fontCount: number;
  referenceCount: number;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  itemType: CollectionItemType;
  itemId?: string;
  noteBody?: string;
  position: number;
}

export interface CollectionDetail extends CollectionSummary {
  items: CollectionItem[];
}

export interface ReferenceFontLink {
  familyId: string;
  slug: string;
  name: string;
  role: ReferenceFontRole;
}

export interface ReferenceRecord {
  id: string;
  libraryId: string;
  slug: string;
  title: string;
  category?: string;
  year?: number;
  description?: string;
  imageUrl: string;
  tags: string[];
  relatedFonts: ReferenceFontLink[];
  favoritedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRecord {
  id: string;
  itemType: FavoriteItemType;
  itemId: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  occurredAt: string;
  action: ActivityAction;
  itemName: string;
  deviceId?: string;
}

export interface ShareLink {
  id: string;
  resourceType: string;
  resourceId: string;
  token: string;
  visibility: ShareVisibility;
  url: string;
  createdAt: string;
}

export interface SearchResults {
  query: string;
  fonts: FontFamilyGroup[];
  collections: CollectionSummary[];
  inspiration: ReferenceRecord[];
  foundries: string[];
  tags: string[];
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

export interface CreateLibraryInput {
  name: string;
  description?: string;
}

export interface LibrarySummary {
  id: string;
  name: string;
  description?: string;
  syncCode: string;
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
