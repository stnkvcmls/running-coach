from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    Float,
    Text,
    Boolean,
    DateTime,
    Date,
    String,
    UniqueConstraint,
)

from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    garmin_id = Column(BigInteger, unique=True, nullable=False, index=True)
    activity_type = Column(Text)
    name = Column(Text)
    started_at = Column(DateTime, index=True)
    duration_sec = Column(Float)
    distance_m = Column(Float)
    avg_hr = Column(Integer)
    max_hr = Column(Integer)
    avg_pace_min_km = Column(Float)
    calories = Column(Float)
    elevation_gain = Column(Float)
    elevation_loss = Column(Float)
    avg_cadence = Column(Float)
    avg_stride = Column(Float)
    training_effect_aerobic = Column(Float)
    training_effect_anaerobic = Column(Float)
    vo2max = Column(Float)
    avg_power = Column(Float)
    laps_json = Column(Text)
    splits_json = Column(Text)
    hr_zones_json = Column(Text)
    weather_json = Column(Text)
    raw_json = Column(Text)
    synced_at = Column(DateTime, default=datetime.utcnow)
    ai_analyzed = Column(Boolean, default=False)


class DailySummary(Base):
    __tablename__ = "daily_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    steps = Column(Integer)
    total_calories = Column(Integer)
    active_calories = Column(Integer)
    resting_hr = Column(Integer)
    max_hr = Column(Integer)
    stress_avg = Column(Integer)
    sleep_seconds = Column(Integer)
    sleep_score = Column(Float)
    body_battery_high = Column(Integer)
    body_battery_low = Column(Integer)
    intensity_minutes = Column(Integer)
    floors_climbed = Column(Integer)
    raw_json = Column(Text)
    synced_at = Column(DateTime, default=datetime.utcnow)
    ai_analyzed = Column(Boolean, default=False)


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    trigger_type = Column(Text)  # activity, daily_summary, weekly_review
    trigger_id = Column(Integer, nullable=True)
    content = Column(Text)
    summary = Column(Text)
    category = Column(Text)  # workout_analysis, recovery, training_plan, trend, recommendation


class Race(Base):
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    date = Column(Date, nullable=False, index=True)
    distance_m = Column(Float)
    distance_label = Column(Text)  # 5K, 10K, Half Marathon, Marathon, custom
    goal_time_sec = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SyncStatus(Base):
    __tablename__ = "sync_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
