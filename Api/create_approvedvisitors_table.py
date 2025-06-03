from flask import Flask
from sqlalchemy import text
from db import init_db, db

# Create a Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/themis_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = init_db(app)

# Create the approvedvisitors table
with app.app_context():
    # Check if table exists
    inspector = db.inspect(db.engine)
    if 'approvedvisitors' not in inspector.get_table_names():
        # Create the table
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pupc_id) REFERENCES pupcs(pupc_id) ON DELETE CASCADE,
            FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
        )
        """)
        db.session.execute(create_table_query)
        db.session.commit()
        print("Created approvedvisitors table")
    else:
        print("approvedvisitors table already exists")

print("Done")