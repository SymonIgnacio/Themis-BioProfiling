from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from sqlalchemy import inspect
import jwt
import datetime
import os
import traceback

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/themis_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# User model - updated to match your actual database schema
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    pin_hash = db.Column(db.String(60), nullable=True)
    face_template = db.Column(db.LargeBinary, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

# Handle preflight OPTIONS requests
@app.route('/api/login', methods=['OPTIONS'])
@app.route('/api/signup', methods=['OPTIONS'])
@app.route('/api/profile', methods=['OPTIONS'])
@app.route('/api/test-db', methods=['OPTIONS'])
def handle_options():
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Debug route to test database connection
@app.route('/api/test-db', methods=['GET'])
def test_db():
    try:
        # Check if we can connect to the database
        connection = db.engine.connect()
        
        # Check if the users table exists
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        users_table_exists = 'users' in tables
        
        # Check if there are any users
        user_count = User.query.count() if users_table_exists else 0
        
        connection.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful',
            'tables': tables,
            'users_table_exists': users_table_exists,
            'user_count': user_count
        })
    except Exception as e:
        app.logger.error(f"Database error: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

# Token required decorator
def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(user_id=data['user_id']).first()
        except Exception as e:
            app.logger.error(f"Token error: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated

# Routes
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        app.logger.info(f"Signup request received: {data}")
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists!'}), 409
        
        # Email check removed as it's not in the schema
        
        # Hash the password
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create new user
        new_user = User(
            username=data['username'],
            role_id=1,  # Default role_id (you may need to adjust this based on your Roles table)
            password_hash=hashed_password,
            created_at=datetime.datetime.utcnow()
        )
        
        # Add user to database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'message': 'User created successfully!'}), 201
    except Exception as e:
        app.logger.error(f"Error in signup: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'An error occurred during signup: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        app.logger.info(f"Login request received for user: {data.get('username', 'unknown')}")
        
        # Find user by username
        user = User.query.filter_by(username=data['username']).first()
        app.logger.info(f"User found: {user is not None}")
        
        # Check if user exists and password is correct
        if not user:
            return jsonify({'message': 'User not found!'}), 401
            
        # For debugging
        app.logger.info(f"Stored hash: {user.password_hash}")
        app.logger.info(f"Password to check: {data['password']}")
        
        # Check if password matches stored password directly (plain text comparison)
        if user.password_hash == data['password']:
            password_correct = True
            app.logger.info("Plain text password match")
        else:
            # Try bcrypt verification as fallback
            try:
                password_correct = bcrypt.check_password_hash(user.password_hash, data['password'])
                app.logger.info(f"Bcrypt password check: {password_correct}")
            except Exception as e:
                app.logger.error(f"Password check error: {str(e)}")
                password_correct = False
        
        if not password_correct:
            return jsonify({'message': 'Invalid password!'}), 401
        
        # Generate token
        token = jwt.encode({
            'user_id': user.user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user_id': user.user_id,
            'username': user.username,
            'role_id': user.role_id
        })
    except Exception as e:
        app.logger.error(f"Error in login: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'An error occurred during login: {str(e)}'}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        return jsonify({
            'user_id': current_user.user_id,
            'username': current_user.username,
            'role_id': current_user.role_id
        })
    except Exception as e:
        app.logger.error(f"Error in get_profile: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'An error occurred while fetching profile'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)