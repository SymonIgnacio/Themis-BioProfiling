from flask import Blueprint, jsonify, current_app
import traceback

from db import db, User, PUPC, VisitorLog, Blacklist

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # Get user count
        user_count = User.query.count()
        
        # Get PUC count
        pupc_count = PUPC.query.count()
        
        # Get visitor logs count
        visitor_log_count = VisitorLog.query.count()
        
        # Get pending approvals count
        pending_approval_count = VisitorLog.query.filter_by(approval_status='Pending').count()
        
        # Get blacklisted count
        blacklisted_count = Blacklist.query.count()
        
        return jsonify({
            "user_count": user_count,
            "pupc_count": pupc_count,
            "visitor_log_count": visitor_log_count,
            "pending_approval_count": pending_approval_count,
            "blacklisted_count": blacklisted_count,
            "system_status": "Online"
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500