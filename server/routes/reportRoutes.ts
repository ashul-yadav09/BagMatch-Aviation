import { Router, Request, Response } from 'express';
import { db } from '../db/db.ts';
import { AuditService } from '../services/auditService.ts';
import { MatchingService } from '../services/matchingService.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { LostReport, FoundReport, BagCategory, BagSize, BagMatchRecord } from '../db/types.ts';

export const reportRouter = Router();

// POST /api/v1/reports/lost - Passenger submits lost luggage report
reportRouter.post('/lost', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      flight_number,
      travel_date,
      departure_airport,
      arrival_airport,
      last_known_location,
      bag_category,
      color,
      secondary_color,
      size,
      brand,
      distinguishing_features,
      description,
      photo_url,
    } = req.body;

    // Validation
    if (!flight_number || !travel_date || !departure_airport || !arrival_airport || !bag_category || !color || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: flight number, travel date, departure airport, arrival airport, bag category, color, and description are required.',
      });
      return;
    }

    const user = db.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User account not found' });
      return;
    }

    const now = new Date().toISOString();
    const caseReference = db.generateCaseReference('lost');

    const lostReport: LostReport = {
      id: `lost_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      case_reference: caseReference,
      user_id: user.id,
      passenger_name: user.full_name,
      passenger_email: user.email,
      passenger_phone: user.phone,
      flight_number: flight_number.toUpperCase().trim(),
      travel_date,
      departure_airport: departure_airport.toUpperCase().trim(),
      arrival_airport: arrival_airport.toUpperCase().trim(),
      last_known_location: last_known_location?.trim(),
      bag_category: bag_category as BagCategory,
      color: color.trim(),
      secondary_color: secondary_color?.trim(),
      size: (size as BagSize) || 'medium',
      brand: brand?.trim(),
      distinguishing_features: distinguishing_features?.trim(),
      description: description.trim(),
      photo_url: photo_url?.trim(),
      status: 'submitted',
      created_at: now,
      updated_at: now,
    };

    db.createLostReport(lostReport);

    // Case timeline event
    AuditService.logCaseEvent({
      reportType: 'lost',
      reportId: lostReport.id,
      caseReference: lostReport.case_reference,
      eventType: 'report_submitted',
      title: 'Lost Baggage Report Filed',
      description: `Report submitted for flight ${lostReport.flight_number} (${lostReport.departure_airport} -> ${lostReport.arrival_airport}). Case reference ${lostReport.case_reference}.`,
      performedByRole: req.user!.role,
      performedByName: user.full_name,
    });

    // Audit log
    AuditService.logAction({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOST_REPORT_CREATED',
      entityType: 'lost_report',
      entityId: lostReport.id,
      details: { case_reference: lostReport.case_reference, flight: lostReport.flight_number },
      ipAddress: req.ip,
    });

    // Run matching against existing open found reports
    const foundReports = db.getFoundReports().filter((f) => f.status !== 'closed' && f.status !== 'released_to_owner');
    for (const found of foundReports) {
      const matchResult = MatchingService.compareReports(lostReport, found);
      if (matchResult.score >= 50) {
        const matchRecord: BagMatchRecord = {
          id: `mtch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          lost_report_id: lostReport.id,
          found_report_id: found.id,
          score: matchResult.score,
          matching_factors: matchResult.matchingFactors,
          conflicting_factors: matchResult.conflictingFactors,
          missing_factors: matchResult.missingFactors,
          explanation: matchResult.deterministicExplanation,
          status: 'potential',
          created_at: now,
          updated_at: now,
        };
        db.saveMatch(matchRecord);

        db.updateLostReport(lostReport.id, { status: 'potential_match_found' });

        AuditService.logCaseEvent({
          reportType: 'lost',
          reportId: lostReport.id,
          caseReference: lostReport.case_reference,
          eventType: 'potential_match_identified',
          title: 'Potential Match Candidate Detected',
          description: `Automatic matching algorithm flagged found baggage case ${found.case_reference} with ${matchResult.score}% confidence.`,
          performedByRole: 'system',
          performedByName: 'BagMatch Engine',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Lost baggage report submitted successfully.',
      report: lostReport,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to submit report' });
  }
});

