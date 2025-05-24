from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect
import sys

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/themis_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')

try:
    with app.app_context():
        # Check if we can connect to the database
        connection = db.engine.connect()
        print("Database connection successful!")
        
        # Check if the users table exists
        inspector = inspect(db.engine)
        if 'users' in inspector.get_table_names():
            print("The 'users' table exists!")
            
            # Check if there are any users in the table
            user_count = User.query.count()
            print(f"Number of users in the database: {user_count}")
            
            if user_count > 0:
                # Get the first user
                first_user = User.query.first()
                print(f"First user: {first_user.username}, {first_user.email}")
        else:
            print("The 'users' table does not exist!")
            
        connection.close()
            
except Exception as e:
    print(f"Error connecting to database: {str(e)}")
    sys.exit(1)