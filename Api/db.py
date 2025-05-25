from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect
import datetime

# Initialize SQLAlchemy instance
db = SQLAlchemy()

# User model
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    full_name = db.Column(db.String(100), nullable=True)
    pin_hash = db.Column(db.String(60), nullable=True)
    face_template = db.Column(db.LargeBinary, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

# Role model
class Role(db.Model):
    __tablename__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)

# PUPC model
class PUPC(db.Model):
    __tablename__ = 'pupcs'
    pupc_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    gender = db.Column(db.String(10), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    arrest_date = db.Column(db.Date, nullable=True)
    release_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=True)
    category_id = db.Column(db.Integer, nullable=True)
    mugshot_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    crime_id = db.Column(db.Integer, nullable=True)

# Visitor model
class Visitor(db.Model):
    __tablename__ = 'visitors'
    visitor_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    relationship_to_puc = db.Column(db.String(100), nullable=True)
    photo_path = db.Column(db.String(255), nullable=True)
    registered_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

# VisitorLog model
class VisitorLog(db.Model):
    __tablename__ = 'visitorlogs'
    visitor_log_id = db.Column(db.Integer, primary_key=True)
    pupc_id = db.Column(db.Integer, nullable=False)
    visitor_id = db.Column(db.Integer, nullable=False)
    visit_time = db.Column(db.Time, nullable=False)
    visit_date = db.Column(db.Date, nullable=False)
    purpose = db.Column(db.String(255), nullable=True)
    photo_path = db.Column(db.String(255), nullable=True)
    approval_status = db.Column(db.String(20), nullable=False, default='Pending')
    approved_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

# Blacklist model
class Blacklist(db.Model):
    __tablename__ = 'blacklist'
    black_id = db.Column(db.Integer, primary_key=True)
    pupc_id = db.Column(db.Integer, nullable=True)
    visitor_id = db.Column(db.Integer, nullable=True)
    reason = db.Column(db.String(255), nullable=True)
    added_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

# AuditLog model
class AuditLog(db.Model):
    __tablename__ = 'auditlogs'
    audit_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    event_type = db.Column(db.String(50), nullable=True)
    event_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    ip_address = db.Column(db.String(45), nullable=True)
    notes = db.Column(db.Text, nullable=True)

# CrimeCategory model
class CrimeCategory(db.Model):
    __tablename__ = 'crimecategories'
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

# CrimeType model
class CrimeType(db.Model):
    __tablename__ = 'crimetypes'
    crime_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, nullable=True)
    name = db.Column(db.String(100), nullable=False)
    law_reference = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)

def init_db(app):
    """Initialize the database with the Flask app"""
    db.init_app(app)
    with app.app_context():
        db.create_all()
    return db