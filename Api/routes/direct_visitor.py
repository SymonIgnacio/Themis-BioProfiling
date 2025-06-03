from flask import Blueprint, jsonify, request, current_app
import traceback
import datetime
import random
import string
import mysql.connector
import bcrypt

# Create blueprint
direct_visitor_bp = Blueprint('direct_visitor', __name__)

@direct_visitor_bp.route('/create-visitor', methods=['POST'])
def create_visitor():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['pupc_id', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Connect to the database
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="themis_db"
        )
        cursor = conn.cursor()
        
        try:
            # Generate username and password
            first_name = data['first_name'].lower()
            last_name = data['last_name'].lower()
            base_username = f"{first_name[0]}{last_name}"[:15]
            
            # Check if username exists and append number if needed
            username = base_username
            counter = 1
            
            cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
            while cursor.fetchone():
                username = f"{base_username}{counter}"
                counter += 1
                cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
            
            # Generate random password
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            
            # Create visitor record
            cursor.execute("""
                INSERT INTO visitors (first_name, last_name, relationship_to_puc, registered_at)
                VALUES (%s, %s, %s, NOW())
            """, (data['first_name'], data['last_name'], data.get('relationship')))
            conn.commit()
            
            # Get the visitor_id
            visitor_id = cursor.lastrowid
            
            # Create user account
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            full_name = f"{data['first_name']} {data['last_name']}"
            
            cursor.execute("""
                INSERT INTO users (username, password_hash, role_id, email, full_name, visitor_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (username, hashed_password, 3, data.get('email'), full_name, visitor_id))
            conn.commit()
            
            # Get the user_id
            user_id = cursor.lastrowid
            
            # Insert into approvedvisitors
            cursor.execute("""
                INSERT INTO approvedvisitors 
                (pupc_id, first_name, last_name, relationship, email, visitor_id, user_id, username, password, account_created)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
            """, (
                data['pupc_id'], 
                data['first_name'], 
                data['last_name'], 
                data.get('relationship'), 
                data.get('email'), 
                visitor_id, 
                user_id, 
                username, 
                password
            ))
            conn.commit()
            
            # Get the approval_id
            approval_id = cursor.lastrowid
            
            return jsonify({
                'approval_id': approval_id,
                'visitor_id': visitor_id,
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'username': username,
                'password': password,
                'message': 'Visitor added and account created'
            })
            
        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"Database error: {str(e)}")
            return jsonify({"error": f"Database error: {str(e)}"}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        current_app.logger.error(f"Error creating visitor: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500