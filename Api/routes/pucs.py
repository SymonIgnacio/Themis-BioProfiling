from flask import Blueprint, jsonify, request, current_app
import traceback
from sqlalchemy import text
import datetime
import random
import string

from db import db, PUPC, Visitor, User
from routes.auth import token_required, bcrypt

# Create blueprint
pucs_bp = Blueprint('pucs', __name__)

@pucs_bp.route('/pucs', methods=['GET'])
@token_required
def get_pucs(current_user):
    try:
        # Get all PUCs
        query = text("""
            SELECT p.pupc_id, p.first_name, p.last_name, p.gender, p.age, 
                   p.arrest_date, p.release_date, p.status, p.mugshot_path,
                   cc.name as category_name, ct.name as crime_name,
                   CONCAT(p.first_name, ' ', p.last_name) as name
            FROM pupcs p
            LEFT JOIN crimecategories cc ON p.category_id = cc.category_id
            LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
            ORDER BY p.last_name, p.first_name
        """)
        
        result = db.session.execute(query)
        
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
                'mugshot_path': row[8],
                'category_name': row[9],
                'crime_name': row[10],
                'name': row[11],
                'full_name': f"{row[1]} {row[2]}"
            })
        
        return jsonify(pucs)
    except Exception as e:
        current_app.logger.error(f"Error fetching PUCs: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@pucs_bp.route('/pucs/<int:pupc_id>', methods=['GET'])
@token_required
def get_puc(current_user, pupc_id):
    try:
        # Get specific PUC
        query = text("""
            SELECT p.pupc_id, p.first_name, p.last_name, p.gender, p.age, 
                   p.arrest_date, p.release_date, p.status, p.mugshot_path,
                   cc.name as category_name, ct.name as crime_name,
                   cc.category_id, ct.crime_id
            FROM pupcs p
            LEFT JOIN crimecategories cc ON p.category_id = cc.category_id
            LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
            WHERE p.pupc_id = :pupc_id
        """)
        
        result = db.session.execute(query, {"pupc_id": pupc_id}).fetchone()
        
        if not result:
            return jsonify({"error": "PUC not found"}), 404
        
        puc = {
            'pupc_id': result[0],
            'first_name': result[1],
            'last_name': result[2],
            'gender': result[3],
            'age': result[4],
            'arrest_date': result[5].isoformat() if result[5] else None,
            'release_date': result[6].isoformat() if result[6] else None,
            'status': result[7],
            'mugshot_path': result[8],
            'category_name': result[9],
            'crime_name': result[10],
            'category_id': result[11],
            'crime_id': result[12]
        }
        
        # Get approved visitors for this PUC
        visitors_query = text("""
            SELECT av.approval_id, av.first_name, av.last_name, av.relationship,
                   av.email, av.phone, av.visitor_id, av.user_id, 
                   av.username, av.account_created
            FROM approvedvisitors av
            WHERE av.pupc_id = :pupc_id
            ORDER BY av.last_name, av.first_name
        """)
        
        visitors_result = db.session.execute(visitors_query, {"pupc_id": pupc_id})
        
        approved_visitors = []
        for row in visitors_result:
            approved_visitors.append({
                'approval_id': row[0],
                'first_name': row[1],
                'last_name': row[2],
                'relationship': row[3],
                'email': row[4],
                'phone': row[5],
                'visitor_id': row[6],
                'user_id': row[7],
                'username': row[8],
                'account_created': row[9]
            })
        
        puc['approved_visitors'] = approved_visitors
        
        return jsonify(puc)
    except Exception as e:
        current_app.logger.error(f"Error fetching PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@pucs_bp.route('/pucs', methods=['POST'])
@token_required
def create_puc(current_user):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Create new PUC using direct SQL
        puc_query = text("""
            INSERT INTO pupcs (
                first_name, last_name, gender, age, arrest_date, 
                release_date, status, category_id, crime_id, mugshot_path, created_at
            ) VALUES (
                :first_name, :last_name, :gender, :age, :arrest_date,
                :release_date, :status, :category_id, :crime_id, :mugshot_path, :created_at
            )
        """)
        
        db.session.execute(puc_query, {
            "first_name": data['first_name'],
            "last_name": data['last_name'],
            "gender": data.get('gender'),
            "age": data.get('age'),
            "arrest_date": data.get('arrest_date'),
            "release_date": data.get('release_date'),
            "status": data.get('status', 'In Custody'),
            "category_id": data.get('category_id'),
            "crime_id": data.get('crime_id'),
            "mugshot_path": data.get('mugshot_path'),
            "created_at": datetime.datetime.utcnow()
        })
        db.session.commit()
        
        # Get the pupc_id
        pupc_id_query = text("SELECT LAST_INSERT_ID()")
        pupc_id = db.session.execute(pupc_id_query).scalar()
        
        # Process approved visitors if provided
        approved_visitors = data.get('approved_visitors', [])
        created_visitors = []
        
        for visitor_data in approved_visitors:
            try:
                # Create visitor record
                visitor_query = text("""
                    INSERT INTO visitors (first_name, last_name, relationship_to_puc, registered_at)
                    VALUES (:first_name, :last_name, :relationship, :registered_at)
                """)
                
                db.session.execute(visitor_query, {
                    "first_name": visitor_data['first_name'],
                    "last_name": visitor_data['last_name'],
                    "relationship": visitor_data.get('relationship'),
                    "registered_at": datetime.datetime.utcnow()
                })
                db.session.commit()
                
                # Get the visitor_id
                visitor_id_query = text("SELECT LAST_INSERT_ID()")
                visitor_id = db.session.execute(visitor_id_query).scalar()
                
                # Generate username and password
                first_name = visitor_data['first_name'].lower()
                last_name = visitor_data['last_name'].lower()
                base_username = f"{first_name[0]}{last_name}"[:15]
                
                # Check if username exists and append number if needed
                username = base_username
                counter = 1
                while User.query.filter_by(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                # Generate random password
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                
                # Create user account
                hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
                user_query = text("""
                    INSERT INTO users (username, password_hash, role_id, email, full_name, visitor_id, created_at)
                    VALUES (:username, :password_hash, :role_id, :email, :full_name, :visitor_id, :created_at)
                """)
                
                db.session.execute(user_query, {
                    "username": username,
                    "password_hash": hashed_password,
                    "role_id": 3,
                    "email": visitor_data.get('email'),
                    "full_name": f"{visitor_data['first_name']} {visitor_data['last_name']}",
                    "visitor_id": visitor_id,
                    "created_at": datetime.datetime.utcnow()
                })
                db.session.commit()
                
                # Get the user_id
                user_id_query = text("SELECT LAST_INSERT_ID()")
                user_id = db.session.execute(user_id_query).scalar()
                
                # Insert into approvedvisitors
                approved_query = text("""
                    INSERT INTO approvedvisitors (pupc_id, first_name, last_name, relationship, email, phone, visitor_id, user_id, username, password, account_created)
                    VALUES (:pupc_id, :first_name, :last_name, :relationship, :email, :phone, :visitor_id, :user_id, :username, :password, 1)
                """)
                
                db.session.execute(approved_query, {
                    "pupc_id": pupc_id,
                    "first_name": visitor_data['first_name'],
                    "last_name": visitor_data['last_name'],
                    "relationship": visitor_data.get('relationship'),
                    "email": visitor_data.get('email'),
                    "phone": visitor_data.get('phone'),
                    "visitor_id": visitor_id,
                    "user_id": user_id,
                    "username": username,
                    "password": password
                })
                db.session.commit()
                
                created_visitors.append({
                    'visitor_id': visitor_id,
                    'user_id': user_id,
                    'first_name': visitor_data['first_name'],
                    'last_name': visitor_data['last_name'],
                    'relationship': visitor_data.get('relationship'),
                    'email': visitor_data.get('email'),
                    'phone': visitor_data.get('phone'),
                    'username': username,
                    'password': password
                })
                
            except Exception as e:
                current_app.logger.error(f"Error creating visitor: {str(e)}")
                db.session.rollback()
        
        return jsonify({
            'pupc_id': pupc_id,
            'message': 'PUC created successfully',
            'approved_visitors': created_visitors
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@pucs_bp.route('/pucs/<int:pupc_id>', methods=['PUT'])
@token_required
def update_puc(current_user, pupc_id):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Find PUC
        puc = PUPC.query.get(pupc_id)
        if not puc:
            return jsonify({"error": "PUC not found"}), 404
            
        # Update PUC fields
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
        if 'crime_id' in data:
            puc.crime_id = data['crime_id']
        if 'mugshot_path' in data:
            puc.mugshot_path = data['mugshot_path']
            
        db.session.commit()
        
        created_visitors = []
        
        # Process approved visitors if provided
        if 'approved_visitors' in data:
            # Handle approved visitors updates
            created_visitors = update_approved_visitors(pupc_id, data['approved_visitors'])
        
        return jsonify({
            'pupc_id': puc.pupc_id,
            'message': 'PUC updated successfully',
            'approved_visitors': created_visitors
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating PUC: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@pucs_bp.route('/pucs/<int:pupc_id>/visitors', methods=['POST'])
@token_required
def add_visitor(current_user, pupc_id):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Check if PUC exists
        puc = PUPC.query.get(pupc_id)
        if not puc:
            return jsonify({"error": "PUC not found"}), 404
            
        # Create visitor
        result = create_approved_visitor(pupc_id, data)
        
        return jsonify(result), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding visitor: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def create_approved_visitor(pupc_id, visitor_data):
    try:
        # Generate username and password
        first_name = visitor_data['first_name'].lower()
        last_name = visitor_data['last_name'].lower()
        base_username = f"{first_name[0]}{last_name}"[:15]  # First initial + last name, max 15 chars
        
        # Check if username exists and append number if needed
        username = base_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Generate random password
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        
        # Log what we're about to do
        current_app.logger.info(f"Creating visitor: {visitor_data['first_name']} {visitor_data['last_name']}")
        current_app.logger.info(f"Username: {username}, Password: {password}")
        
        # Create visitor record using direct SQL
        visitor_query = text("""
            INSERT INTO visitors (first_name, last_name, relationship_to_puc, registered_at)
            VALUES (:first_name, :last_name, :relationship, :registered_at)
        """)
        
        db.session.execute(visitor_query, {
            "first_name": visitor_data['first_name'],
            "last_name": visitor_data['last_name'],
            "relationship": visitor_data.get('relationship'),
            "registered_at": datetime.datetime.utcnow()
        })
        db.session.commit()
        
        # Get the visitor_id
        visitor_id_query = text("SELECT LAST_INSERT_ID()")
        visitor_id_result = db.session.execute(visitor_id_query).scalar()
        current_app.logger.info(f"Created visitor with ID: {visitor_id_result}")
        
        # Create user account using direct SQL
        user_query = text("""
            INSERT INTO users (username, password_hash, role_id, email, full_name, visitor_id, created_at)
            VALUES (:username, :password_hash, :role_id, :email, :full_name, :visitor_id, :created_at)
        """)
        
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        db.session.execute(user_query, {
            "username": username,
            "password_hash": hashed_password,
            "role_id": 3,  # Visitor role
            "email": visitor_data.get('email'),
            "full_name": f"{visitor_data['first_name']} {visitor_data['last_name']}",
            "visitor_id": visitor_id_result,
            "created_at": datetime.datetime.utcnow()
        })
        db.session.commit()
        
        # Get the user_id
        user_id_query = text("SELECT LAST_INSERT_ID()")
        user_id_result = db.session.execute(user_id_query).scalar()
        current_app.logger.info(f"Created user with ID: {user_id_result}")
        
        # Create approved visitor record using direct SQL
        # First check if approvedvisitors table exists
        check_table_query = text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'themis_db' 
            AND table_name = 'approvedvisitors'
        """)
        table_exists = db.session.execute(check_table_query).scalar() > 0
        current_app.logger.info(f"approvedvisitors table exists: {table_exists}")
        
        if not table_exists:
            # Create the table
            current_app.logger.info("Creating approvedvisitors table")
            create_table_query = text("""
            CREATE TABLE approvedvisitors (
                approval_id INT AUTO_INCREMENT PRIMARY KEY,
                pupc_id INT NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                relationship VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                visitor_id INT,
                user_id INT,
                username VARCHAR(50),
                password VARCHAR(50),
                account_created BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """)
            db.session.execute(create_table_query)
            db.session.commit()
        
        # Insert into approvedvisitors
        current_app.logger.info(f"Inserting into approvedvisitors: pupc_id={pupc_id}, visitor_id={visitor_id_result}, user_id={user_id_result}")
        current_app.logger.info(f"Relationship: {visitor_data.get('relationship')}, Email: {visitor_data.get('email')}, Phone: {visitor_data.get('phone')}")
        
        # Include all fields including relationship, email, and phone
        approved_query = text("""
            INSERT INTO approvedvisitors 
            (pupc_id, first_name, last_name, relationship, email, phone, visitor_id, user_id, username, password, account_created, created_at) 
            VALUES 
            (:pupc_id, :first_name, :last_name, :relationship, :email, :phone, :visitor_id, :user_id, :username, :password, TRUE, NOW())
        """)
        
        # Ensure password is truncated to fit in the database column (VARCHAR(20))
        truncated_password = password[:20] if password else None
        
        db.session.execute(approved_query, {
            "pupc_id": pupc_id,
            "first_name": visitor_data['first_name'],
            "last_name": visitor_data['last_name'],
            "relationship": visitor_data.get('relationship'),
            "email": visitor_data.get('email'),
            "phone": visitor_data.get('phone'),
            "visitor_id": visitor_id_result,
            "user_id": user_id_result,
            "username": username,
            "password": truncated_password
        })
        db.session.commit()
        
        # Get the approval_id
        approval_id_query = text("SELECT LAST_INSERT_ID()")
        approval_id_result = db.session.execute(approval_id_query).scalar()
        current_app.logger.info(f"Created approved visitor with ID: {approval_id_result}")
        
        # Verify the record was created
        verify_query = text("SELECT * FROM approvedvisitors WHERE approval_id = :approval_id")
        verify_result = db.session.execute(verify_query, {"approval_id": approval_id_result}).fetchone()
        if verify_result:
            current_app.logger.info(f"Verified approvedvisitors record: {verify_result}")
        else:
            current_app.logger.error("Failed to verify approvedvisitors record!")
        
        return {
            'approval_id': approval_id_result,
            'visitor_id': visitor_id_result,
            'user_id': user_id_result,
            'first_name': visitor_data['first_name'],
            'last_name': visitor_data['last_name'],
            'relationship': visitor_data.get('relationship'),
            'email': visitor_data.get('email'),
            'phone': visitor_data.get('phone'),
            'username': username,
            'password': password,
            'message': 'Visitor added and account created'
        }
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating visitor: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        raise e

def update_approved_visitors(pupc_id, visitors_data):
    # Track created visitors
    created_visitors = []
    
    # Check if approvedvisitors table exists
    check_table_query = text("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'themis_db' 
        AND table_name = 'approvedvisitors'
    """)
    table_exists = db.session.execute(check_table_query).scalar() > 0
    
    if table_exists:
        # Get existing approved visitors
        existing_query = text("""
            SELECT approval_id, visitor_id, user_id, username, password
            FROM approvedvisitors
            WHERE pupc_id = :pupc_id
        """)
        existing_results = db.session.execute(existing_query, {"pupc_id": pupc_id}).fetchall()
        existing_ids = {row[0] for row in existing_results}
        
        # Track processed IDs
        processed_ids = set()
    
    # Process each visitor in the data
    for visitor_data in visitors_data:
        try:
            if table_exists and 'approval_id' in visitor_data and visitor_data['approval_id']:
                # Update existing visitor
                approval_id = visitor_data['approval_id']
                processed_ids.add(approval_id)
                
                # Get visitor and user IDs
                get_ids_query = text("""
                    SELECT visitor_id, user_id
                    FROM approvedvisitors
                    WHERE approval_id = :approval_id
                """)
                ids_result = db.session.execute(get_ids_query, {"approval_id": approval_id}).fetchone()
                
                if ids_result:
                    visitor_id = ids_result[0]
                    user_id = ids_result[1]
                    
                    # Update visitors table
                    visitor_update_query = text("""
                        UPDATE visitors 
                        SET first_name = :first_name, 
                            last_name = :last_name, 
                            relationship_to_puc = :relationship
                        WHERE visitor_id = :visitor_id
                    """)
                    
                    db.session.execute(visitor_update_query, {
                        "first_name": visitor_data.get('first_name'),
                        "last_name": visitor_data.get('last_name'),
                        "relationship": visitor_data.get('relationship'),
                        "visitor_id": visitor_id
                    })
                    db.session.commit()
                    
                    # Update users table
                    user_update_query = text("""
                        UPDATE users
                        SET email = :email,
                            full_name = :full_name
                        WHERE user_id = :user_id
                    """)
                    
                    db.session.execute(user_update_query, {
                        "email": visitor_data.get('email'),
                        "full_name": f"{visitor_data.get('first_name')} {visitor_data.get('last_name')}",
                        "user_id": user_id
                    })
                    db.session.commit()
                    
                    # Update approvedvisitors table
                    approved_update_query = text("""
                        UPDATE approvedvisitors 
                        SET first_name = :first_name, 
                            last_name = :last_name, 
                            relationship = :relationship,
                            email = :email,
                            phone = :phone
                        WHERE approval_id = :approval_id
                    """)
                    
                    db.session.execute(approved_update_query, {
                        "first_name": visitor_data.get('first_name'),
                        "last_name": visitor_data.get('last_name'),
                        "relationship": visitor_data.get('relationship'),
                        "email": visitor_data.get('email'),
                        "phone": visitor_data.get('phone'),
                        "approval_id": approval_id
                    })
                    db.session.commit()
                    
                    # Get username and password
                    creds_query = text("""
                        SELECT username, password
                        FROM approvedvisitors
                        WHERE approval_id = :approval_id
                    """)
                    creds_result = db.session.execute(creds_query, {"approval_id": approval_id}).fetchone()
                    
                    # Add to created_visitors list with existing credentials
                    created_visitors.append({
                        'approval_id': approval_id,
                        'visitor_id': visitor_id,
                        'user_id': user_id,
                        'first_name': visitor_data.get('first_name'),
                        'last_name': visitor_data.get('last_name'),
                        'username': creds_result[0] if creds_result else '',
                        'password': creds_result[1] if creds_result else ''
                    })
            else:
                # Add new visitor
                new_visitor = create_approved_visitor(pupc_id, visitor_data)
                created_visitors.append(new_visitor)
        except Exception as e:
            current_app.logger.error(f"Error processing visitor: {str(e)}")
            current_app.logger.error(traceback.format_exc())
    
    # Remove visitors not in the updated list if approvedvisitors table exists
    if table_exists:
        for approval_id in existing_ids - processed_ids:
            try:
                # Get visitor and user IDs first
                get_ids_query = text("""
                    SELECT visitor_id, user_id
                    FROM approvedvisitors
                    WHERE approval_id = :approval_id
                """)
                ids_result = db.session.execute(get_ids_query, {"approval_id": approval_id}).fetchone()
                
                if ids_result:
                    visitor_id = ids_result[0]
                    user_id = ids_result[1]
                    
                    # Delete from approvedvisitors
                    delete_approved_query = text("""
                        DELETE FROM approvedvisitors
                        WHERE approval_id = :approval_id
                    """)
                    db.session.execute(delete_approved_query, {"approval_id": approval_id})
                    db.session.commit()
                    
                    # Delete from users
                    delete_user_query = text("""
                        DELETE FROM users
                        WHERE user_id = :user_id
                    """)
                    db.session.execute(delete_user_query, {"user_id": user_id})
                    db.session.commit()
                    
                    # Delete from visitors
                    delete_visitor_query = text("""
                        DELETE FROM visitors
                        WHERE visitor_id = :visitor_id
                    """)
                    db.session.execute(delete_visitor_query, {"visitor_id": visitor_id})
                    db.session.commit()
            except Exception as e:
                current_app.logger.error(f"Error removing visitor: {str(e)}")
    
    return created_visitors