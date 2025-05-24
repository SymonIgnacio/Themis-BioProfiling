from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
import jwt
import datetime
import traceback
from functools import wraps

from db import db, User

# Create blueprint
auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(user_id=data['user_id']).first()
        except Exception as e:
            current_app.logger.error(f"Token error: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        current_app.logger.info(f"Signup request received: {data}")
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists!'}), 409
        
        # Hash the password
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create new user
        new_user = User(
            username=data['username'],
            role_id=1,  # Default role_id
            password_hash=hashed_password,
            created_at=datetime.datetime.utcnow()
        )
        
        # Add user to database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'message': 'User created successfully!'}), 201
    except Exception as e:
        current_app.logger.error(f"Error in signup: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'message': f'An error occurred during signup: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        current_app.logger.info(f"Login request received for user: {data.get('username', 'unknown')}")
        
        # Find user by username
        user = User.query.filter_by(username=data['username']).first()
        current_app.logger.info(f"User found: {user is not None}")
        
        # Check if user exists
        if not user:
            return jsonify({'message': 'User not found!'}), 401
            
        # Check if password matches stored password directly (plain text comparison)
        if user.password_hash == data['password']:
            password_correct = True
            current_app.logger.info("Plain text password match")
        else:
            # Try bcrypt verification as fallback
            try:
                password_correct = bcrypt.check_password_hash(user.password_hash, data['password'])
                current_app.logger.info(f"Bcrypt password check: {password_correct}")
            except Exception as e:
                current_app.logger.error(f"Password check error: {str(e)}")
                password_correct = False
        
        if not password_correct:
            return jsonify({'message': 'Invalid password!'}), 401
        
        # Generate token
        token = jwt.encode({
            'user_id': user.user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user_id': user.user_id,
            'username': user.username,
            'role_id': user.role_id
        })
    except Exception as e:
        current_app.logger.error(f"Error in login: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'message': f'An error occurred during login: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        return jsonify({
            'user_id': current_user.user_id,
            'username': current_user.username,
            'role_id': current_user.role_id
        })
    except Exception as e:
        current_app.logger.error(f"Error in get_profile: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'message': 'An error occurred while fetching profile'}), 500