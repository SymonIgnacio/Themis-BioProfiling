from flask import Flask, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import os

# Import database and models
from db import init_db

# Import routes
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.data import data_bp
from routes.visits import visits_bp
from routes.admin import admin_bp
from routes.officer import officer_bp
from routes.pucs import pucs_bp
from routes.visitors_sqlalchemy import visitors_bp
from routes.blacklist import blacklist_bp

def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your_secret_key_here'  # Change this in production
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/themis_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db = init_db(app)
    bcrypt = Bcrypt(app)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(data_bp, url_prefix='/api')
    app.register_blueprint(visits_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(officer_bp, url_prefix='/api')
    app.register_blueprint(pucs_bp, url_prefix='/api')
    app.register_blueprint(visitors_bp, url_prefix='/api')
    app.register_blueprint(blacklist_bp, url_prefix='/api')
    
    # Test connection route
    @app.route('/api/test-connection', methods=['GET'])
    def test_connection():
        try:
            # Use the db object to test connection
            with db.engine.connect() as connection:
                connection.execute(db.text("SELECT 1"))
            return jsonify({"status": "success", "message": "Database connection successful"})
        except Exception as e:
            app.logger.error(f"Database connection error: {str(e)}")
            return jsonify({"status": "error", "message": f"Database connection failed: {str(e)}"}), 500

    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)