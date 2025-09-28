import type { AxiosRequestConfig } from "axios";

export interface Options extends RateLimitOptions {
  axiosOptions?: AxiosRequestConfig;
  baseURL?: string;
  useCaseConverter?: boolean;
  headers?: { [key: string]: string };
}

export type LanguageCode =
  | "ar"
  | "bg"
  | "ca"
  | "ch"
  | "cz"
  | "de"
  | "dk"
  | "ee"
  | "en"
  | "es"
  | "fi"
  | "fr"
  | "frq"
  | "gr"
  | "he"
  | "hr"
  | "hu"
  | "it"
  | "lt"
  | "lv"
  | "mk"
  | "mx"
  | "nl"
  | "no"
  | "pl"
  | "pr"
  | "pt"
  | "ptbr"
  | "ro"
  | "ru"
  | "se"
  | "sk"
  | "sl"
  | "sr"
  | "tr"
  | "ua"
  | string
  | null;

export type CampaignAction = "send" | "cancel";
export type CampaignStatus = "sent" | "draft" | "outbox";

export interface CampaignQuery {
  limit?: number;
  offset?: number;
  order?: "ASC" | "DESC";
}

export interface CampaignData {
  type: "regular" | "ab";
  groups?: number[];
  segments?: number[];
  subject?: string;
  from?: string;
  fromName?: string;
  language?: LanguageCode;
  abSettings?: AbSettings;
}

export interface AbSettings {
  values: any[];
  sendType: string;
  abWinType: string;
  winnerAfter: number;
  winnerAfterType: string;
  splitPart: number;
}

export interface CampaignContent {
  html: string;
  plain: string;
  autoInline?: boolean;
}

export interface Count {
  count: number;
}

export interface CampaignSendData {
  type?: 1 | 2;
  followupSchedule?: "24h" | "specific";
  analytics?: 0 | 1;
  date?: string;
  timezoneId?: number;
  folowupDate?: string;
  followupTimezoneId?: number;
}

export interface SegmentQuery {
  limit?: number;
  offset?: number;
  order?: "ASC" | "DESC";
}

export type SubscriberType =
  | "active"
  | "unsubscribed"
  | "bounced"
  | "junk"
  | "unconfirmed";

export interface SubscriberQuery {
  limit?: number;
  offset?: number;
  type?: SubscriberType;
}

// TODO: consider adding optional key hints for city, company, etc.
export interface SubscriberFields {
  [key: string]: string | number | Date;
}

export interface SubscriberData {
  email: string;
  name?: string;
  fields?: SubscriberFields;
  resubscribe?: boolean;
  type?: "unsubscribed" | "active" | "unconfirmed";
  signupIp?: string;
  signupTimestamp?: string;
  confirmationIp?: string;
  confirmationTimestamp?: string;
}

export interface SubscriberDataUpdate {
  name?: string;
  type?: "unsubscribed" | "active";
  fields?: SubscriberFields;
  resendAutoresponders?: boolean;
}

export interface SubscriberSearchQuery {
  query?: string;
  offset?: number;
  limit?: number;
  minimized?: boolean;
}

export type SubscriberActivityType =
  | "opens"
  | "clicks"
  | "junks"
  | "bounces"
  | "unsubscribes"
  | "forwards"
  | "sendings"
  | null;

export interface GroupQuery {
  limit?: number;
  offset?: number;
  filters?: string;
}

export interface GroupSearchQuery {
  group_name: string;
}

export interface GroupData {
  name?: string;
}

export interface GroupSubscriberData {
  email: string;
  name?: string;
  fields?: SubscriberFields;
  resubscribe?: boolean;
  type?: "unsubscribed" | "active" | "unconfirmed";
  autoresponders?: boolean;
}

export interface GroupSubscriberFlags {
  resubscribe?: boolean;
  autoresponders?: boolean;
  returnStatus?: boolean;
}

export interface SubscriberGroupQuery extends GroupQuery {
  type?: SubscriberType;
}

export interface FieldData {
  title?: string;
  type?: "TEXT" | "NUMBER" | "DATE";
}

export interface FieldUpdate {
  title?: string;
}

export interface WebhookData {
  event: string;
  url: string;
}

