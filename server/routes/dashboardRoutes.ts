import { Router, Request, Response } from 'express';
import { db } from '../db/db.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';

export const dashboardRouter = Router();

// GET /api/v1/dashboard/stats - Operational statistics
dashboardRouter.get('/stats', authenticateToken, requireRole('staff', 'admin'), (_req: Request, res: Response) => {
  const lost = db.getLostReports();
  const found = db.getFoundReports();
  const matches = db.getMatches();
  const verifications = db.getVerificationRequests();
  const recoveries = db.getRecoveryRecords();

  const openLostCount = lost.filter(
    (l) => l.status !== 'recovered_and_closed' && l.status !== 'closed_unrecovered'
  ).length;

  const foundAwaitingReview = found.filter(
    (f) => f.status === 'logged' || f.status === 'under_review'
  ).length;

  const matchesAwaitingReview = matches.filter((m) => m.status === 'potential').length;

  const verificationsPending = verifications.filter(
    (v) => v.status === 'pending_passenger' || v.status === 'response_submitted'
  ).length;

  const recoveredCount = recoveries.length;

  // Recent 10 audit logs and recent case events
  const recentAudit = db.getAuditLogs(15);
  const allEvents = db.getUsers().length > 0
    ? db.getAuditLogs(20).map((a) => ({
        id: a.id,
        action: a.action,
        user: a.user_email,
        role: a.user_role,
        entity: a.entity_type,
        details: a.details,
        timestamp: a.created_at,
      }))
    : [];

  res.json({
    success: true,
    stats: {
      openLostCount,
      foundAwaitingReview,
      matchesAwaitingReview,
      verificationsPending,
      recoveredCount,
      totalLostReports: lost.length,
      totalFoundReports: found.length,
      totalMatches: matches.length,
      recoveryRate: lost.length > 0 ? Math.round((recoveredCount / lost.length) * 100) : 0,
    },
    recentActivity: recentAudit,
    activityFeed: allEvents,
  });
});

// GET /api/v1/dashboard/audit-logs - Audit trail
dashboardRouter.get('/audit-logs', authenticateToken, requireRole('admin', 'staff'), (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = db.getAuditLogs(limit);
  res.json({ success: true, logs });
});
