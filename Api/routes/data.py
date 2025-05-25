from flask import Blueprint, jsonify, current_app, request
import traceback
from sqlalchemy.orm import joinedload
from sqlalchemy import func, desc, and_
import datetime

from db import db, User, PUPC, Visitor, VisitorLog, Blacklist, AuditLog, CrimeCategory, Role, CrimeType

# Create blueprint
data_bp = Blueprint('data', __name__)

@data_bp.route('/users', methods=['GET'])
def get_users():
    try:
        users = db.session.query(User, Role.name.label('role_name'))\
            .join(Role, User.role_id == Role.role_id)\
            .all()
        
        result = []
        for user, role_name in users:
            result.append({
                'user_id': user.user_id,
                'username': user.username,
                'role_id': user.role_id,
                'role_name': role_name,
                'created_at': user.created_at,
                'last_login': user.last_login
            })
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/pucs', methods=['GET'])
def get_pucs():
    try:
        # Get search parameters
        search_term = request.args.get('search', '')
        
        # Base query
        query = db.session.query(
            PUPC, 
            CrimeCategory.name.label('crime_category'),
            CrimeType.name.label('crime_type_name'),
            CrimeType.law_reference.label('law_reference'),
            CrimeType.description.label('law_description')
        ).outerjoin(
            CrimeCategory, PUPC.category_id == CrimeCategory.category_id
        ).outerjoin(
            CrimeType, PUPC.crime_id == CrimeType.crime_id
        )
        
        # Apply search filter if provided
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                db.or_(
                    PUPC.first_name.like(search_pattern),
                    PUPC.last_name.like(search_pattern),
                    PUPC.status.like(search_pattern)
                )
            )
        
        # Execute query
        pucs = query.all()
        
        result = []
        for pupc, crime_category, crime_type_name, law_reference, law_description in pucs:
            pupc_dict = {
                'pupc_id': pupc.pupc_id,
                'first_name': pupc.first_name,
                'last_name': pupc.last_name,
                'gender': pupc.gender,
                'age': pupc.age,
                'arrest_date': pupc.arrest_date,
                'release_date': pupc.release_date,
                'status': pupc.status,
                'category_id': pupc.category_id,
                'crime_category': crime_category,
                'crime_id': pupc.crime_id,
                'crime_type_name': crime_type_name,
                'law_reference': law_reference,
                'law_description': law_description,
                'mugshot_path': pupc.mugshot_path,
                'created_at': pupc.created_at
            }
            result.append(pupc_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching PUCs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/pucs/<int:pupc_id>', methods=['PUT'])
def update_puc(pupc_id):
    try:
        data = request.json
        
        # Find the PUC record
        puc = PUPC.query.get(pupc_id)
        if not puc:
            return jsonify({"error": "PUC record not found"}), 404
        
        # Update fields
        puc.first_name = data.get('first_name', puc.first_name)
        puc.last_name = data.get('last_name', puc.last_name)
        puc.gender = data.get('gender', puc.gender)
        puc.age = data.get('age', puc.age)
        puc.arrest_date = data.get('arrest_date', puc.arrest_date)
        puc.status = data.get('status', puc.status)
        puc.category_id = data.get('category_id', puc.category_id)
        puc.crime_id = data.get('crime_id', puc.crime_id)
        puc.mugshot_path = data.get('mugshot_path', puc.mugshot_path)
        
        # Handle release_date based on status
        if data.get('status') == 'Released':
            puc.release_date = data.get('release_date', puc.release_date)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'PUC record updated successfully',
            'pupc_id': puc.pupc_id
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/visitor-logs', methods=['GET'])
def get_visitor_logs():
    try:
        logs = db.session.query(
            VisitorLog,
            PUPC.first_name.label('pupc_first_name'),
            PUPC.last_name.label('pupc_last_name'),
            Visitor.first_name.label('visitor_first_name'),
            Visitor.last_name.label('visitor_last_name'),
            User.username.label('approved_by_username')
        ).join(
            PUPC, VisitorLog.pupc_id == PUPC.pupc_id
        ).join(
            Visitor, VisitorLog.visitor_id == Visitor.visitor_id
        ).outerjoin(
            User, VisitorLog.approved_by == User.user_id
        ).order_by(
            VisitorLog.created_at.desc()
        ).all()
        
        result = []
        for log, pupc_first_name, pupc_last_name, visitor_first_name, visitor_last_name, approved_by_username in logs:
            log_dict = {
                'visitor_log_id': log.visitor_log_id,
                'pupc_id': log.pupc_id,
                'visitor_id': log.visitor_id,
                'pupc_first_name': pupc_first_name,
                'pupc_last_name': pupc_last_name,
                'visitor_first_name': visitor_first_name,
                'visitor_last_name': visitor_last_name,
                'visit_time': str(log.visit_time),
                'visit_date': log.visit_date,
                'purpose': log.purpose,
                'photo_path': log.photo_path,
                'approval_status': log.approval_status,
                'approved_by': log.approved_by,
                'approved_by_username': approved_by_username,
                'created_at': log.created_at
            }
            result.append(log_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching visitor logs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/approvals', methods=['GET'])
def get_approvals():
    try:
        approvals = db.session.query(
            VisitorLog,
            PUPC.first_name.label('pupc_first_name'),
            PUPC.last_name.label('pupc_last_name'),
            Visitor.first_name.label('visitor_first_name'),
            Visitor.last_name.label('visitor_last_name')
        ).join(
            PUPC, VisitorLog.pupc_id == PUPC.pupc_id
        ).join(
            Visitor, VisitorLog.visitor_id == Visitor.visitor_id
        ).filter(
            VisitorLog.approval_status == 'Pending'
        ).order_by(
            VisitorLog.created_at.desc()
        ).all()
        
        result = []
        for approval, pupc_first_name, pupc_last_name, visitor_first_name, visitor_last_name in approvals:
            approval_dict = {
                'visitor_log_id': approval.visitor_log_id,
                'pupc_id': approval.pupc_id,
                'visitor_id': approval.visitor_id,
                'pupc_first_name': pupc_first_name,
                'pupc_last_name': pupc_last_name,
                'visitor_first_name': visitor_first_name,
                'visitor_last_name': visitor_last_name,
                'visit_time': str(approval.visit_time),
                'visit_date': approval.visit_date,
                'purpose': approval.purpose,
                'photo_path': approval.photo_path,
                'created_at': approval.created_at
            }
            result.append(approval_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching approvals: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/blacklisted', methods=['GET'])
def get_blacklisted():
    try:
        blacklisted = db.session.query(
            Blacklist,
            PUPC.first_name.label('pupc_first_name'),
            PUPC.last_name.label('pupc_last_name'),
            Visitor.first_name.label('visitor_first_name'),
            Visitor.last_name.label('visitor_last_name')
        ).outerjoin(
            PUPC, Blacklist.pupc_id == PUPC.pupc_id
        ).outerjoin(
            Visitor, Blacklist.visitor_id == Visitor.visitor_id
        ).order_by(
            Blacklist.added_at.desc()
        ).all()
        
        result = []
        for item, pupc_first_name, pupc_last_name, visitor_first_name, visitor_last_name in blacklisted:
            item_dict = {
                'black_id': item.black_id,
                'pupc_id': item.pupc_id,
                'visitor_id': item.visitor_id,
                'pupc_first_name': pupc_first_name,
                'pupc_last_name': pupc_last_name,
                'visitor_first_name': visitor_first_name,
                'visitor_last_name': visitor_last_name,
                'reason': item.reason,
                'added_at': item.added_at
            }
            result.append(item_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching blacklisted: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    try:
        logs = db.session.query(
            AuditLog,
            User.username
        ).outerjoin(
            User, AuditLog.user_id == User.user_id
        ).order_by(
            AuditLog.event_time.desc()
        ).limit(100).all()
        
        result = []
        for log, username in logs:
            log_dict = {
                'audit_id': log.audit_id,
                'user_id': log.user_id,
                'username': username,
                'event_type': log.event_type,
                'event_time': log.event_time,
                'ip_address': log.ip_address,
                'notes': log.notes
            }
            result.append(log_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching audit logs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
        
@data_bp.route('/crimetypes', methods=['GET'])
def get_crimetypes():
    try:
        crimetypes = db.session.query(
            CrimeType,
            CrimeCategory.name.label('category_name')
        ).outerjoin(
            CrimeCategory, CrimeType.category_id == CrimeCategory.category_id
        ).all()
        
        result = []
        for crimetype, category_name in crimetypes:
            crimetype_dict = {
                'crime_id': crimetype.crime_id,
                'category_id': crimetype.category_id,
                'category_name': category_name,
                'name': crimetype.name,
                'law_reference': crimetype.law_reference,
                'description': crimetype.description
            }
            result.append(crimetype_dict)
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching crime types: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
        
@data_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = db.session.query(CrimeCategory).all()
        result = []
        for category in categories:
            result.append({
                'category_id': category.category_id,
                'name': category.name
            })
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching categories: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
        
@data_bp.route('/pucs', methods=['POST'])
def create_puc():
    try:
        data = request.json
        
        # Create new PUPC record
        new_puc = PUPC(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            gender=data.get('gender'),
            age=data.get('age'),
            arrest_date=data.get('arrest_date'),
            release_date=data.get('release_date'),
            status=data.get('status'),
            category_id=data.get('category_id'),
            crime_id=data.get('crime_id'),
            mugshot_path=data.get('mugshot_path')
        )
        
        db.session.add(new_puc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'PUC record created successfully',
            'pupc_id': new_puc.pupc_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/reports/status-changes', methods=['GET'])
def get_status_changes():
    try:
        # Get recently released PUCs
        released_pucs = db.session.query(
            PUPC,
            CrimeType.name.label('crime_name')
        ).outerjoin(
            CrimeType, PUPC.crime_id == CrimeType.crime_id
        ).filter(
            PUPC.status == 'Released',
            PUPC.release_date != None
        ).order_by(
            PUPC.release_date.desc()
        ).limit(10).all()
        
        released_data = []
        for puc, crime_name in released_pucs:
            released_data.append({
                'pupc_id': puc.pupc_id,
                'name': f"{puc.first_name} {puc.last_name}",
                'crime': crime_name,
                'release_date': puc.release_date,
                'arrest_date': puc.arrest_date
            })
        
        # Get recently added PUCs
        recent_pucs = db.session.query(
            PUPC,
            CrimeType.name.label('crime_name')
        ).outerjoin(
            CrimeType, PUPC.crime_id == CrimeType.crime_id
        ).order_by(
            PUPC.created_at.desc()
        ).limit(10).all()
        
        recent_data = []
        for puc, crime_name in recent_pucs:
            recent_data.append({
                'pupc_id': puc.pupc_id,
                'name': f"{puc.first_name} {puc.last_name}",
                'crime': crime_name,
                'status': puc.status,
                'created_at': puc.created_at
            })
        
        # Get status counts
        status_counts = db.session.query(
            PUPC.status,
            func.count(PUPC.pupc_id).label('count')
        ).group_by(
            PUPC.status
        ).all()
        
        status_data = []
        for status, count in status_counts:
            status_data.append({
                'status': status or 'Unknown',
                'count': count
            })
        
        # Get crime category counts
        category_counts = db.session.query(
            CrimeCategory.name,
            func.count(PUPC.pupc_id).label('count')
        ).join(
            PUPC, PUPC.category_id == CrimeCategory.category_id
        ).group_by(
            CrimeCategory.name
        ).all()
        
        category_data = []
        for name, count in category_counts:
            category_data.append({
                'name': name,
                'count': count
            })
        
        return jsonify({
            'released_pucs': released_data,
            'recent_pucs': recent_data,
            'status_counts': status_data,
            'category_counts': category_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching report data: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500