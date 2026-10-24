import { db } from '../db/db.ts';
import { AuditLog, CaseEvent, TimelineEventType, UserRole } from '../db/types.ts';

export class AuditService {
  public static logAction(params: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, any>;
    ipAddress?: string;
  }): AuditLog {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: params.userId,
      user_email: params.userEmail,
      user_role: params.userRole,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details,
      ip_address: params.ipAddress,
      created_at: new Date().toISOString(),
    };
    return db.addAuditLog(log);
  }

  public static logCaseEvent(params: {
    reportType: 'lost' | 'found';
    reportId: string;
    caseReference: string;
    eventType: TimelineEventType;
    title: string;
    description: string;
    performedByRole: UserRole | 'system';
    performedByName: string;
  }): CaseEvent {
    const event: CaseEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      report_type: params.reportType,
      report_id: params.reportId,
      case_reference: params.caseReference,
      event_type: params.eventType,
      title: params.title,
      description: params.description,
      performed_by_role: params.performedByRole,
      performed_by_name: params.performedByName,
      created_at: new Date().toISOString(),
    };
    return db.addCaseEvent(event);
  }
}
