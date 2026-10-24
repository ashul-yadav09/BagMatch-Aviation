import { Router, Request, Response } from 'express';
import { db } from '../db/db.ts';
import { MatchingService } from '../services/matchingService.ts';
import { AuditService } from '../services/auditService.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { BagMatchRecord } from '../db/types.ts';

export const matchRouter = Router();

// GET /api/v1/matches - Staff view all matches
matchRouter.get('/', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  const { status, min_score } = req.query;
  let matches = db.getMatches();

  if (status && typeof status === 'string') {
    matches = matches.filter((m) => m.status === status);
  }

  if (min_score && !isNaN(Number(min_score))) {
    const min = Number(min_score);
    matches = matches.filter((m) => m.score >= min);
  }

  const enriched = matches.map((m) => {
    const lost = db.getLostReportById(m.lost_report_id);
    const found = db.getFoundReportById(m.found_report_id);
    return {
      ...m,
      lost_report: lost
        ? {
            id: lost.id,
            case_reference: lost.case_reference,
            flight_number: lost.flight_number,
            travel_date: lost.travel_date,
            route: `${lost.departure_airport} -> ${lost.arrival_airport}`,
            color: lost.color,
            bag_category: lost.bag_category,
            brand: lost.brand,
            passenger_name: lost.passenger_name,
            status: lost.status,
          }
        : null,
      found_report: found
        ? {
            id: found.id,
            case_reference: found.case_reference,
            airport: found.airport,
            terminal_area: found.terminal_area,
            found_date: found.found_date,
            color: found.color,
            bag_category: found.bag_category,
            brand: found.brand,
            status: found.status,
          }
        : null,
    };
  });

  res.json({ success: true, matches: enriched });
});

// GET /api/v1/matches/:id - View single match detail
matchRouter.get('/:id', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  const match = db.getMatchById(req.params.id);
  if (!match) {
    res.status(404).json({ success: false, error: 'Match record not found' });
    return;
  }

  const lost = db.getLostReportById(match.lost_report_id);
  const found = db.getFoundReportById(match.found_report_id);
  const verification = db.getVerificationRequestByLostReportId(match.lost_report_id);

  res.json({
    success: true,
    match,
    lost_report: lost,
    found_report: found,
    verification,
  });
});

// POST /api/v1/matches/:id/review - Staff records decision (accept or reject)
matchRouter.post('/:id/review', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  try {
    const { decision, reason } = req.body;
    if (!['accepted', 'rejected'].includes(decision)) {
      res.status(400).json({ success: false, error: "Decision must be 'accepted' or 'rejected'." });
      return;
    }

    const match = db.getMatchById(req.params.id);
    if (!match) {
      res.status(404).json({ success: false, error: 'Match not found' });
      return;
    }

    const now = new Date().toISOString();
    const staffUser = db.getUserById(req.user!.userId);

    const updatedMatch = db.updateMatch(match.id, {
      status: decision,
      reviewed_by_id: req.user!.userId,
      reviewed_by_name: staffUser?.full_name || req.user!.email,
      reviewed_at: now,
      rejection_reason: decision === 'rejected' ? reason || 'Physical inspection ruled out correspondence' : undefined,
    });

    const lost = db.getLostReportById(match.lost_report_id);
    const found = db.getFoundReportById(match.found_report_id);

    if (decision === 'accepted') {
      if (lost) db.updateLostReport(lost.id, { status: 'potential_match_found' });
      if (found) db.updateFoundReport(found.id, { status: 'potential_match_found' });

      if (lost) {
        AuditService.logCaseEvent({
          reportType: 'lost',
          reportId: lost.id,
          caseReference: lost.case_reference,
          eventType: 'match_reviewed',
          title: 'Candidate Match Validated by Staff',
          description: `Staff Officer ${staffUser?.full_name || ''} approved candidate match with found report ${found?.case_reference || ''} for ownership verification.`,
          performedByRole: req.user!.role,
          performedByName: staffUser?.full_name || 'Staff Officer',
        });
      }
    } else {
      if (lost) {
        AuditService.logCaseEvent({
          reportType: 'lost',
          reportId: lost.id,
          caseReference: lost.case_reference,
          eventType: 'case_updated',
          title: 'Match Candidate Disqualified',
          description: `Staff reviewed candidate match ${match.id} and rejected: ${reason || 'Physical inspection ruled out match'}.`,
          performedByRole: req.user!.role,
          performedByName: staffUser?.full_name || 'Staff Officer',
        });
      }
    }

    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'MATCH_REVIEWED',
      entityType: 'match',
      entityId: match.id,
      details: { decision, reason },
      ipAddress: req.ip,
    });

    res.json({ success: true, match: updatedMatch });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/matches/:id/ai-explain - Trigger Gemini analysis for match
matchRouter.post('/:id/ai-explain', authenticateToken, requireRole('staff', 'admin'), async (req: Request, res: Response) => {
  try {
    const match = db.getMatchById(req.params.id);
    if (!match) {
      res.status(404).json({ success: false, error: 'Match not found' });
      return;
    }

    const lost = db.getLostReportById(match.lost_report_id);
    const found = db.getFoundReportById(match.found_report_id);

    if (!lost || !found) {
      res.status(404).json({ success: false, error: 'Associated reports missing' });
      return;
    }

    const deterministic = MatchingService.compareReports(lost, found);
    const aiExplanation = await MatchingService.analyzeWithAI(lost, found, deterministic);

    const updated = db.updateMatch(match.id, {
      explanation: aiExplanation,
    });

    AuditService.logAction({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'MATCH_AI_ANALYSIS',
      entityType: 'match',
      entityId: match.id,
      details: { model: 'gemini-3.8-flash' },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      explanation: aiExplanation,
      match: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/matches/batch-run - Staff re-runs full matrix matching
matchRouter.post('/batch-run', authenticateToken, requireRole('staff', 'admin'), async (req: Request, res: Response) => {
  try {
    const lostReports = db.getLostReports().filter((l) => l.status !== 'recovered_and_closed' && l.status !== 'closed_unrecovered');
    const foundReports = db.getFoundReports().filter((f) => f.status !== 'released_to_owner' && f.status !== 'closed');

    let newMatchesCreated = 0;
    const now = new Date().toISOString();

    for (const lost of lostReports) {
      for (const found of foundReports) {
        const result = MatchingService.compareReports(lost, found);
        if (result.score >= 50) {
          const existingMatches = db.getMatchesForLostReport(lost.id);
          const alreadyExists = existingMatches.some((m) => m.found_report_id === found.id);

          if (!alreadyExists) {
            const matchRecord: BagMatchRecord = {
              id: `mtch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              lost_report_id: lost.id,
              found_report_id: found.id,
              score: result.score,
              matching_factors: result.matchingFactors,
              conflicting_factors: result.conflictingFactors,
              missing_factors: result.missingFactors,
              explanation: result.deterministicExplanation,
              status: 'potential',
              created_at: now,
              updated_at: now,
            };
            db.saveMatch(matchRecord);
            newMatchesCreated++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Batch matching completed. Evaluated ${lostReports.length * foundReports.length} pairs, created ${newMatchesCreated} candidate matches.`,
      newMatchesCreated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
