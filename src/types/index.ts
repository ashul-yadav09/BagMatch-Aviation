export type UserRole = 'passenger' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export type BagCategory =
  | 'suitcases_hard'
  | 'suitcases_soft'
  | 'backpack'
  | 'duffel'
  | 'tote_handbag'
  | 'briefcase_laptop'
  | 'garment_bag'
  | 'sports_specialty'
  | 'other';

export type BagSize = 'small' | 'medium' | 'large' | 'oversized';

export type LostReportStatus =
  | 'submitted'
  | 'under_review'
  | 'potential_match_found'
  | 'verification_pending'
  | 'ownership_verified'
  | 'recovery_arranged'
  | 'recovered_and_closed'
  | 'closed_unrecovered';

export type FoundReportStatus =
  | 'logged'
  | 'under_review'
  | 'potential_match_found'
  | 'verification_pending'
  | 'ownership_verified'
  | 'released_to_owner'
  | 'transferred_to_storage'
  | 'closed';

export interface LostReport {
  id: string;
  case_reference: string;
  user_id: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone?: string;
  flight_number: string;
  travel_date: string;
  departure_airport: string;
  arrival_airport: string;
  last_known_location?: string;
  bag_category: BagCategory;
  color: string;
  secondary_color?: string;
  size: BagSize;
  brand?: string;
  distinguishing_features?: string;
  description: string;
  photo_url?: string;
  status: LostReportStatus;
  created_at: string;
  updated_at: string;
}

export interface FoundReport {
  id: string;
  case_reference: string;
  finder_id: string;
  finder_role: UserRole;
  airport: string;
  terminal_area: string;
  found_date: string;
  found_time: string;
  found_location: string;
  bag_category: BagCategory;
  color: string;
  secondary_color?: string;
  size: BagSize;
  brand?: string;
  distinguishing_features?: string;
  description: string;
  photo_url?: string;
  status: FoundReportStatus;
  storage_location?: string;
  staff_notes?: string;
  created_at: string;
  updated_at: string;
}

export type MatchStatus = 'potential' | 'accepted' | 'rejected' | 'verified' | 'completed';

export interface BagMatchRecord {
  id: string;
  lost_report_id: string;
  found_report_id: string;
  score: number;
  matching_factors: string[];
  conflicting_factors: string[];
  missing_factors: string[];
  explanation: string;
  status: MatchStatus;
  reviewed_by_id?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  lost_report?: Partial<LostReport> & { route?: string };
  found_report?: Partial<FoundReport> & { route?: string };
}

export type VerificationStatus = 'pending_passenger' | 'response_submitted' | 'verified' | 'rejected';

export interface VerificationRequest {
  id: string;
  match_id: string;
  lost_report_id: string;
  found_report_id: string;
  passenger_id: string;
  requested_by_id: string;
  requested_by_name: string;
  questions: string[];
  passenger_response?: string;
  status: VerificationStatus;
  staff_decision_notes?: string;
  verified_by_id?: string;
  verified_by_name?: string;
  requested_at: string;
  responded_at?: string;
  decided_at?: string;
  lost_case_reference?: string;
  passenger_name?: string;
  flight_number?: string;
  found_case_reference?: string;
  airport?: string;
}

export interface RecoveryRecord {
  id: string;
  case_reference: string;
  lost_report_id: string;
  found_report_id: string;
  passenger_id: string;
  passenger_name: string;
  verified_by_id: string;
  verified_by_name: string;
  handover_airport: string;
  handover_location: string;
  id_type_verified: string;
  id_reference_masked: string;
  pickup_authorized_name: string;
  staff_notes?: string;
  completed_at: string;
}

export interface CaseEvent {
  id: string;
  report_type: 'lost' | 'found';
  report_id: string;
  case_reference: string;
  event_type: string;
  title: string;
  description: string;
  performed_by_role: UserRole | 'system';
  performed_by_name: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface OperationalStats {
  openLostCount: number;
  foundAwaitingReview: number;
  matchesAwaitingReview: number;
  verificationsPending: number;
  recoveredCount: number;
  totalLostReports: number;
  totalFoundReports: number;
  totalMatches: number;
  recoveryRate: number;
}
