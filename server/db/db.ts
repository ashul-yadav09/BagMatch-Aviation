import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
  User,
  LostReport,
  FoundReport,
  BagMatchRecord,
  VerificationRequest,
  RecoveryRecord,
  CaseEvent,
  AuditLog,
} from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bagmatch.json');

const INITIAL_SCHEMA: DatabaseSchema = {
  users: [],
  lost_reports: [],
  found_reports: [],
  matches: [],
  verification_requests: [],
  recovery_records: [],
  case_events: [],
  audit_logs: [],
};

class Database {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = { ...INITIAL_SCHEMA };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
        return;
      } catch (err) {
        console.error('Failed reading DB file, recreating with seeds:', err);
      }
    }

    this.seedInitialData();
    this.save();
    this.isLoaded = true;
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const now = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const adminUser: User = {
      id: 'usr_admin_01',
      email: 'admin@bagmatch.aero',
      password_hash: bcrypt.hashSync('AeroAdmin2026!', salt),
      full_name: 'Director Marcus Vance',
      role: 'admin',
      department: 'System Administration & Security',
      phone: '+1 (555) 019-8271',
      created_at: twoDaysAgo,
      updated_at: twoDaysAgo,
    };

    const staffUser: User = {
      id: 'usr_staff_01',
      email: 'officer.jenkins@bagmatch.aero',
      password_hash: bcrypt.hashSync('StaffPass2026!', salt),
      full_name: 'Sarah Jenkins',
      role: 'staff',
      department: 'Baggage Recovery Operations - SFO Terminal 2',
      phone: '+1 (555) 019-4432',
      created_at: twoDaysAgo,
      updated_at: twoDaysAgo,
    };

    const passengerUser: User = {
      id: 'usr_pax_01',
      email: 'emma.watson@example.com',
      password_hash: bcrypt.hashSync('Passenger2026!', salt),
      full_name: 'Emma Watson',
      role: 'passenger',
      phone: '+1 (555) 014-9988',
      created_at: twoDaysAgo,
      updated_at: twoDaysAgo,
    };

    this.data.users = [adminUser, staffUser, passengerUser];

    // Seed realistic sample reports
    const lostBag1: LostReport = {
      id: 'lost_rep_01',
      case_reference: 'BM-2026-L8491',
      user_id: passengerUser.id,
      passenger_name: passengerUser.full_name,
      passenger_email: passengerUser.email,
      passenger_phone: passengerUser.phone,
      flight_number: 'UA482',
      travel_date: '2026-10-22',
      departure_airport: 'ORD',
      arrival_airport: 'SFO',
      last_known_location: 'Carousel 4, Terminal 3 Baggage Claim',
      bag_category: 'suitcases_hard',
      color: 'Midnight Blue',
      secondary_color: 'Silver trim',
      size: 'medium',
      brand: 'Rimowa',
      distinguishing_features: 'Small aviation sticker on top left corner, scratch near telescopic handle base',
      description: 'Rimowa Essential Lite medium check-in spinner, dark blue polycarbonate with silver wheels.',
      status: 'verification_pending',
      created_at: twoDaysAgo,
      updated_at: oneDayAgo,
    };

    const foundBag1: FoundReport = {
      id: 'fnd_rep_01',
      case_reference: 'BM-2026-F3102',
      finder_id: staffUser.id,
      finder_role: 'staff',
      airport: 'SFO',
      terminal_area: 'Terminal 3 - Oversize baggage storage area',
      found_date: '2026-10-22',
      found_time: '18:45',
      found_location: 'Near Carousel 4 service door',
      bag_category: 'suitcases_hard',
      color: 'Midnight Blue',
      secondary_color: 'Silver',
      size: 'medium',
      brand: 'Rimowa',
      distinguishing_features: 'Aviation decal on top shell, minor abrasion on handle bezel',
      description: 'Blue hard-shell Rimowa spinner found unattended post-UA flight debarkation.',
      status: 'verification_pending',
      storage_location: 'Secure Vault Locker B-14',
      staff_notes: 'Unclaimed after belt shutdown. Locked with TSA combination.',
      created_at: twoDaysAgo,
      updated_at: oneDayAgo,
    };

    const match1: BagMatchRecord = {
      id: 'mtch_01',
      lost_report_id: lostBag1.id,
      found_report_id: foundBag1.id,
      score: 94,
      matching_factors: [
        'Exact airport match (SFO)',
        'Matching category: Hard-shell suitcase',
        'Primary color match: Midnight Blue',
        'Brand match: Rimowa',
        'Size match: Medium check-in',
        'Same date of travel and discovery (2026-10-22)',
        'Carousel 4 proximity verified',
      ],
      conflicting_factors: [],
      missing_factors: [],
      explanation:
        'High-confidence match: Identical Rimowa medium hard-shell spinner located at SFO Terminal 3 near Carousel 4 on the same date as UA482 arrival.',
      status: 'accepted',
      reviewed_by_id: staffUser.id,
      reviewed_by_name: staffUser.full_name,
      reviewed_at: oneDayAgo,
      created_at: twoDaysAgo,
      updated_at: oneDayAgo,
    };

    const verif1: VerificationRequest = {
      id: 'vrf_01',
      match_id: match1.id,
      lost_report_id: lostBag1.id,
      found_report_id: foundBag1.id,
      passenger_id: passengerUser.id,
      requested_by_id: staffUser.id,
      requested_by_name: staffUser.full_name,
      questions: [
        'Please specify the 3-digit TSA lock combination, if set.',
        'Describe 2-3 specific non-sensitive articles located in the front interior divider compartment.',
      ],
      passenger_response:
        'The combination is 742. Inside the zippered divider there is a blue noise-cancelling headphone case and a yellow hardcover travel journal.',
      status: 'response_submitted',
      requested_at: oneDayAgo,
      responded_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    };

    const events: CaseEvent[] = [
      {
        id: 'evt_01',
        report_type: 'lost',
        report_id: lostBag1.id,
        case_reference: lostBag1.case_reference,
        event_type: 'report_submitted',
        title: 'Lost Baggage Report Filed',
        description: 'Passenger submitted report BM-2026-L8491 for flight UA482.',
        performed_by_role: 'passenger',
        performed_by_name: passengerUser.full_name,
        created_at: twoDaysAgo,
      },
      {
        id: 'evt_02',
        report_type: 'found',
        report_id: foundBag1.id,
        case_reference: foundBag1.case_reference,
        event_type: 'report_submitted',
        title: 'Found Baggage Logged into Custody',
        description: 'Airport staff secured found bag at SFO Terminal 3 and placed into Vault Locker B-14.',
        performed_by_role: 'staff',
        performed_by_name: staffUser.full_name,
        created_at: twoDaysAgo,
      },
      {
        id: 'evt_03',
        report_type: 'lost',
        report_id: lostBag1.id,
        case_reference: lostBag1.case_reference,
        event_type: 'potential_match_identified',
        title: 'Potential Baggage Match Identified',
        description: 'System identified a 94% confidence match with found report BM-2026-F3102 at SFO.',
        performed_by_role: 'system',
        performed_by_name: 'BagMatch Engine',
        created_at: twoDaysAgo,
      },
      {
        id: 'evt_04',
        report_type: 'lost',
        report_id: lostBag1.id,
        case_reference: lostBag1.case_reference,
        event_type: 'verification_requested',
        title: 'Ownership Verification Requested',
        description: 'Staff Officer Sarah Jenkins dispatched 2 verification questions to passenger.',
        performed_by_role: 'staff',
        performed_by_name: staffUser.full_name,
        created_at: oneDayAgo,
      },
      {
        id: 'evt_05',
        report_type: 'lost',
        report_id: lostBag1.id,
        case_reference: lostBag1.case_reference,
        event_type: 'verification_response_received',
        title: 'Passenger Provided Verification Details',
        description: 'Passenger submitted lock and interior compartment verification response.',
        performed_by_role: 'passenger',
        performed_by_name: passengerUser.full_name,
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ];

    const audit: AuditLog = {
      id: 'aud_01',
      user_id: staffUser.id,
      user_email: staffUser.email,
      user_role: staffUser.role,
      action: 'SYSTEM_BOOTSTRAP',
      entity_type: 'system',
      entity_id: 'bagmatch_init',
      details: { message: 'BagMatch database initialized with operational baseline.' },
      created_at: now,
    };

    this.data.lost_reports = [lostBag1];
    this.data.found_reports = [foundBag1];
    this.data.matches = [match1];
    this.data.verification_requests = [verif1];
    this.data.case_events = events;
    this.data.audit_logs = [audit];
  }

  public save(): void {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  // Lost Reports
  public getLostReports(): LostReport[] {
    return this.data.lost_reports;
  }

  public getLostReportById(id: string): LostReport | undefined {
    return this.data.lost_reports.find((r) => r.id === id || r.case_reference === id);
  }

  public getLostReportsByUserId(userId: string): LostReport[] {
    return this.data.lost_reports.filter((r) => r.user_id === userId);
  }

  public createLostReport(report: LostReport): LostReport {
    this.data.lost_reports.unshift(report);
    this.save();
    return report;
  }

  public updateLostReport(id: string, updates: Partial<LostReport>): LostReport | undefined {
    const idx = this.data.lost_reports.findIndex((r) => r.id === id || r.case_reference === id);
    if (idx === -1) return undefined;
    this.data.lost_reports[idx] = {
      ...this.data.lost_reports[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.lost_reports[idx];
  }

  // Found Reports
  public getFoundReports(): FoundReport[] {
    return this.data.found_reports;
  }

  public getFoundReportById(id: string): FoundReport | undefined {
    return this.data.found_reports.find((r) => r.id === id || r.case_reference === id);
  }

  public getFoundReportsByFinderId(finderId: string): FoundReport[] {
    return this.data.found_reports.filter((r) => r.finder_id === finderId);
  }

  public createFoundReport(report: FoundReport): FoundReport {
    this.data.found_reports.unshift(report);
    this.save();
    return report;
  }

  public updateFoundReport(id: string, updates: Partial<FoundReport>): FoundReport | undefined {
    const idx = this.data.found_reports.findIndex((r) => r.id === id || r.case_reference === id);
    if (idx === -1) return undefined;
    this.data.found_reports[idx] = {
      ...this.data.found_reports[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.found_reports[idx];
  }

  // Matches
  public getMatches(): BagMatchRecord[] {
    return this.data.matches;
  }

  public getMatchById(id: string): BagMatchRecord | undefined {
    return this.data.matches.find((m) => m.id === id);
  }

  public getMatchesForLostReport(lostReportId: string): BagMatchRecord[] {
    return this.data.matches.filter((m) => m.lost_report_id === lostReportId);
  }

  public getMatchesForFoundReport(foundReportId: string): BagMatchRecord[] {
    return this.data.matches.filter((m) => m.found_report_id === foundReportId);
  }

  public saveMatch(match: BagMatchRecord): BagMatchRecord {
    const existingIdx = this.data.matches.findIndex(
      (m) =>
        m.id === match.id ||
        (m.lost_report_id === match.lost_report_id && m.found_report_id === match.found_report_id)
    );
    if (existingIdx !== -1) {
      this.data.matches[existingIdx] = {
        ...this.data.matches[existingIdx],
        ...match,
        updated_at: new Date().toISOString(),
      };
      this.save();
      return this.data.matches[existingIdx];
    } else {
      this.data.matches.unshift(match);
      this.save();
      return match;
    }
  }

  public updateMatch(id: string, updates: Partial<BagMatchRecord>): BagMatchRecord | undefined {
    const idx = this.data.matches.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.data.matches[idx] = {
      ...this.data.matches[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.matches[idx];
  }

  // Verification Requests
  public getVerificationRequests(): VerificationRequest[] {
    return this.data.verification_requests;
  }

  public getVerificationRequestById(id: string): VerificationRequest | undefined {
    return this.data.verification_requests.find((v) => v.id === id);
  }

  public getVerificationRequestByLostReportId(lostReportId: string): VerificationRequest | undefined {
    return this.data.verification_requests.find((v) => v.lost_report_id === lostReportId);
  }

  public createVerificationRequest(req: VerificationRequest): VerificationRequest {
    this.data.verification_requests.unshift(req);
    this.save();
    return req;
  }

  public updateVerificationRequest(
    id: string,
    updates: Partial<VerificationRequest>
  ): VerificationRequest | undefined {
    const idx = this.data.verification_requests.findIndex((v) => v.id === id);
    if (idx === -1) return undefined;
    this.data.verification_requests[idx] = {
      ...this.data.verification_requests[idx],
      ...updates,
    };
    this.save();
    return this.data.verification_requests[idx];
  }

  // Recovery Records
  public getRecoveryRecords(): RecoveryRecord[] {
    return this.data.recovery_records;
  }

  public getRecoveryRecordByLostReportId(lostReportId: string): RecoveryRecord | undefined {
    return this.data.recovery_records.find((r) => r.lost_report_id === lostReportId);
  }

  public createRecoveryRecord(rec: RecoveryRecord): RecoveryRecord {
    this.data.recovery_records.unshift(rec);
    this.save();
    return rec;
  }

  // Case Events
  public getCaseEvents(reportId: string): CaseEvent[] {
    return this.data.case_events
      .filter((e) => e.report_id === reportId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addCaseEvent(event: CaseEvent): CaseEvent {
    this.data.case_events.push(event);
    this.save();
    return event;
  }

  // Audit Logs
  public getAuditLogs(limit = 100): AuditLog[] {
    return [...this.data.audit_logs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.data.audit_logs.unshift(log);
    this.save();
    return log;
  }

  // Helper for generating unique sequential references
  public generateCaseReference(type: 'lost' | 'found'): string {
    const year = new Date().getFullYear();
    const prefix = type === 'lost' ? 'BM-L' : 'BM-F';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${rand}`;
  }
}

export const db = new Database();
