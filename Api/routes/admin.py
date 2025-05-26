from flask import Blueprint, jsonify, request, current_app
import traceback
from sqlalchemy import text
import datetime

from db import db, PUPC, Visitor, VisitorLog, User, Role
from routes.auth import token_required

# Create blueprint
admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/visitor-logs', methods=['GET'])
@token_required
def get_visitor_logs_admin(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get all visitor logs with PUC and visitor names
        query = """
        SELECT vl.visitor_log_id, vl.pupc_id, vl.visitor_id, 
               p.first_name as pupc_first_name, p.last_name as pupc_last_name,
               v.first_name as visitor_first_name, v.last_name as visitor_last_name,
               vl.visit_time, vl.visit_date, vl.purpose, vl.approval_status, vl.created_at
        FROM visitorlogs vl
        JOIN pupcs p ON vl.pupc_id = p.pupc_id
        JOIN visitors v ON vl.visitor_id = v.visitor_id
        ORDER BY vl.created_at DESC
        """
        
        result = db.session.execute(text(query))
        
        logs = []
        for row in result:
            logs.append({
                'visitor_log_id': row[0],
                'pupc_id': row[1],
                'visitor_id': row[2],
                'pupc_first_name': row[3],
                'pupc_last_name': row[4],
                'visitor_first_name': row[5],
                'visitor_last_name': row[6],
                'visit_time': str(row[7]),
                'visit_date': row[8].isoformat() if row[8] else None,
                'purpose': row[9],
                'approval_status': row[10],
                'created_at': row[11].isoformat() if row[11] else None
            })
        
        return jsonify(logs)
    except Exception as e:
        current_app.logger.error(f"Error fetching visitor logs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get all users with role names
        query = """
        SELECT u.user_id, u.username, u.role_id, r.name as role_name,
               u.email, u.full_name, u.created_at, u.last_login
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        ORDER BY u.user_id
        """
        
        result = db.session.execute(text(query))
        
        users = []
        for row in result:
            users.append({
                'user_id': row[0],
                'username': row[1],
                'role_id': row[2],
                'role_name': row[3],
                'email': row[4],
                'full_name': row[5],
                'created_at': row[6].isoformat() if row[6] else None,
                'last_login': row[7].isoformat() if row[7] else None
            })
            
        return jsonify(users)
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/approvals', methods=['GET'])
@token_required
def get_approvals(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get pending visitor logs
        query = """
        SELECT vl.visitor_log_id, vl.pupc_id, vl.visitor_id, 
               p.first_name as pupc_first_name, p.last_name as pupc_last_name,
               v.first_name as visitor_first_name, v.last_name as visitor_last_name,
               vl.visit_time, vl.visit_date, vl.purpose, vl.created_at
        FROM visitorlogs vl
        JOIN pupcs p ON vl.pupc_id = p.pupc_id
        JOIN visitors v ON vl.visitor_id = v.visitor_id
        WHERE vl.approval_status = 'Pending'
        ORDER BY vl.created_at DESC
        """
        
        result = db.session.execute(text(query))
        
        approvals = []
        for row in result:
            approvals.append({
                'visitor_log_id': row[0],
                'pupc_id': row[1],
                'visitor_id': row[2],
                'pupc_first_name': row[3],
                'pupc_last_name': row[4],
                'visitor_first_name': row[5],
                'visitor_last_name': row[6],
                'visit_time': str(row[7]),
                'visit_date': row[8].isoformat() if row[8] else None,
                'purpose': row[9],
                'created_at': row[10].isoformat() if row[10] else None
            })
        
        return jsonify(approvals)
    except Exception as e:
        current_app.logger.error(f"Error fetching approvals: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/blacklisted', methods=['GET'])
@token_required
def get_blacklisted(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get blacklisted visitors
        query = """
        SELECT b.black_id, b.pupc_id, b.visitor_id, 
               p.first_name as pupc_first_name, p.last_name as pupc_last_name,
               v.first_name as visitor_first_name, v.last_name as visitor_last_name,
               b.reason, b.added_at
        FROM blacklist b
        LEFT JOIN pupcs p ON b.pupc_id = p.pupc_id
        JOIN visitors v ON b.visitor_id = v.visitor_id
        ORDER BY b.added_at DESC
        """
        
        result = db.session.execute(text(query))
        
        blacklisted = []
        for row in result:
            blacklisted.append({
                'black_id': row[0],
                'pupc_id': row[1],
                'visitor_id': row[2],
                'pupc_first_name': row[3] or "N/A",
                'pupc_last_name': row[4] or "",
                'visitor_first_name': row[5],
                'visitor_last_name': row[6],
                'reason': row[7],
                'added_at': row[8].isoformat() if row[8] else None
            })
        
        return jsonify(blacklisted)
    except Exception as e:
        current_app.logger.error(f"Error fetching blacklisted visitors: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/audit-logs', methods=['GET'])
@token_required
def get_audit_logs(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get audit logs
        query = """
        SELECT a.audit_id, a.user_id, u.username, a.event_type, 
               a.event_time, a.ip_address, a.notes
        FROM auditlogs a
        LEFT JOIN users u ON a.user_id = u.user_id
        ORDER BY a.event_time DESC
        """
        
        result = db.session.execute(text(query))
        
        logs = []
        for row in result:
            logs.append({
                'audit_id': row[0],
                'user_id': row[1],
                'username': row[2] or "System",
                'event_type': row[3],
                'event_time': row[4].isoformat() if row[4] else None,
                'ip_address': row[5],
                'notes': row[6]
            })
        
        return jsonify(logs)
    except Exception as e:
        current_app.logger.error(f"Error fetching audit logs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get counts from various tables
        stats = {}
        
        # Count PUCs
        pucs_count = db.session.execute(text("SELECT COUNT(*) FROM pupcs")).scalar()
        stats['pucs_count'] = pucs_count
        
        # Count visitors
        visitors_count = db.session.execute(text("SELECT COUNT(*) FROM visitors")).scalar()
        stats['visitors_count'] = visitors_count
        
        # Count pending approvals
        pending_count = db.session.execute(text("SELECT COUNT(*) FROM visitorlogs WHERE approval_status = 'Pending'")).scalar()
        stats['pending_count'] = pending_count
        
        # Count visits today
        today = datetime.datetime.now().date()
        today_visits = db.session.execute(
            text("SELECT COUNT(*) FROM visitorlogs WHERE DATE(visit_date) = :today"),
            {"today": today}
        ).scalar()
        stats['today_visits'] = today_visits
        
        # Count users by role
        users_by_role = db.session.execute(text("""
            SELECT r.name, COUNT(u.user_id) 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            GROUP BY r.name
        """))
        
        role_counts = {}
        for row in users_by_role:
            role_counts[row[0]] = row[1]
        
        stats['users_by_role'] = role_counts
        
        return jsonify(stats)
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/reports/status-changes', methods=['GET'])
@token_required
def get_status_changes(current_user):
    try:
        # Check if user is admin
        if current_user.role_id != 1:
            return jsonify({"error": "Unauthorized"}), 403
            
        # Get PUC status counts
        status_query = """
        SELECT status, COUNT(*) as count
        FROM pupcs
        GROUP BY status
        ORDER BY count DESC
        """
        
        status_result = db.session.execute(text(status_query))
        status_counts = [{"status": row[0] or "Unknown", "count": row[1]} for row in status_result]
        
        # Get crime category counts
        category_query = """
        SELECT cc.name, COUNT(*) as count
        FROM pupcs p
        JOIN crimecategories cc ON p.category_id = cc.category_id
        GROUP BY cc.name
        ORDER BY count DESC
        """
        
        category_result = db.session.execute(text(category_query))
        category_counts = [{"name": row[0], "count": row[1]} for row in category_result]
        
        # Get recently released PUCs
        released_query = """
        SELECT 
            CONCAT(p.first_name, ' ', p.last_name) as name,
            ct.name as crime,
            p.release_date,
            p.arrest_date
        FROM pupcs p
        LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
        WHERE p.release_date IS NOT NULL
        ORDER BY p.release_date DESC
        LIMIT 5
        """
        
        released_result = db.session.execute(text(released_query))
        released_pucs = []
        for row in released_result:
            released_pucs.append({
                "name": row[0],
                "crime": row[1],
                "release_date": row[2].isoformat() if row[2] else None,
                "arrest_date": row[3].isoformat() if row[3] else None
            })
        
        # Get recently added PUCs
        recent_query = """
        SELECT 
            CONCAT(p.first_name, ' ', p.last_name) as name,
            ct.name as crime,
            p.status,
            p.created_at
        FROM pupcs p
        LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
        ORDER BY p.created_at DESC
        LIMIT 5
        """
        
        recent_result = db.session.execute(text(recent_query))
        recent_pucs = []
        for row in recent_result:
            recent_pucs.append({
                "name": row[0],
                "crime": row[1],
                "status": row[2],
                "created_at": row[3].isoformat() if row[3] else None
            })
        
        # Combine all data
        report_data = {
            "status_counts": status_counts,
            "category_counts": category_counts,
            "released_pucs": released_pucs,
            "recent_pucs": recent_pucs
        }
        
        return jsonify(report_data)
    except Exception as e:
        current_app.logger.error(f"Error generating reports: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500