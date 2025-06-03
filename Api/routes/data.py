from flask import Blueprint, jsonify, request, current_app
import traceback
from sqlalchemy import desc, text
import datetime

from db import db, PUPC, Visitor, VisitorLog, User, CrimeType
from routes.auth import token_required

# Create blueprint
data_bp = Blueprint('data', __name__)

@data_bp.route('/pucs', methods=['GET'])
@token_required
def get_pucs(current_user):
    try:
        # Get all PUCs with crime type and category information
        query = """
        SELECT p.pupc_id, p.first_name, p.last_name, p.gender, p.age, 
               p.arrest_date, p.release_date, p.status, p.category_id, 
               p.mugshot_path, p.created_at, p.crime_id,
               ct.name as crime_type_name, ct.law_reference, ct.description,
               cc.name as crime_category
        FROM pupcs p
        LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
        LEFT JOIN crimecategories cc ON p.category_id = cc.category_id
        """
        
        result = db.session.execute(text(query))
        
        pucs = []
        for row in result:
            pucs.append({
                'pupc_id': row[0],
                'first_name': row[1],
                'last_name': row[2],
                'gender': row[3],
                'age': row[4],
                'arrest_date': row[5].isoformat() if row[5] else None,
                'release_date': row[6].isoformat() if row[6] else None,
                'status': row[7],
                'category_id': row[8],
                'mugshot_path': row[9],
                'created_at': row[10].isoformat() if row[10] else None,
                'crime_id': row[11],
                'crime_type_name': row[12],
                'law_reference': row[13],
                'description': row[14],
                'crime_category': row[15]
            })
        
        return jsonify(pucs)
    except Exception as e:
        current_app.logger.error(f"Error fetching PUCs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/pucs', methods=['POST'])
@token_required
def create_puc(current_user):
    try:
        # Check if user is admin or officer
        if current_user.role_id not in [1, 2]:  # 1=Admin, 2=Officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create new PUC record
        new_puc = PUPC(
            first_name=data['first_name'],
            last_name=data['last_name'],
            gender=data.get('gender'),
            age=data.get('age'),
            arrest_date=data.get('arrest_date'),
            release_date=data.get('release_date'),
            status=data.get('status', 'Pending'),
            category_id=data.get('category_id'),
            mugshot_path=data.get('mugshot_path'),
            crime_id=data.get('crime_id'),
            created_at=datetime.datetime.utcnow()
        )
        
        db.session.add(new_puc)
        db.session.commit()
        
        # Return the created PUC with all fields
        return jsonify({
            'pupc_id': new_puc.pupc_id,
            'first_name': new_puc.first_name,
            'last_name': new_puc.last_name,
            'gender': new_puc.gender,
            'age': new_puc.age,
            'arrest_date': new_puc.arrest_date.isoformat() if new_puc.arrest_date else None,
            'release_date': new_puc.release_date.isoformat() if new_puc.release_date else None,
            'status': new_puc.status,
            'category_id': new_puc.category_id,
            'mugshot_path': new_puc.mugshot_path,
            'created_at': new_puc.created_at.isoformat() if new_puc.created_at else None,
            'crime_id': new_puc.crime_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/pucs/<int:pupc_id>', methods=['PUT'])
@token_required
def update_puc(current_user, pupc_id):
    try:
        # Check if user is admin or officer
        if current_user.role_id not in [1, 2]:  # 1=Admin, 2=Officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Find the PUC record
        puc = PUPC.query.get(pupc_id)
        if not puc:
            return jsonify({"error": "PUC record not found"}), 404
        
        # Update fields
        if 'first_name' in data:
            puc.first_name = data['first_name']
        if 'last_name' in data:
            puc.last_name = data['last_name']
        if 'gender' in data:
            puc.gender = data['gender']
        if 'age' in data:
            puc.age = data['age']
        if 'arrest_date' in data:
            puc.arrest_date = data['arrest_date']
        if 'release_date' in data:
            puc.release_date = data['release_date']
        if 'status' in data:
            puc.status = data['status']
        if 'category_id' in data:
            puc.category_id = data['category_id']
        if 'mugshot_path' in data:
            puc.mugshot_path = data['mugshot_path']
        if 'crime_id' in data:
            puc.crime_id = data['crime_id']
        
        db.session.commit()
        
        # Return the updated PUC
        return jsonify({
            'pupc_id': puc.pupc_id,
            'first_name': puc.first_name,
            'last_name': puc.last_name,
            'gender': puc.gender,
            'age': puc.age,
            'arrest_date': puc.arrest_date.isoformat() if puc.arrest_date else None,
            'release_date': puc.release_date.isoformat() if puc.release_date else None,
            'status': puc.status,
            'category_id': puc.category_id,
            'mugshot_path': puc.mugshot_path,
            'created_at': puc.created_at.isoformat() if puc.created_at else None,
            'crime_id': puc.crime_id
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/visitor-logs', methods=['GET'])
@token_required
def get_visitor_logs(current_user):
    try:
        # For admin or officer users, return all visitor logs
        if current_user.role_id in [1, 2]:
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
        
        # For regular users, get visitor_id from request or user record
        visitor_id = request.args.get('visitor_id')
        
        if not visitor_id:
            # Try to get visitor_id from current user
            if hasattr(current_user, 'visitor_id') and current_user.visitor_id:
                visitor_id = current_user.visitor_id
            else:
                # Try to get visitor_id from database
                try:
                    user_record = db.session.execute(
                        text("SELECT visitor_id FROM users WHERE user_id = :user_id"),
                        {"user_id": current_user.user_id}
                    ).fetchone()
                    
                    if user_record and user_record[0]:
                        visitor_id = user_record[0]
                except:
                    pass
        
        if not visitor_id:
            return jsonify([])
        
        # Get visitor logs for specific visitor
        query = """
        SELECT vl.visitor_log_id, vl.pupc_id, vl.visitor_id, 
               p.first_name as pupc_first_name, p.last_name as pupc_last_name,
               v.first_name as visitor_first_name, v.last_name as visitor_last_name,
               vl.visit_time, vl.visit_date, vl.purpose, vl.approval_status, vl.created_at
        FROM visitorlogs vl
        JOIN pupcs p ON vl.pupc_id = p.pupc_id
        JOIN visitors v ON vl.visitor_id = v.visitor_id
        WHERE vl.visitor_id = :visitor_id
        ORDER BY vl.created_at DESC
        """
        
        result = db.session.execute(text(query), {"visitor_id": visitor_id})
        
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

@data_bp.route('/user-visits', methods=['GET'])
@token_required
def get_user_visits(current_user):
    try:
        # Get status filter if provided
        status = request.args.get('status')
        
        # Get visitor_id from current user
        visitor_id = None
        
        # If the user has a visitor_id directly
        if hasattr(current_user, 'visitor_id') and current_user.visitor_id:
            visitor_id = current_user.visitor_id
        else:
            # Try to get visitor_id from database
            try:
                user_record = db.session.execute(
                    text("SELECT visitor_id FROM users WHERE user_id = :user_id"),
                    {"user_id": current_user.user_id}
                ).fetchone()
                
                if user_record and user_record[0]:
                    visitor_id = user_record[0]
            except:
                pass
        
        if not visitor_id:
            return jsonify([])
        
        # Execute raw SQL query to get visitor logs
        query = """
        SELECT vl.visitor_log_id, vl.pupc_id, vl.visitor_id, 
               p.first_name, p.last_name, vl.visit_time, 
               vl.visit_date, vl.purpose, vl.approval_status, vl.created_at
        FROM visitorlogs vl
        JOIN pupcs p ON vl.pupc_id = p.pupc_id
        WHERE vl.visitor_id = :visitor_id
        """
        
        # Add status filter if provided
        if status:
            query += " AND vl.approval_status = :status"
            params = {"visitor_id": visitor_id, "status": status}
        else:
            params = {"visitor_id": visitor_id}
        
        # Add order by
        query += " ORDER BY vl.created_at DESC"
        
        # Execute query
        result = db.session.execute(text(query), params)
        
        # Format results
        visits = []
        for row in result:
            visits.append({
                'visitor_log_id': row[0],
                'pupc_id': row[1],
                'visitor_id': row[2],
                'pupc_name': f"{row[3]} {row[4]}",
                'visit_time': str(row[5]),
                'visit_date': row[6].isoformat() if row[6] else None,
                'purpose': row[7],
                'approval_status': row[8],
                'created_at': row[9].isoformat() if row[9] else None
            })
        
        return jsonify(visits)
    except Exception as e:
        current_app.logger.error(f"Error fetching visitor logs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/create-visit', methods=['POST'])
@token_required
def create_visit(current_user):
    try:
        data = request.json
        
        # Get the visitor_id from the current user
        visitor_id = None
        
        # If the user has a visitor_id directly
        if hasattr(current_user, 'visitor_id') and current_user.visitor_id:
            visitor_id = current_user.visitor_id
        else:
            # Try to get visitor_id from database
            try:
                user_record = db.session.execute(
                    text("SELECT visitor_id FROM users WHERE user_id = :user_id"),
                    {"user_id": current_user.user_id}
                ).fetchone()
                
                if user_record and user_record[0]:
                    visitor_id = user_record[0]
            except:
                pass
        
        if not visitor_id:
            return jsonify({"error": "No visitor ID associated with your account"}), 400
        
        # Validate required fields
        required_fields = ['pupc_id', 'visit_date', 'visit_time', 'purpose']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Store the PUC name if provided
        pupc_name = data.get('pupc_name', '')
        
        # Create new visit request
        new_visit = VisitorLog(
            pupc_id=data['pupc_id'],
            visitor_id=visitor_id,
            visit_date=data['visit_date'],
            visit_time=data['visit_time'],
            purpose=f"{data['purpose']} (Visiting: {pupc_name})",
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
        current_app.logger.error(f"Error creating visitor log: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/crimetypes', methods=['GET'])
@token_required
def get_crime_types(current_user):
    try:
        crime_types = CrimeType.query.all()
        result = []
        for crime_type in crime_types:
            result.append({
                'crime_id': crime_type.crime_id,
                'category_id': crime_type.category_id,
                'name': crime_type.name,
                'law_reference': crime_type.law_reference,
                'description': crime_type.description
            })
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching crime types: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
@data_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    try:
        # Get all crime categories
        query = text("""
            SELECT category_id, name
            FROM crimecategories
            ORDER BY name
        """)
        
        result = db.session.execute(query)
        
        categories = []
        for row in result:
            categories.append({
                'category_id': row[0],
                'name': row[1]
            })
        
        return jsonify(categories)
    except Exception as e:
        current_app.logger.error(f"Error fetching categories: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@data_bp.route('/crimes', methods=['GET'])
@token_required
def get_crimes(current_user):
    try:
        # Get all crime types
        query = text("""
            SELECT crime_id, category_id, name, law_reference
            FROM crimetypes
            ORDER BY name
        """)
        
        result = db.session.execute(query)
        
        crimes = []
        for row in result:
            crimes.append({
                'crime_id': row[0],
                'category_id': row[1],
                'name': row[2],
                'law_reference': row[3]
            })
        
        return jsonify(crimes)
    except Exception as e:
        current_app.logger.error(f"Error fetching crimes: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500