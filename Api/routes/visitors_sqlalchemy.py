from flask import Blueprint, jsonify, request, current_app
import traceback
import datetime
import random
import string
from sqlalchemy import text

from db import db
from routes.auth import token_required, bcrypt

# Create blueprint
visitors_bp = Blueprint('visitors', __name__)

@visitors_bp.route('/pucs/<int:pupc_id>/visitors', methods=['POST'])
@token_required
def add_visitor(current_user, pupc_id):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        try:
            # Generate username and password
            first_name = data['first_name'].lower()
            last_name = data['last_name'].lower()
            base_username = f"{first_name[0]}{last_name}"[:15]
            
            # Check if username exists and append number if needed
            username_query = text("SELECT username FROM users WHERE username = :username")
            username = base_username
            counter = 1
            
            while db.session.execute(username_query, {"username": username}).fetchone():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Generate random password (limited to 20 chars for database column)
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            
            # Create visitor record first
            visitor_query = text("""
                INSERT INTO visitors (first_name, last_name, relationship_to_puc, registered_at)
                VALUES (:first_name, :last_name, :relationship, :registered_at)
            """)
            
            db.session.execute(visitor_query, {
                "first_name": data['first_name'],
                "last_name": data['last_name'],
                "relationship": data.get('relationship'),
                "registered_at": datetime.datetime.now()
            })
            db.session.commit()
            
            # Get the visitor_id
            visitor_id_query = text("SELECT LAST_INSERT_ID()")
            visitor_id = db.session.execute(visitor_id_query).scalar()
            current_app.logger.info(f"Created new visitor with ID: {visitor_id}")
            
            # Verify visitor exists and is valid
            if not visitor_id or visitor_id == 0:
                raise Exception("Failed to create or retrieve a valid visitor ID")
                
            verify_visitor_query = text("SELECT * FROM visitors WHERE visitor_id = :visitor_id")
            visitor_exists = db.session.execute(verify_visitor_query, {"visitor_id": visitor_id}).fetchone()
            
            if not visitor_exists:
                raise Exception(f"Visitor with ID {visitor_id} does not exist")
            
            # Create user account
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            full_name = f"{data['first_name']} {data['last_name']}"
            
            user_query = text("""
                INSERT INTO users (username, password_hash, role_id, email, full_name, visitor_id, created_at)
                VALUES (:username, :password_hash, :role_id, :email, :full_name, :visitor_id, :created_at)
            """)
            
            db.session.execute(user_query, {
                "username": username,
                "password_hash": hashed_password,
                "role_id": 3,
                "email": data.get('email'),
                "full_name": full_name,
                "visitor_id": visitor_id,
                "created_at": datetime.datetime.now()
            })
            db.session.commit()
            
            # Get the user_id
            user_id_query = text("SELECT LAST_INSERT_ID()")
            user_id = db.session.execute(user_id_query).scalar()
            current_app.logger.info(f"Created user with ID: {user_id}")
            
            # Log the values being inserted
            current_app.logger.info(f"Relationship: {data.get('relationship')}, Email: {data.get('email')}, Phone: {data.get('phone')}")
            
            # Create approved visitor record
            approved_query = text("""
                INSERT INTO approvedvisitors (
                    pupc_id, first_name, last_name, relationship, email, phone, 
                    visitor_id, user_id, username, password, account_created, created_at
                ) VALUES (
                    :pupc_id, :first_name, :last_name, :relationship, :email, :phone,
                    :visitor_id, :user_id, :username, :password, TRUE, NOW()
                )
            """)
            
            # Ensure password is truncated to fit in the database column (VARCHAR(20))
            truncated_password = password[:20] if password else None
            
            db.session.execute(approved_query, {
                "pupc_id": pupc_id,
                "first_name": data['first_name'],
                "last_name": data['last_name'],
                "relationship": data.get('relationship'),
                "email": data.get('email'),
                "phone": data.get('phone'),
                "visitor_id": visitor_id,
                "user_id": user_id,
                "username": username,
                "password": truncated_password
            })
            db.session.commit()
            
            # Get the approval_id
            approval_id_query = text("SELECT LAST_INSERT_ID()")
            approval_id = db.session.execute(approval_id_query).scalar()
            current_app.logger.info(f"Created approved visitor with ID: {approval_id}")
            
            return jsonify({
                'approval_id': approval_id,
                'visitor_id': visitor_id,
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'relationship': data.get('relationship'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'username': username,
                'password': truncated_password,
                'message': 'Visitor added and account created'
            })
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(e)}")
            return jsonify({"error": f"Database error: {str(e)}"}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error adding visitor: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@visitors_bp.route('/approved-visitors', methods=['GET'])
@token_required
def get_approved_visitors(current_user):
    try:
        # Check if user has permission (admin)
        if current_user.role_id != 1:  # Admin only
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get all approved visitors
        query = text("""
            SELECT av.approval_id, av.pupc_id, av.first_name, av.last_name, 
                   av.relationship, av.email, av.phone, av.visitor_id, 
                   av.user_id, av.username, av.created_at
            FROM approvedvisitors av
            ORDER BY av.approval_id
        """)
        
        result = db.session.execute(query)
        
        visitors = []
        for row in result:
            visitors.append({
                'approval_id': row[0],
                'pupc_id': row[1],
                'first_name': row[2],
                'last_name': row[3],
                'relationship': row[4],
                'email': row[5],
                'phone': row[6],
                'visitor_id': row[7],
                'user_id': row[8],
                'username': row[9],
                'created_at': row[10].isoformat() if row[10] else None,
                'full_name': f"{row[2]} {row[3]}",
                'role_name': 'Approved Visitor'
            })
        
        return jsonify(visitors)
    except Exception as e:
        current_app.logger.error(f"Error fetching approved visitors: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500