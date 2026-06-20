/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ServiceItem {
  id: string;
  tagline: string;
  title: string;
  description: string;
  features: string[];
  ctaUrl?: string;
  iconName: string;
}

export interface IndustryItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization: string;
  quote: string;
}

export interface ValueItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface CareerRole {
  id: string;
  title: string;
  type: string;
  location: string;
  languages: string;
  description: string;
  requirements: string[];
  isInterpreter: boolean;
}

export interface PerkItem {
  id: string;
  number: string;
  title: string;
  description: string;
}

export interface StatMetric {
  id: string;
  value: string;
  number: number;
  suffix: string;
  label: string;
}

export interface FormPrepareResponse {
  success: boolean;
  form_key: string;
  required_hidden_fields: {
    _session_id: string;
    _challenge_token: string;
    _anti_bot_timestamp: string;
  };
}

export type MailboxFolder = "inbox" | "sent";

export interface MailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  timestamp: string;
  body: string; // Plain-text or HTML body
  isRead: boolean;
  folder: MailboxFolder;
}

export type InvitationStatus = "Active" | "Sent" | "Pending";

export interface InvitationState {
  id: string;
  candidateName: string;
  email: string;
  role: string;
  status: InvitationStatus;
  templateUsed: string;
  sentAt?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  details: string;
}

