from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    department: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LostReportCreate(BaseModel):
    flight_number: str
    travel_date: str
    departure_airport: str
    arrival_airport: str
    last_known_location: Optional[str] = None
    bag_category: str
    color: str
    secondary_color: Optional[str] = None
    size: str
    brand: Optional[str] = None
    distinguishing_features: Optional[str] = None
    description: str
    photo_url: Optional[str] = None

class FoundReportCreate(BaseModel):
    airport: str
    terminal_area: str
    found_date: str
    found_time: str
    found_location: str
    bag_category: str
    color: str
    secondary_color: Optional[str] = None
    size: str
    brand: Optional[str] = None
    distinguishing_features: Optional[str] = None
    description: str
    photo_url: Optional[str] = None
    storage_location: Optional[str] = None
    staff_notes: Optional[str] = None

class VerificationCreate(BaseModel):
    match_id: str
    questions: List[str]

class VerificationResponseSubmit(BaseModel):
    response: str

class RecoveryCompleteCreate(BaseModel):
    lost_report_id: str
    found_report_id: str
    handover_airport: str
    handover_location: str
    id_type_verified: str
    id_reference_masked: Optional[str] = None
    pickup_authorized_name: str
    staff_notes: Optional[str] = None