// POST /api/v1/reports/found - Passenger or Staff submits found baggage
reportRouter.post('/found', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      airport,
      terminal_area,
      found_date,
      found_time,
      found_location,
      bag_category,
      color,
      secondary_color,
      size,
      brand,
      distinguishing_features,
      description,
      photo_url,
      storage_location,
      staff_notes,
    } = req.body;

    if (!airport || !found_date || !found_time || !found_location || !bag_category || !color || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: airport, date, time, location, bag category, color, and description are required.',
      });
      return;
    }

    const user = db.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const now = new Date().toISOString();
    const caseReference = db.generateCaseReference('found');

    const foundReport: FoundReport = {
      id: `fnd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      case_reference: caseReference,
      finder_id: user.id,
      finder_role: user.role,
      airport: airport.toUpperCase().trim(),
      terminal_area: terminal_area?.trim() || 'General Terminal Area',
      found_date,
      found_time,
      found_location: found_location.trim(),
      bag_category: bag_category as BagCategory,
      color: color.trim(),
      secondary_color: secondary_color?.trim(),
      size: (size as BagSize) || 'medium',
      brand: brand?.trim(),
      distinguishing_features: distinguishing_features?.trim(),
      description: description.trim(),
      photo_url: photo_url?.trim(),
      status: 'logged',
      storage_location: user.role === 'staff' ? storage_location?.trim() : undefined,
      staff_notes: user.role === 'staff' ? staff_notes?.trim() : undefined,
      created_at: now,
      updated_at: now,
    };

    db.createFoundReport(foundReport);

    AuditService.logCaseEvent({
      reportType: 'found',
      reportId: foundReport.id,
      caseReference: foundReport.case_reference,
      eventType: 'report_submitted',
      title: 'Found Baggage Logged',
      description: `Found baggage recorded at ${foundReport.airport} (${foundReport.found_location}). Securely placed into staff inspection queue.`,
      performedByRole: req.user!.role,
      performedByName: user.full_name,
    });

    AuditService.logAction({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'FOUND_REPORT_CREATED',
      entityType: 'found_report',
      entityId: foundReport.id,
      details: { case_reference: foundReport.case_reference, airport: foundReport.airport },
      ipAddress: req.ip,
    });

    // Run matching against open lost reports
    const openLostReports = db.getLostReports().filter((l) => l.status !== 'recovered_and_closed' && l.status !== 'closed_unrecovered');
    for (const lost of openLostReports) {
      const matchResult = MatchingService.compareReports(lost, foundReport);
      if (matchResult.score >= 50) {
        const matchRecord: BagMatchRecord = {
          id: `mtch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          lost_report_id: lost.id,
          found_report_id: foundReport.id,
          score: matchResult.score,
          matching_factors: matchResult.matchingFactors,
          conflicting_factors: matchResult.conflictingFactors,
          missing_factors: matchResult.missingFactors,
          explanation: matchResult.deterministicExplanation,
          status: 'potential',
          created_at: now,
          updated_at: now,
        };
        db.saveMatch(matchRecord);

        db.updateLostReport(lost.id, { status: 'potential_match_found' });
        db.updateFoundReport(foundReport.id, { status: 'potential_match_found' });

        AuditService.logCaseEvent({
          reportType: 'lost',
          reportId: lost.id,
          caseReference: lost.case_reference,
          eventType: 'potential_match_identified',
          title: 'Potential Match Candidate Detected',
          description: `Automatic matching algorithm flagged newly found bag ${foundReport.case_reference} with ${matchResult.score}% confidence.`,
          performedByRole: 'system',
          performedByName: 'BagMatch Engine',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Found baggage report submitted successfully. Handled securely by airport staff.',
      report: foundReport,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to submit report' });
  }
});

