import { Router, Request, Response } from 'express';
import { db } from '../db/db.ts';
import { AuditService } from '../services/auditService.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { RecoveryRecord } from '../db/types.ts';

export const recoveryRouter = Router();

// GET /api/v1/recovery - Staff view all completed recoveries
recoveryRouter.get('/', authenticateToken, requireRole('staff', 'admin'), (_req: Request, res: Response) => {
  const records = db.getRecoveryRecords();
  res.json({ success: true, records });
});

// POST /api/v1/recovery/arrange - Step: Staff coordinates handover location
recoveryRouter.post('/arrange', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  try {
    const { lost_report_id, handover_location, pickup_instructions } = req.body;
    if (!lost_report_id || !handover_location) {
      res.status(400).json({ success: false, error: 'Lost report ID and handover location are required.' });
      return;
    }

    const lost = db.getLostReportById(lost_report_id);
    if (!lost) {
      res.status(404).json({ success: false, error: 'Lost report not found' });
      return;
    }

    // Must be verified first!
    if (lost.status !== 'ownership_verified' && lost.status !== 'recovery_arranged') {
      res.status(400).json({
        success: false,
        error: `Cannot arrange handover for case in status "${lost.status}". Ownership must be officially verified first.`,
      });
      return;
    }

    const staffUser = db.getUserById(req.user!.userId);
    db.updateLostReport(lost.id, { status: 'recovery_arranged' });

    AuditService.logCaseEvent({
      reportType: 'lost',
      reportId: lost.id,
      caseReference: lost.case_reference,
      eventType: 'recovery_arranged',
      title: 'Recovery Handover Scheduled',
      description: `Luggage prepared for collection at ${handover_location}. Instructions: ${pickup_instructions || 'Please present matching government photo ID or original boarding pass.'}`,
      performedByRole: req.user!.role,
      performedByName: staffUser?.full_name || 'Staff Officer',
    });

    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'RECOVERY_ARRANGED',
      entityType: 'lost_report',
      entityId: lost.id,
      details: { location: handover_location },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Recovery handover scheduled successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/recovery/complete - Step: Staff records verified baggage release
recoveryRouter.post('/complete', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  try {
    const {
      lost_report_id,
      found_report_id,
      handover_airport,
      handover_location,
      id_type_verified,
      id_reference_masked,
      pickup_authorized_name,
      staff_notes,
    } = req.body;

    if (
      !lost_report_id ||
      !found_report_id ||
      !handover_airport ||
      !handover_location ||
      !id_type_verified ||
      !pickup_authorized_name
    ) {
      res.status(400).json({
        success: false,
        error: 'Missing required handover details: lost case, found case, airport, counter location, ID verification type, and recipient name are required.',
      });
      return;
    }

    const lost = db.getLostReportById(lost_report_id);
    const found = db.getFoundReportById(found_report_id);

    if (!lost || !found) {
      res.status(404).json({ success: false, error: 'Lost or found baggage record not found' });
      return;
    }

    // Strictly validate status state machine
    if (lost.status !== 'ownership_verified' && lost.status !== 'recovery_arranged') {
      res.status(400).json({
        success: false,
        error: `Cannot complete recovery. Case status is "${lost.status}". Must be 'ownership_verified' or 'recovery_arranged'.`,
      });
      return;
    }

    const staffUser = db.getUserById(req.user!.userId);
    const now = new Date().toISOString();

    const recoveryRecord: RecoveryRecord = {
      id: `rcv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      case_reference: lost.case_reference,
      lost_report_id: lost.id,
      found_report_id: found.id,
      passenger_id: lost.user_id,
      passenger_name: lost.passenger_name,
      verified_by_id: req.user!.userId,
      verified_by_name: staffUser?.full_name || 'Staff Officer',
      handover_airport: handover_airport.toUpperCase().trim(),
      handover_location: handover_location.trim(),
      id_type_verified: id_type_verified.trim(),
      id_reference_masked: id_reference_masked ? id_reference_masked.trim() : 'Verified In-Person',
      pickup_authorized_name: pickup_authorized_name.trim(),
      staff_notes: staff_notes?.trim(),
      completed_at: now,
    };

    db.createRecoveryRecord(recoveryRecord);

    // Finalize case statuses
    db.updateLostReport(lost.id, { status: 'recovered_and_closed' });
    db.updateFoundReport(found.id, { status: 'released_to_owner' });

    // Mark matching record completed
    const matches = db.getMatchesForLostReport(lost.id);
    for (const m of matches) {
      if (m.found_report_id === found.id) {
        db.updateMatch(m.id, { status: 'completed' });
      }
    }

    // Case timeline event
    AuditService.logCaseEvent({
      reportType: 'lost',
      reportId: lost.id,
      caseReference: lost.case_reference,
      eventType: 'recovered_and_closed',
      title: 'Baggage Successfully Handed Over & Case Closed',
      description: `Baggage released into custody of ${pickup_authorized_name} at ${handover_airport} (${handover_location}). Verified identity credentials: ${id_type_verified}. Officer: ${staffUser?.full_name}.`,
      performedByRole: req.user!.role,
      performedByName: staffUser?.full_name || 'Staff Officer',
    });

    AuditService.logCaseEvent({
      reportType: 'found',
      reportId: found.id,
      caseReference: found.case_reference,
      eventType: 'case_closed',
      title: 'Found Baggage Custody Released',
      description: `Item released to verified passenger ${pickup_authorized_name}. Case custody closed.`,
      performedByRole: req.user!.role,
      performedByName: staffUser?.full_name || 'Staff Officer',
    });

    // Audit log
    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'RECOVERY_COMPLETED',
      entityType: 'recovery_record',
      entityId: recoveryRecord.id,
      details: {
        case_reference: lost.case_reference,
        recipient: pickup_authorized_name,
        officer: staffUser?.full_name,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Baggage recovery recorded and case successfully closed.',
      recovery: recoveryRecord,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
