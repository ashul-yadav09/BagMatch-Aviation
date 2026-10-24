import {
  User,
  LostReport,
  FoundReport,
  BagMatchRecord,
  VerificationRequest,
  RecoveryRecord,
  CaseEvent,
  AuditLog,
  OperationalStats,
} from '../types';

import { safeStorage } from './storage';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeStorage.getItem('bagmatch_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error || `HTTP ${response.status}: Request failed`);
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await request<{ success: boolean; user: User; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      safeStorage.setItem('bagmatch_token', res.token);
    }
    return res;
  },

  async register(data: { full_name: string; email: string; password: string; phone?: string }): Promise<{ success: boolean; user: User; token: string }> {
    const res = await request<{ success: boolean; user: User; token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      safeStorage.setItem('bagmatch_token', res.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    safeStorage.removeItem('bagmatch_token');
    await request('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/api/v1/auth/me');
  },

  async updateProfile(data: { full_name?: string; phone?: string }): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    return request<{ success: boolean; users: User[] }>('/api/v1/auth/users');
  },

  async updateUserRole(userId: string, role: string): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>(`/api/v1/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  // Reports
  async submitLostReport(data: any): Promise<{ success: boolean; report: LostReport }> {
    return request<{ success: boolean; report: LostReport }>('/api/v1/reports/lost', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitFoundReport(data: any): Promise<{ success: boolean; report: FoundReport }> {
    return request<{ success: boolean; report: FoundReport }>('/api/v1/reports/found', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyCases(): Promise<{ success: boolean; cases: any[] }> {
    return request<{ success: boolean; cases: any[] }>('/api/v1/reports/my-cases');
  },

  async getLostReport(id: string): Promise<{
    success: boolean;
    report: LostReport;
    events: CaseEvent[];
    matches: BagMatchRecord[];
    verification?: VerificationRequest;
    recovery?: RecoveryRecord;
  }> {
    return request(`/api/v1/reports/lost/${id}`);
  },

  async getFoundReport(id: string): Promise<{
    success: boolean;
    report: FoundReport;
    events: CaseEvent[];
    matches?: BagMatchRecord[];
  }> {
    return request(`/api/v1/reports/found/${id}`);
  },

  async getStaffReports(params: { type?: string; status?: string; query?: string; airport?: string } = {}): Promise<{
    success: boolean;
    lostReports: LostReport[];
    foundReports: FoundReport[];
  }> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.status) searchParams.set('status', params.status);
    if (params.query) searchParams.set('query', params.query);
    if (params.airport) searchParams.set('airport', params.airport);
    return request(`/api/v1/reports/staff/all?${searchParams.toString()}`);
  },

  // Matches
  async getMatches(params: { status?: string; min_score?: number } = {}): Promise<{ success: boolean; matches: BagMatchRecord[] }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.min_score) searchParams.set('min_score', String(params.min_score));
    return request(`/api/v1/matches?${searchParams.toString()}`);
  },

  async reviewMatch(matchId: string, decision: 'accepted' | 'rejected', reason?: string): Promise<{ success: boolean; match: BagMatchRecord }> {
    return request(`/api/v1/matches/${matchId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  },

  async runAiAnalysis(matchId: string): Promise<{ success: boolean; explanation: string; match: BagMatchRecord }> {
    return request(`/api/v1/matches/${matchId}/ai-explain`, {
      method: 'POST',
    });
  },

  async runBatchMatching(): Promise<{ success: boolean; message: string; newMatchesCreated: number }> {
    return request('/api/v1/matches/batch-run', { method: 'POST' });
  },

  // Verification
  async getVerifications(): Promise<{ success: boolean; verifications: VerificationRequest[] }> {
    return request('/api/v1/verifications');
  },

  async getVerificationForLostReport(lostReportId: string): Promise<{ success: boolean; verification: VerificationRequest | null }> {
    return request(`/api/v1/verifications/lost/${lostReportId}`);
  },

  async requestVerification(matchId: string, questions: string[]): Promise<{ success: boolean; verification: VerificationRequest }> {
    return request('/api/v1/verifications/request', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, questions }),
    });
  },

  async submitVerificationResponse(verificationId: string, response: string): Promise<{ success: boolean; verification: VerificationRequest }> {
    return request(`/api/v1/verifications/${verificationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  },

  async decideVerification(verificationId: string, decision: 'verified' | 'rejected', notes?: string): Promise<{ success: boolean; verification: VerificationRequest }> {
    return request(`/api/v1/verifications/${verificationId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  },

  // Recovery
  async getRecoveries(): Promise<{ success: boolean; records: RecoveryRecord[] }> {
    return request('/api/v1/recovery');
  },

  async arrangeRecovery(lostReportId: string, handoverLocation: string, pickupInstructions?: string): Promise<{ success: boolean }> {
    return request('/api/v1/recovery/arrange', {
      method: 'POST',
      body: JSON.stringify({
        lost_report_id: lostReportId,
        handover_location: handoverLocation,
        pickup_instructions: pickupInstructions,
      }),
    });
  },

  async completeRecovery(data: {
    lost_report_id: string;
    found_report_id: string;
    handover_airport: string;
    handover_location: string;
    id_type_verified: string;
    id_reference_masked?: string;
    pickup_authorized_name: string;
    staff_notes?: string;
  }): Promise<{ success: boolean; recovery: RecoveryRecord }> {
    return request('/api/v1/recovery/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dashboard & Admin
  async getDashboardStats(): Promise<{
    success: boolean;
    stats: OperationalStats;
    recentActivity: AuditLog[];
    activityFeed: any[];
  }> {
    return request('/api/v1/dashboard/stats');
  },

  async getAuditLogs(limit = 100): Promise<{ success: boolean; logs: AuditLog[] }> {
    return request(`/api/v1/dashboard/audit-logs?limit=${limit}`);
  },
};