// GET /api/v1/reports/my-cases - Signed-in passenger's own cases
reportRouter.get('/my-cases', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const lostReports = db.getLostReportsByUserId(userId);
    const foundReports = db.getFoundReportsByFinderId(userId);

    // Format consolidated case list
    const cases = [
      ...lostReports.map((l) => {
        const matches = db.getMatchesForLostReport(l.id);
        const verif = db.getVerificationRequestByLostReportId(l.id);
        const recovery = db.getRecoveryRecordByLostReportId(l.id);
        return {
          id: l.id,
          case_reference: l.case_reference,
          report_type: 'lost' as const,
          category: l.bag_category,
          color: l.color,
          brand: l.brand,
          status: l.status,
          travel_date: l.travel_date,
          flight_number: l.flight_number,
          route: `${l.departure_airport} -> ${l.arrival_airport}`,
          created_at: l.created_at,
          updated_at: l.updated_at,
          match_count: matches.length,
          has_pending_verification: verif?.status === 'pending_passenger',
          is_recovered: !!recovery,
        };
      }),
      ...foundReports.map((f) => ({
        id: f.id,
        case_reference: f.case_reference,
        report_type: 'found' as const,
        category: f.bag_category,
        color: f.color,
        brand: f.brand,
        status: f.status,
        travel_date: f.found_date,
        flight_number: undefined,
        route: `${f.airport} - ${f.terminal_area}`,
        created_at: f.created_at,
        updated_at: f.updated_at,
        match_count: 0, // Keep private from finders
        has_pending_verification: false,
        is_recovered: f.status === 'released_to_owner',
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, cases });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/reports/lost/:id - View specific lost report with permissions
reportRouter.get('/lost/:id', authenticateToken, (req: Request, res: Response) => {
  const report = db.getLostReportById(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, error: 'Lost report not found' });
    return;
  }

  // Permission check: only owner or staff/admin
  if (req.user!.role === 'passenger' && report.user_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied. You can only view your own cases.' });
    return;
  }

  const events = db.getCaseEvents(report.id);
  const matches = db.getMatchesForLostReport(report.id);
  const verification = db.getVerificationRequestByLostReportId(report.id);
  const recovery = db.getRecoveryRecordByLostReportId(report.id);

  // If passenger, hide sensitive internal staff notes from matching details
  const sanitizedMatches = matches.map((m) => {
    if (req.user!.role === 'passenger') {
      return {
        id: m.id,
        score: m.score,
        status: m.status,
        matching_factors: m.matching_factors,
        missing_factors: m.missing_factors,
        explanation: m.explanation,
        created_at: m.created_at,
      };
    }
    return m;
  });

  res.json({
    success: true,
    report,
    events,
    matches: sanitizedMatches,
    verification,
    recovery,
  });
});

// GET /api/v1/reports/found/:id - View specific found report with privacy enforcement
reportRouter.get('/found/:id', authenticateToken, (req: Request, res: Response) => {
  const report = db.getFoundReportById(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, error: 'Found report not found' });
    return;
  }

  // Found reports are not visible to unrelated passengers
  if (req.user!.role === 'passenger' && report.finder_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied. Found luggage custody records are restricted to authorized airport personnel.' });
    return;
  }

  const events = db.getCaseEvents(report.id);

  // Finders do not see internal staff storage or matching notes
  if (req.user!.role === 'passenger') {
    const { staff_notes, storage_location, ...safeData } = report;
    res.json({
      success: true,
      report: safeData,
      events,
    });
    return;
  }

  const matches = db.getMatchesForFoundReport(report.id);
  res.json({
    success: true,
    report,
    events,
    matches,
  });
});

// GET /api/v1/reports/staff/all - Airport staff & Admin report directory
reportRouter.get('/staff/all', authenticateToken, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  const { type, status, query, airport } = req.query;

  let lost = db.getLostReports();
  let found = db.getFoundReports();

  if (airport && typeof airport === 'string') {
    const ap = airport.toUpperCase().trim();
    lost = lost.filter((l) => l.arrival_airport === ap || l.departure_airport === ap);
    found = found.filter((f) => f.airport === ap);
  }

  if (query && typeof query === 'string') {
    const q = query.toLowerCase().trim();
    lost = lost.filter(
      (l) =>
        l.case_reference.toLowerCase().includes(q) ||
        l.flight_number.toLowerCase().includes(q) ||
        l.passenger_name.toLowerCase().includes(q) ||
        l.brand?.toLowerCase().includes(q) ||
        l.color.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
    found = found.filter(
      (f) =>
        f.case_reference.toLowerCase().includes(q) ||
        f.airport.toLowerCase().includes(q) ||
        f.found_location.toLowerCase().includes(q) ||
        f.brand?.toLowerCase().includes(q) ||
        f.color.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }

  if (status && typeof status === 'string') {
    lost = lost.filter((l) => l.status === status);
    found = found.filter((f) => f.status === status);
  }

  if (type === 'lost') {
    res.json({ success: true, lostReports: lost, foundReports: [] });
  } else if (type === 'found') {
    res.json({ success: true, lostReports: [], foundReports: found });
  } else {
    res.json({ success: true, lostReports: lost, foundReports: found });
  }
});
