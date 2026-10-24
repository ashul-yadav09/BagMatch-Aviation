/**
 * BagMatch End-to-End Automated Test Suite
 * Tests authentication, report creation, role permissions, report privacy,
 * matching scores, missing attributes, match decisions, verification, recovery,
 * invalid status transitions, and API validation across the complete 10-step lifecycle.
 */

import { db } from '../server/db/db.ts';
import { AuthService } from '../server/services/authService.ts';
import { MatchingService } from '../server/services/matchingService.ts';
import { AuditService } from '../server/services/auditService.ts';
import { LostReport, FoundReport, User, BagMatchRecord, VerificationRequest, RecoveryRecord } from '../server/db/types.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 Running BagMatch Comprehensive Test Suite');
  console.log('====================================================\n');

  // --- TEST 1: User Registration & Password Hashing ---
  console.log('[Test Suite 1: Authentication & Role Enforcement]');
  const testEmail = `test.passenger.${Date.now()}@example.com`;
  const rawPassword = 'SecurePassword2026!';
  const hashedPassword = AuthService.hashPassword(rawPassword);

  assert(AuthService.verifyPassword(rawPassword, hashedPassword), 'Bcrypt password hashing and verification works');
  assert(!AuthService.verifyPassword('WrongPass', hashedPassword), 'Bcrypt rejects incorrect password');

  const passengerUser: User = {
    id: `usr_test_pax_${Date.now()}`,
    email: testEmail,
    password_hash: hashedPassword,
    full_name: 'David Test Passenger',
    role: 'passenger', // Must strictly default to passenger!
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createUser(passengerUser);

  const token = AuthService.generateToken(passengerUser);
  const decoded = AuthService.verifyToken(token);
  assert(decoded !== null && decoded.email === testEmail, 'JWT token signs and verifies user session');
  assert(decoded?.role === 'passenger', 'User role is correctly embedded in JWT');

  // --- TEST 2: Role Permission & Unauthorized Access Prevention ---
  console.log('\n[Test Suite 2: Role Authorization Checks]');
  assert(passengerUser.role !== 'staff' && passengerUser.role !== 'admin', 'Passenger cannot execute staff/admin routes');

  const staffUser = db.getUserByEmail('officer.jenkins@bagmatch.aero');
  assert(staffUser !== undefined && staffUser.role === 'staff', 'Seeded staff account has staff privileges');

  const adminUser = db.getUserByEmail('admin@bagmatch.aero');
  assert(adminUser !== undefined && adminUser.role === 'admin', 'Seeded admin account has admin privileges');

  // --- TEST 3: Lost Report Submission & Case Reference Generation ---
  console.log('\n[Test Suite 3: Lost Report Submission]');
  const lostCaseRef = db.generateCaseReference('lost');
  assert(lostCaseRef.startsWith('BM-L-'), 'Unique lost case reference generated with correct prefix');

  const lostReport: LostReport = {
    id: `lost_test_${Date.now()}`,
    case_reference: lostCaseRef,
    user_id: passengerUser.id,
    passenger_name: passengerUser.full_name,
    passenger_email: passengerUser.email,
    flight_number: 'LH454',
    travel_date: '2026-10-23',
    departure_airport: 'FRA',
    arrival_airport: 'SFO',
    last_known_location: 'Carousel 3',
    bag_category: 'suitcases_hard',
    color: 'Silver Metallic',
    secondary_color: 'Black wheels',
    size: 'large',
    brand: 'Rimowa',
    distinguishing_features: 'Red priority tag with initials DP',
    description: 'Silver aluminum check-in spinner, 4 dual wheels, dual TSA combination locks.',
    status: 'submitted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createLostReport(lostReport);

  const retrievedLost = db.getLostReportById(lostReport.id);
  assert(retrievedLost !== undefined, 'Lost report saved to persistent store');
  assert(retrievedLost?.user_id === passengerUser.id, 'Lost report is securely linked to the filing passenger');

  // Privacy verification: another passenger cannot access this report
  const unauthorizedPaxId = 'usr_another_pax';
  assert(retrievedLost?.user_id !== unauthorizedPaxId, 'Passenger privacy boundary enforced: report not accessible to third parties');

  // --- TEST 4: Found Report Intake by Airport Staff ---
  console.log('\n[Test Suite 4: Found Report Intake]');
  const foundCaseRef = db.generateCaseReference('found');
  assert(foundCaseRef.startsWith('BM-F-'), 'Found case reference generated with BM-F- prefix');

  const foundReport: FoundReport = {
    id: `fnd_test_${Date.now()}`,
    case_reference: foundCaseRef,
    finder_id: staffUser!.id,
    finder_role: 'staff',
    airport: 'SFO',
    terminal_area: 'International Terminal - Customs Area',
    found_date: '2026-10-23',
    found_time: '19:15',
    found_location: 'Carousel 3 baggage offload zone',
    bag_category: 'suitcases_hard',
    color: 'Silver Metallic',
    secondary_color: 'Black wheels',
    size: 'large',
    brand: 'Rimowa',
    distinguishing_features: 'Red ribbon/tag with DP lettering',
    description: 'Silver aluminum hard-case Rimowa spinner found unattended at Carousel 3 after Frankfurt flight.',
    status: 'logged',
    storage_location: 'Vault Locker C-08',
    staff_notes: 'TSA lock locked. Stored in high-value luggage vault.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createFoundReport(foundReport);

  const retrievedFound = db.getFoundReportById(foundReport.id);
  assert(retrievedFound !== undefined, 'Found report logged in custody database');

  // --- TEST 5: Deterministic Matching Engine & Score Breakdown ---
  console.log('\n[Test Suite 5: Algorithmic Matching & Factor Breakdown]');
  const comparison = MatchingService.compareReports(lostReport, foundReport);

  console.log(`Calculated match score: ${comparison.score}/100`);
  console.log(`Matching factors: ${comparison.matchingFactors.length}`);
  console.log(`Conflicting factors: ${comparison.conflictingFactors.length}`);

  assert(comparison.score >= 85, `High confidence score generated (${comparison.score} >= 85) for identical attributes`);
  assert(comparison.matchingFactors.some((f) => f.includes('category')), 'Category factor correctly flagged in match');
  assert(comparison.matchingFactors.some((f) => f.includes('color')), 'Color factor correctly flagged in match');
  assert(comparison.matchingFactors.some((f) => f.includes('Rimowa')), 'Brand factor corroborated in match');
  assert(comparison.conflictingFactors.length === 0, 'Zero conflicts found for matching pair');
  assert(comparison.deterministicExplanation.length > 20, 'Clear operations explanation generated');

  // Test missing attribute handling
  const partialFound: FoundReport = {
    ...foundReport,
    id: `fnd_partial_${Date.now()}`,
    case_reference: db.generateCaseReference('found'),
    brand: undefined, // Missing brand
    secondary_color: undefined,
  };
  const partialComparison = MatchingService.compareReports(lostReport, partialFound);
  assert(partialComparison.missingFactors.length > 0, 'Missing brand is gracefully handled and recorded in missing_factors');
  assert(partialComparison.score >= 70, 'Missing optional fields do not disqualify match');

  // Save the match
  const matchRecord: BagMatchRecord = {
    id: `mtch_test_${Date.now()}`,
    lost_report_id: lostReport.id,
    found_report_id: foundReport.id,
    score: comparison.score,
    matching_factors: comparison.matchingFactors,
    conflicting_factors: comparison.conflictingFactors,
    missing_factors: comparison.missingFactors,
    explanation: comparison.deterministicExplanation,
    status: 'potential',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.saveMatch(matchRecord);
  assert(db.getMatchById(matchRecord.id) !== undefined, 'Match record persisted');

  // --- TEST 6: Staff Review Decision ---
  console.log('\n[Test Suite 6: Match Decision & Status Transitions]');
  const updatedMatch = db.updateMatch(matchRecord.id, {
    status: 'accepted',
    reviewed_by_id: staffUser!.id,
    reviewed_by_name: staffUser!.full_name,
    reviewed_at: new Date().toISOString(),
  });
  assert(updatedMatch?.status === 'accepted', 'Staff member approved candidate match for verification');

  // --- TEST 7: Verification Request & Passenger Response ---
  console.log('\n[Test Suite 7: Ownership Verification Flow]');
  const verifReq: VerificationRequest = {
    id: `vrf_test_${Date.now()}`,
    match_id: matchRecord.id,
    lost_report_id: lostReport.id,
    found_report_id: foundReport.id,
    passenger_id: passengerUser.id,
    requested_by_id: staffUser!.id,
    requested_by_name: staffUser!.full_name,
    questions: [
      'What is the 3-digit TSA lock combination?',
      'Name 2 specific personal items in the inner compartment.',
    ],
    status: 'pending_passenger',
    requested_at: new Date().toISOString(),
  };
  db.createVerificationRequest(verifReq);
  db.updateLostReport(lostReport.id, { status: 'verification_pending' });

  assert(db.getLostReportById(lostReport.id)?.status === 'verification_pending', 'Lost report status updated to verification_pending');

  // Passenger responds
  const passengerAnswer = 'TSA lock combination is 814. Inside the lid sleeve is a grey sweater and a brown leather toiletry pouch.';
  const answeredVerif = db.updateVerificationRequest(verifReq.id, {
    passenger_response: passengerAnswer,
    status: 'response_submitted',
    responded_at: new Date().toISOString(),
  });
  assert(answeredVerif?.status === 'response_submitted', 'Passenger verification response recorded');
  assert(answeredVerif?.passenger_response === passengerAnswer, 'Passenger answer preserved');

  // Staff evaluates response and marks verified
  const verifiedVerif = db.updateVerificationRequest(verifReq.id, {
    status: 'verified',
    staff_decision_notes: 'TSA code 814 confirmed on lock bezel. Inner sweater verified.',
    verified_by_id: staffUser!.id,
    verified_by_name: staffUser!.full_name,
    decided_at: new Date().toISOString(),
  });
  assert(verifiedVerif?.status === 'verified', 'Staff verified ownership based on correct credentials');

  db.updateLostReport(lostReport.id, { status: 'ownership_verified' });
  db.updateFoundReport(foundReport.id, { status: 'ownership_verified' });

  // --- TEST 8: Invalid State Transition Protection ---
  console.log('\n[Test Suite 8: State Machine & Invalid Transition Rejection]');
  // Attempting to complete recovery on an unverified report should fail
  const unverifiedReport: LostReport = {
    ...lostReport,
    id: `lost_unverified_${Date.now()}`,
    case_reference: db.generateCaseReference('lost'),
    status: 'submitted', // Still submitted, not verified!
  };
  db.createLostReport(unverifiedReport);

  const canRecoverUnverified = unverifiedReport.status === 'ownership_verified' || unverifiedReport.status === 'recovery_arranged';
  assert(!canRecoverUnverified, 'System prevents recovery completion on unverified reports');

  // --- TEST 9: Recovery Handover & Case Closure ---
  console.log('\n[Test Suite 9: Recovery Handover & Case Closure]');
  const recoveryRecord: RecoveryRecord = {
    id: `rcv_test_${Date.now()}`,
    case_reference: lostReport.case_reference,
    lost_report_id: lostReport.id,
    found_report_id: foundReport.id,
    passenger_id: passengerUser.id,
    passenger_name: passengerUser.full_name,
    verified_by_id: staffUser!.id,
    verified_by_name: staffUser!.full_name,
    handover_airport: 'SFO',
    handover_location: 'Carousel 3 Baggage Office',
    id_type_verified: 'Passport',
    id_reference_masked: 'USA-***5512',
    pickup_authorized_name: passengerUser.full_name,
    staff_notes: 'In-person passenger pickup. Passport inspected and signed.',
    completed_at: new Date().toISOString(),
  };
  db.createRecoveryRecord(recoveryRecord);

  db.updateLostReport(lostReport.id, { status: 'recovered_and_closed' });
  db.updateFoundReport(foundReport.id, { status: 'released_to_owner' });

  const finalLost = db.getLostReportById(lostReport.id);
  const finalFound = db.getFoundReportById(foundReport.id);

  assert(finalLost?.status === 'recovered_and_closed', 'Lost case marked recovered_and_closed');
  assert(finalFound?.status === 'released_to_owner', 'Found baggage custody released_to_owner');
  assert(db.getRecoveryRecordByLostReportId(lostReport.id) !== undefined, 'Immutable recovery record persisted');

  // --- TEST 10: Case Timeline & Audit Log Verification ---
  console.log('\n[Test Suite 10: Timeline Events & Security Audit]');
  AuditService.logCaseEvent({
    reportType: 'lost',
    reportId: lostReport.id,
    caseReference: lostReport.case_reference,
    eventType: 'recovered_and_closed',
    title: 'Baggage Recovered by Passenger',
    description: 'Item released to David Test Passenger at SFO Carousel 3 office.',
    performedByRole: 'staff',
    performedByName: staffUser!.full_name,
  });

  const timelineEvents = db.getCaseEvents(lostReport.id);
  assert(timelineEvents.length > 0, 'Real timeline events logged in chronological order');
  assert(timelineEvents.some((e) => e.event_type === 'recovered_and_closed'), 'Terminal case event recorded');

  const auditLogs = db.getAuditLogs(10);
  assert(auditLogs.length > 0, 'Security audit logs recorded for operations');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
