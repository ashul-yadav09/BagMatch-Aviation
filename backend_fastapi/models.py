import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    Index,
    JSON,
)
from sqlalchemy.orm import relationship, declarative_base
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    PASSENGER = "passenger"
    STAFF = "staff"
    ADMIN = "admin"

class LostStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    POTENTIAL_MATCH_FOUND = "potential_match_found"
    VERIFICATION_PENDING = "verification_pending"
    OWNERSHIP_VERIFIED = "ownership_verified"
    RECOVERY_ARRANGED = "recovery_arranged"
    RECOVERED_AND_CLOSED = "recovered_and_closed"
    CLOSED_UNRECOVERED = "closed_unrecovered"

class FoundStatus(str, enum.Enum):
    LOGGED = "logged"
    UNDER_REVIEW = "under_review"
    POTENTIAL_MATCH_FOUND = "potential_match_found"
    VERIFICATION_PENDING = "verification_pending"
    OWNERSHIP_VERIFIED = "ownership_verified"
    RELEASED_TO_OWNER = "released_to_owner"
    TRANSFERRED_TO_STORAGE = "transferred_to_storage"
    CLOSED = "closed"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PASSENGER, nullable=False)
    phone = Column(String(50), nullable=True)
    department = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    lost_reports = relationship("LostReportModel", back_populates="user")

class LostReportModel(Base):
    __tablename__ = "lost_reports"

    id = Column(String(36), primary_key=True, index=True)
    case_reference = Column(String(32), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    passenger_name = Column(String(255), nullable=False)
    passenger_email = Column(String(255), nullable=False)
    passenger_phone = Column(String(50), nullable=True)
    flight_number = Column(String(32), nullable=False, index=True)
    travel_date = Column(String(32), nullable=False, index=True)
    departure_airport = Column(String(10), nullable=False, index=True)
    arrival_airport = Column(String(10), nullable=False, index=True)
    last_known_location = Column(String(255), nullable=True)
    bag_category = Column(String(64), nullable=False, index=True)
    color = Column(String(64), nullable=False, index=True)
    secondary_color = Column(String(64), nullable=True)
    size = Column(String(32), nullable=False)
    brand = Column(String(100), nullable=True, index=True)
    distinguishing_features = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    photo_url = Column(String(512), nullable=True)
    status = Column(Enum(LostStatus), default=LostStatus.SUBMITTED, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("UserModel", back_populates="lost_reports")
    matches = relationship("MatchModel", back_populates="lost_report")

class FoundReportModel(Base):
    __tablename__ = "found_reports"

    id = Column(String(36), primary_key=True, index=True)
    case_reference = Column(String(32), unique=True, nullable=False, index=True)
    finder_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    finder_role = Column(Enum(UserRole), nullable=False)
    airport = Column(String(10), nullable=False, index=True)
    terminal_area = Column(String(100), nullable=False)
    found_date = Column(String(32), nullable=False, index=True)
    found_time = Column(String(32), nullable=False)
    found_location = Column(String(255), nullable=False)
    bag_category = Column(String(64), nullable=False, index=True)
    color = Column(String(64), nullable=False, index=True)
    secondary_color = Column(String(64), nullable=True)
    size = Column(String(32), nullable=False)
    brand = Column(String(100), nullable=True, index=True)
    distinguishing_features = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    photo_url = Column(String(512), nullable=True)
    status = Column(Enum(FoundStatus), default=FoundStatus.LOGGED, nullable=False, index=True)
    storage_location = Column(String(100), nullable=True)
    staff_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    matches = relationship("MatchModel", back_populates="found_report")

class MatchModel(Base):
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, index=True)
    lost_report_id = Column(String(36), ForeignKey("lost_reports.id"), nullable=False, index=True)
    found_report_id = Column(String(36), ForeignKey("found_reports.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False, index=True)
    matching_factors = Column(JSON, nullable=False)
    conflicting_factors = Column(JSON, nullable=False)
    missing_factors = Column(JSON, nullable=False)
    explanation = Column(Text, nullable=False)
    status = Column(String(32), default="potential", nullable=False)
    reviewed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_by_name = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    lost_report = relationship("LostReportModel", back_populates="matches")
    found_report = relationship("FoundReportModel", back_populates="matches")

class VerificationRequestModel(Base):
    __tablename__ = "verification_requests"

    id = Column(String(36), primary_key=True, index=True)
    match_id = Column(String(36), ForeignKey("matches.id"), nullable=False, index=True)
    lost_report_id = Column(String(36), ForeignKey("lost_reports.id"), nullable=False, index=True)
    found_report_id = Column(String(36), ForeignKey("found_reports.id"), nullable=False, index=True)
    passenger_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    requested_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    requested_by_name = Column(String(255), nullable=False)
    questions = Column(JSON, nullable=False)
    passenger_response = Column(Text, nullable=True)
    status = Column(String(32), default="pending_passenger", nullable=False)
    staff_decision_notes = Column(Text, nullable=True)
    verified_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_by_name = Column(String(255), nullable=True)
    requested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)
    decided_at = Column(DateTime, nullable=True)

class RecoveryRecordModel(Base):
    __tablename__ = "recovery_records"

    id = Column(String(36), primary_key=True, index=True)
    case_reference = Column(String(32), nullable=False, index=True)
    lost_report_id = Column(String(36), ForeignKey("lost_reports.id"), nullable=False)
    found_report_id = Column(String(36), ForeignKey("found_reports.id"), nullable=False)
    passenger_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    passenger_name = Column(String(255), nullable=False)
    verified_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    verified_by_name = Column(String(255), nullable=False)
    handover_airport = Column(String(10), nullable=False)
    handover_location = Column(String(255), nullable=False)
    id_type_verified = Column(String(100), nullable=False)
    id_reference_masked = Column(String(100), nullable=False)
    pickup_authorized_name = Column(String(255), nullable=False)
    staff_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class CaseEventModel(Base):
    __tablename__ = "case_events"

    id = Column(String(36), primary_key=True, index=True)
    report_type = Column(String(16), nullable=False)
    report_id = Column(String(36), nullable=False, index=True)
    case_reference = Column(String(32), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    performed_by_role = Column(String(32), nullable=False)
    performed_by_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    user_role = Column(String(32), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    details = Column(JSON, nullable=False)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
