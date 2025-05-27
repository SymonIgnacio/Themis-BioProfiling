from flask import Blueprint, jsonify, request, current_app
from flask_bcrypt import Bcrypt
import traceback
from sqlalchemy import desc
import datetime

from db import db, PUPC, Visitor, VisitorLog, User, AuditLog
from routes.auth import token_required

# Create blueprint
visits_bp = Blueprint('visits', __name__)

@visits_bp.route('/my-visits', methods=['GET'])
@token_required
def get_my_visits(current_user):
    try:
        visitor_id = request.args.get('visitor_id')
        status = request.args.get('status')
        
        if not visitor_id:
            return jsonify({"error": "visitor_id is required"}), 400
        
        # Base query
        query = db.session.query(
            VisitorLog,
            PUPC.first_name.label('pupc_first_name'),
            PUPC.last_name.label('pupc_last_name')
        ).join(
            PUPC, VisitorLog.pupc_id == PUPC.pupc_id
        ).filter(
            VisitorLog.visitor_id == visitor_id
        )
        
        # Filter by status if provided
        if status:
            query = query.filter(VisitorLog.approval_status == status)
        
        # Order by most recent first
        query = query.order_by(desc(VisitorLog.created_at))
        
        # Execute query
        visits = query.all()
        
        result = []
        for visit, pupc_first_name, pupc_last_name in visits:
            visit_dict = {
                'visitor_log_id': visit.visitor_log_id,
                'pupc_id': visit.pupc_id,
                'visitor_id': visit.visitor_id,
                'pupc_first_name': pupc_first_name,
                'pupc_last_name': pupc_last_name,
                'visit_time': str(visit.visit_time),
                'visit_date': visit.visit_date,
                'purpose': visit.purpose,
                'approval_status': visit.approval_status,
                'created_at': visit.created_at
            }
            result.append(visit_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching visits: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@visits_bp.route('/visit-requests', methods=['POST'])
@token_required
def create_visit_request(current_user):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['pupc_id', 'visitor_id', 'visit_date', 'visit_time', 'purpose']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create new visit request
        new_visit = VisitorLog(
            pupc_id=data['pupc_id'],
            visitor_id=data['visitor_id'],
            visit_date=data['visit_date'],
            visit_time=data['visit_time'],
            purpose=data['purpose'],
            approval_status='Pending'
        )
        
        db.session.add(new_visit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Visit request created successfully',
            'visitor_log_id': new_visit.visitor_log_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating visit request: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@visits_bp.route('/visitor-logs/<int:log_id>/approve', methods=['PUT'])
@token_required
def approve_visit(current_user, log_id):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        # Find the visitor log
        visit_log = VisitorLog.query.get(log_id)
        if not visit_log:
            return jsonify({"error": "Visit log not found"}), 404
            
        # Update status
        visit_log.approval_status = 'Approved'
        visit_log.approved_by = current_user.user_id
        visit_log.approval_date = datetime.datetime.now()
        
        # Create audit log
        audit = AuditLog(
            user_id=current_user.user_id,
            event_type='Visit Approval',
            notes=f'Approved visit request #{log_id}',
            ip_address=request.remote_addr
        )
        
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Visit request approved successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving visit: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@visits_bp.route('/visitor-logs/<int:log_id>/reject', methods=['PUT'])
@token_required
def reject_visit(current_user, log_id):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        # Find the visitor log
        visit_log = VisitorLog.query.get(log_id)
        if not visit_log:
            return jsonify({"error": "Visit log not found"}), 404
            
        # Update status
        visit_log.approval_status = 'Rejected'
        visit_log.approved_by = current_user.user_id
        visit_log.approval_date = datetime.datetime.now()
        
        # Create audit log
        audit = AuditLog(
            user_id=current_user.user_id,
            event_type='Visit Rejection',
            notes=f'Rejected visit request #{log_id}',
            ip_address=request.remote_addr
        )
        
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Visit request rejected successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting visit: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
@visits_bp.route('/visitor-logs/stats', methods=['GET'])
@token_required
def get_visitor_stats(current_user):
    try:
        # Get counts for different approval statuses
        approved_count = db.session.query(db.func.count(VisitorLog.visitor_log_id)).filter(
            VisitorLog.approval_status == 'Approved'
        ).scalar() or 0
        
        pending_count = db.session.query(db.func.count(VisitorLog.visitor_log_id)).filter(
            VisitorLog.approval_status == 'Pending'
        ).scalar() or 0
        
        rejected_count = db.session.query(db.func.count(VisitorLog.visitor_log_id)).filter(
            VisitorLog.approval_status == 'Rejected'
        ).scalar() or 0
        
        # Get recent visits (last 10)
        recent_visits_query = db.session.query(
            VisitorLog,
            Visitor.first_name.label('visitor_first_name'),
            Visitor.last_name.label('visitor_last_name'),
            PUPC.first_name.label('pupc_first_name'),
            PUPC.last_name.label('pupc_last_name')
        ).join(
            Visitor, VisitorLog.visitor_id == Visitor.visitor_id
        ).join(
            PUPC, VisitorLog.pupc_id == PUPC.pupc_id
        ).order_by(
            desc(VisitorLog.created_at)
        ).limit(10)
        
        recent_visits = []
        for log, v_first, v_last, p_first, p_last in recent_visits_query:
            recent_visits.append({
                'visitor_log_id': log.visitor_log_id,
                'visitor_name': f"{v_first} {v_last}",
                'pupc_name': f"{p_first} {p_last}",
                'visit_date': log.visit_date,
                'approval_status': log.approval_status
            })
        
        return jsonify({
            'approved': approved_count,
            'pending': pending_count,
            'rejected': rejected_count,
            'recent_visits': recent_visits
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching visitor stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500