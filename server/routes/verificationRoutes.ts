import { Router, Request, Response } from 'express';
import { db } from '../db/db.ts';
import { AuditService } from '../services/auditService.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { VerificationRequest } from '../db/types.ts';

export const verificationRouter = Router();

// GET /api/v1/verifications - Staff/Admin list all requests
verificationRouter.get('/', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  const requests = db.getVerificationRequests();
  const enriched = requests.map((v) => {
    const lost = db.getLostReportById(v.lost_report_id);
    const found = db.getFoundReportById(v.found_report_id);
    return {
      ...v,
      lost_case_reference: lost?.case_reference,
      passenger_name: lost?.passenger_name,
      flight_number: lost?.flight_number,
      found_case_reference: found?.case_reference,
      airport: found?.airport,
    };
  });
  res.json({ success: true, verifications: enriched });
});

// GET /api/v1/verifications/lost/:lostReportId - View verification for specific report
verificationRouter.get('/lost/:lostReportId', authenticateToken, (req: Request, res: Response) => {
  const lost = db.getLostReportById(req.params.lostReportId);
  if (!lost) {
    res.status(404).json({ success: false, error: 'Lost report not found' });
    return;
  }

  // Permission check: owner or staff/admin
  if (req.user!.role === 'passenger' && lost.user_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const verif = db.getVerificationRequestByLostReportId(lost.id);
  res.json({ success: true, verification: verif || null });
});

// POST /api/v1/verifications/request - Staff sends verification request to passenger
verificationRouter.post('/request', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  try {
    const { match_id, questions } = req.body;

    if (!match_id || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'Match ID and at least one verification question are required.' });
      return;
    }

    const match = db.getMatchById(match_id);
    if (!match) {
      res.status(404).json({ success: false, error: 'Match record not found' });
      return;
    }

    const lost = db.getLostReportById(match.lost_report_id);
    const found = db.getFoundReportById(match.found_report_id);
    if (!lost || !found) {
      res.status(404).json({ success: false, error: 'Associated lost/found report not found' });
      return;
    }

    const staffUser = db.getUserById(req.user!.userId);
    const now = new Date().toISOString();

    const verifReq: VerificationRequest = {
      id: `vrf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      match_id: match.id,
      lost_report_id: lost.id,
      found_report_id: found.id,
      passenger_id: lost.user_id,
      requested_by_id: req.user!.userId,
      requested_by_name: staffUser?.full_name || 'Staff Officer',
      questions: questions.filter((q: any) => typeof q === 'string' && q.trim().length > 0),
      status: 'pending_passenger',
      requested_at: now,
    };

    db.createVerificationRequest(verifReq);

    // Update statuses
    db.updateLostReport(lost.id, { status: 'verification_pending' });
    db.updateFoundReport(found.id, { status: 'verification_pending' });
    db.updateMatch(match.id, { status: 'accepted' });

    // Timeline event
    AuditService.logCaseEvent({
      reportType: 'lost',
      reportId: lost.id,
      caseReference: lost.case_reference,
      eventType: 'verification_requested',
      title: 'Ownership Verification Questions Dispatched',
      description: `Staff Officer ${staffUser?.full_name || ''} requested ownership verification. Passenger has been notified to provide private confirming details.`,
      performedByRole: req.user!.role,
      performedByName: staffUser?.full_name || 'Staff Officer',
    });

    // Audit log
    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'VERIFICATION_REQUESTED',
      entityType: 'verification_request',
      entityId: verifReq.id,
      details: { lost_case: lost.case_reference, question_count: questions.length },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Verification request sent to passenger.',
      verification: verifReq,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/verifications/:id/respond - Passenger submits response
verificationRouter.post('/:id/respond', authenticateToken, (req: Request, res: Response) => {
  try {
    const { response } = req.body;
    if (!response || typeof response !== 'string' || response.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Please provide a descriptive verification response.' });
      return;
    }

    const verif = db.getVerificationRequestById(req.params.id);
    if (!verif) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    // Must be the assigned passenger
    if (req.user!.role === 'passenger' && verif.passenger_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const lost = db.getLostReportById(verif.lost_report_id);
    const now = new Date().toISOString();

    const updated = db.updateVerificationRequest(verif.id, {
      passenger_response: response.trim(),
      status: 'response_submitted',
      responded_at: now,
    });

    if (lost) {
      AuditService.logCaseEvent({
        reportType: 'lost',
        reportId: lost.id,
        caseReference: lost.case_reference,
        eventType: 'verification_response_received',
        title: 'Passenger Verification Response Received',
        description: 'Passenger submitted identifying details. Case queued for staff review.',
        performedByRole: 'passenger',
        performedByName: req.user!.fullName || 'Passenger',
      });
    }

    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'VERIFICATION_RESPONSE_SUBMITTED',
      entityType: 'verification_request',
      entityId: verif.id,
      details: { lost_report_id: verif.lost_report_id },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Verification details submitted successfully. Airport staff will review your information.',
      verification: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/verifications/:id/decide - Staff approves or denies verification
verificationRouter.post('/:id/decide', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  try {
    const { decision, notes } = req.body;
    if (!['verified', 'rejected'].includes(decision)) {
      res.status(400).json({ success: false, error: "Decision must be 'verified' or 'rejected'." });
      return;
    }

    const verif = db.getVerificationRequestById(req.params.id);
    if (!verif) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    const lost = db.getLostReportById(verif.lost_report_id);
    const found = db.getFoundReportById(verif.found_report_id);
    const match = db.getMatchById(verif.match_id);

    const staffUser = db.getUserById(req.user!.userId);
    const now = new Date().toISOString();

    const updated = db.updateVerificationRequest(verif.id, {
      status: decision,
      staff_decision_notes: notes?.trim(),
      verified_by_id: req.user!.userId,
      verified_by_name: staffUser?.full_name || 'Staff Officer',
      decided_at: now,
    });

    if (decision === 'verified') {
      if (lost) db.updateLostReport(lost.id, { status: 'ownership_verified' });
      if (found) db.updateFoundReport(found.id, { status: 'ownership_verified' });
      if (match) db.updateMatch(match.id, { status: 'verified' });

      if (lost) {
        AuditService.logCaseEvent({
          reportType: 'lost',
          reportId: lost.id,
          caseReference: lost.case_reference,
          eventType: 'ownership_verified',
          title: 'Ownership Officially Verified',
          description: `Staff Officer ${staffUser?.full_name || ''} verified ownership against passenger credentials and physical luggage identifiers. Recovery handover ready to coordinate.`,
          performedByRole: req.user!.role,
          performedByName: staffUser?.full_name || 'Staff Officer',
        });
      }
    } else {
      if (lost) db.updateLostReport(lost.id, { status: 'under_review' });
      if (match) db.updateMatch(match.id, { status: 'rejected', rejection_reason: notes });

      if (lost) {
        AuditService.logCaseEvent({
          reportType: 'lost',
          reportId: lost.id,
          caseReference: lost.case_reference,
          eventType: 'ownership_rejected',
          title: 'Verification Inconclusive / Rejected',
          description: `Staff Officer ${staffUser?.full_name || ''} determined provided details did not corroborate item custody: ${notes || 'Mismatch in contents description'}.`,
          performedByRole: req.user!.role,
          performedByName: staffUser?.full_name || 'Staff Officer',
        });
      }
    }

    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'VERIFICATION_DECISION_RECORDED',
      entityType: 'verification_request',
      entityId: verif.id,
      details: { decision, notes },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Ownership verification marked as ${decision}.`,
      verification: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
