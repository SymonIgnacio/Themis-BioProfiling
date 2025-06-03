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

# Check tables
with app.app_context():
    # List all tables
    tables_query = text("SHOW TABLES")
    tables = db.session.execute(tables_query).fetchall()
    print("Tables in database:")
    for table in tables:
        print(f"- {table[0]}")
    
    # Check if approvedvisitors table exists
    check_table_query = text("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'themis_db' 
        AND table_name = 'approvedvisitors'
    """)
    table_exists = db.session.execute(check_table_query).scalar() > 0
    print(f"\napprovedvisitors table exists: {table_exists}")
    
    if table_exists:
        # Check columns in approvedvisitors table
        columns_query = text("SHOW COLUMNS FROM approvedvisitors")
        columns = db.session.execute(columns_query).fetchall()
        print("\nColumns in approvedvisitors table:")
        for column in columns:
            print(f"- {column[0]}: {column[1]}")
        
        # Check if there are any records in approvedvisitors table
        count_query = text("SELECT COUNT(*) FROM approvedvisitors")
        count = db.session.execute(count_query).scalar()
        print(f"\nNumber of records in approvedvisitors table: {count}")
        
        if count > 0:
            # Show sample records
            sample_query = text("SELECT * FROM approvedvisitors LIMIT 5")
            samples = db.session.execute(sample_query).fetchall()
            print("\nSample records from approvedvisitors table:")
            for sample in samples:
                print(f"- {sample}")
    
    # Check users table
    users_query = text("SELECT COUNT(*) FROM users WHERE role_id = 3")
    users_count = db.session.execute(users_query).scalar()
    print(f"\nNumber of visitor users (role_id = 3): {users_count}")
    
    # Check visitors table
    visitors_query = text("SELECT COUNT(*) FROM visitors")
    visitors_count = db.session.execute(visitors_query).scalar()
    print(f"Number of visitors: {visitors_count}")
    
    # Check for any errors in the database
    print("\nChecking for potential issues...")
    
    # Check for users with visitor_id but no corresponding visitor record
    orphaned_users_query = text("""
        SELECT COUNT(*) FROM users u
        LEFT JOIN visitors v ON u.visitor_id = v.visitor_id
        WHERE u.visitor_id IS NOT NULL AND v.visitor_id IS NULL
    """)
    orphaned_users = db.session.execute(orphaned_users_query).scalar()
    print(f"Users with invalid visitor_id: {orphaned_users}")
    
    # Check for visitors without user accounts
    orphaned_visitors_query = text("""
        SELECT COUNT(*) FROM visitors v
        LEFT JOIN users u ON v.visitor_id = u.visitor_id
        WHERE u.user_id IS NULL
    """)
    orphaned_visitors = db.session.execute(orphaned_visitors_query).scalar()
    print(f"Visitors without user accounts: {orphaned_visitors}")
    
    print("\nDatabase check complete.")