export interface Stats {
  subscribed: number;
  unsubscribed: number;
  campaigns: number;
  sentEmails: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface DoubleOptinStatus {
  enabled: boolean;
  previewPaths: {
    pagePath: string;
    emailPath: string;
  };
}

export interface Timezone {
  id: number;
  time: number;
  gmt: string;
  title: string;
  timezone?: string;
}

export interface Account {
  id: string;
  email: string;
  from: string;
  name: string;
  subdomain: string;
  timezone: Timezone;
}

export interface AccountWrap {
  account: Account;
}

export interface Batch {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: {
    [key: string]: any;
  };
}

export interface SegmentsResponse {
  data: any[];
  meta: {
    pagination: {
      count: number;
      current_page: number;
      links: any[];
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface WebhooksResponse {
  count: number;
  limit: number;
  start: number;
  webhooks: any[];
}

export interface RateLimitHeaders {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter: number;
}

export interface RateLimitOptions {
  enableRateLimit?: boolean;
  rateLimitRetryAttempts?: number;
  rateLimitRetryDelay?: number;
  onRateLimitHit?: (headers: RateLimitHeaders) => void;
  onRateLimitRetry?: (attempt: number, headers: RateLimitHeaders) => void;
}

export interface RateLimitError extends Error {
  rateLimitHeaders: RateLimitHeaders;
  isRateLimitError: true;
}

// API method return types
export interface AccountApi {
  getAccountRaw(): Promise<AccountWrap>;
  getAccount(): Promise<Account>;
  getMe(): Promise<Account>;
}

export interface BatchApi {
  batch(requests: Batch[]): Promise<any[]>;
}

export interface CampaignsApi {
  actOnCampaign(
    campaignId: number,
    action: CampaignAction,
    data?: CampaignSendData,
  ): Promise<any>;
  getCampaigns(status?: CampaignStatus, params?: CampaignQuery): Promise<any>;
  getCampaignCount(status?: CampaignStatus): Promise<number>;
  createCampaign(campaign: CampaignData): Promise<any>;
  getCampaign(campaignId: number): Promise<any>;
  setCampaignContent(
    campaignId: number,
    content: CampaignContent,
  ): Promise<any>;
}

export interface FieldsApi {
  getFields(): Promise<any>;
  createField(field: FieldData): Promise<any>;
  updateField(fieldId: number, fieldUpdate: FieldUpdate): Promise<any>;
  removeField(fieldId: number): Promise<any>;
}

export interface GroupsApi {
  getGroups(params?: GroupQuery): Promise<any[]>;
  searchGroups(groupName: string): Promise<any[]>;
  getGroup(groupId: number): Promise<any>;
  createGroup(group: GroupData): Promise<any>;
  updateGroup(groupId: number, group: GroupData): Promise<any>;
  removeGroup(groupId: number): Promise<{ success: boolean }>;
  addSubscriberToGroup(
    groupId: number,
    subscriber: GroupSubscriberData,
  ): Promise<any>;
  addSubscribersToGroup(
    groupId: number,
    subscribers: GroupSubscriberData[],
    importOptions?: GroupSubscriberFlags,
  ): Promise<any>;
  getSubscribersGroupImport(groupId: number, importId: number): Promise<any>;
  getGroupSubscriber(groupId: number, subscriberId: number): Promise<any>;
  getGroupSubscribers(
    groupId: number,
    params?: SubscriberGroupQuery,
  ): Promise<any>;
  getGroupSubscriberCount(groupId: number): Promise<number>;
  getGroupSubscribersByType(
    groupId: number,
    subscriberType: SubscriberType,
    params?: GroupQuery,
  ): Promise<any>;
  getGroupSubscribersCountByType(
    groupId: number,
    subscriberType: SubscriberType,
  ): Promise<number>;
  removeGroupSubscriber(
    groupId: number,
    subscriberIdentifier: string,
  ): Promise<string>;
}

export interface SegmentsApi {
  getSegments(params?: SegmentQuery): Promise<any[]>;
  getSegmentsCount(params?: SegmentQuery): Promise<number>;
  getSegmentsRaw(params?: SegmentQuery): Promise<SegmentsResponse>;
}

export interface SettingsApi {
  getDoubleOptinStatus(): Promise<DoubleOptinStatus>;
  hasEnabledDoubleOptin(): Promise<boolean>;
  setDoubleOptin(isEnabled: boolean): Promise<DoubleOptinStatus>;
  enableDoubleOptin(): Promise<DoubleOptinStatus>;
  disableDoubleOptin(): Promise<DoubleOptinStatus>;
}

export interface StatsApi {
  getStats(): Promise<Stats>;
}

export interface SubscribersApi {
  getSubscribers(params?: SubscriberQuery): Promise<any>;
  addSubscriber(subscriber: SubscriberData): Promise<any>;
  getSubscriber(identifier: string): Promise<any>;
  updateSubscriber(
    identifier: string,
    subscriber: SubscriberDataUpdate,
  ): Promise<any>;
  searchSubscribers(params?: SubscriberSearchQuery): Promise<any>;
  getSubscriberActivity(identifier: string): Promise<any>;
  getSubscriberActivityByType(
    identifier: string,
    activityType: SubscriberActivityType,
  ): Promise<any>;
  removeSubscriber(identifier: string): Promise<any>;
  getSubscriberGroups(identifier: string): Promise<any>;
}

export interface TimezonesApi {
  getTimezones(): Promise<Timezone[]>;
  getTimezone(timezoneId: number): Promise<Timezone>;
}

export interface WebhooksApi {
  getWebhooks(): Promise<any[]>;
  getWebhooksCount(): Promise<number>;
  getWebhooksRaw(): Promise<WebhooksResponse>;
  getWebhook(webhookId: number): Promise<any>;
  createWebhook(webhook: WebhookData): Promise<any>;
  updateWebhook(webhookId: number, webhookUpdate: WebhookData): Promise<any>;
  removeWebhook(webhookId: number): Promise<any>;
}

export interface MailerLiteClient
  extends AccountApi,
    BatchApi,
    CampaignsApi,
    FieldsApi,
    GroupsApi,
    SegmentsApi,
    SettingsApi,
    StatsApi,
    SubscribersApi,
    TimezonesApi,
    WebhooksApi {}
