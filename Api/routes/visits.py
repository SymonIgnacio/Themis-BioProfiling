from flask import Blueprint, jsonify, request, current_app
from flask_bcrypt import Bcrypt
import traceback
from sqlalchemy import desc

from db import db, PUPC, Visitor, VisitorLog, User
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