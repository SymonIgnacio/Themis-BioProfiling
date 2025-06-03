from flask import Blueprint, jsonify, request, current_app
import traceback
from sqlalchemy import text

from db import db, User, Role
from routes.auth import token_required

# Create blueprint
users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    try:
        # Check if user has permission (admin)
        if current_user.role_id != 1:  # Admin only
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get all users with role names
        query = text("""
            SELECT u.user_id, u.username, u.email, u.full_name, 
                   u.created_at, u.last_login, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            ORDER BY u.user_id
        """)
        
        result = db.session.execute(query)
        
        users = []
        for row in result:
            users.append({
                'user_id': row[0],
                'username': row[1],
                'email': row[2],
                'full_name': row[3],
                'created_at': row[4].isoformat() if row[4] else None,
                'last_login': row[5].isoformat() if row[5] else None,
                'role_name': row[6]
            })
        
        return jsonify(users)
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@users_bp.route('/approved-visitors', methods=['GET'])
@token_required
def get_approved_visitors(current_user):
    try:
        # Check if user has permission (admin)
        if current_user.role_id != 1:  # Admin only
            return jsonify({"error": "Unauthorized"}), 403
            
        # Check if approvedvisitors table exists
        check_table_query = text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'themis_db' 
            AND table_name = 'approvedvisitors'
        """)
        table_exists = db.session.execute(check_table_query).scalar() > 0
        
        if not table_exists:
            return jsonify([])
            
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
@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    try:
        # Check if user has permission (admin)
        if current_user.role_id != 1:  # Admin only
            return jsonify({"error": "Unauthorized"}), 403
            
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Don't allow deleting yourself
        if user.user_id == current_user.user_id:
            return jsonify({"error": "Cannot delete your own account"}), 400
            
        # Get visitor_id if exists
        visitor_id = user.visitor_id
        
        # Delete from approvedvisitors if exists
        if visitor_id:
            delete_approved_query = text("""
                DELETE FROM approvedvisitors
                WHERE user_id = :user_id
            """)
            db.session.execute(delete_approved_query, {"user_id": user_id})
            db.session.commit()
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500