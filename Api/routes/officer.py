from flask import Blueprint, jsonify, request, current_app
import traceback
from sqlalchemy import text
import datetime

from db import db, PUPC, Visitor, VisitorLog, User, Role
from routes.auth import token_required

# Create blueprint
officer_bp = Blueprint('officer', __name__)

@officer_bp.route('/approvals', methods=['GET'])
@token_required
def get_approvals(current_user):
    try:
        # Check if user is officer
        if current_user.role_id != 2:
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

@officer_bp.route('/blacklisted', methods=['GET'])
@token_required
def get_blacklisted(current_user):
    try:
        # Check if user is officer
        if current_user.role_id != 2:
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

@officer_bp.route('/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Check if user is officer
        if current_user.role_id != 2:
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
        
        return jsonify(stats)
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500