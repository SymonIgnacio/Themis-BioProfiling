import mysql.connector
import sys
import random
import string
import bcrypt

# Check if arguments are provided
if len(sys.argv) < 4:
    print("Usage: python direct_insert.py <pupc_id> <first_name> <last_name> [email] [relationship]")
    sys.exit(1)

# Get arguments
pupc_id = int(sys.argv[1])
first_name = sys.argv[2]
last_name = sys.argv[3]
email = sys.argv[4] if len(sys.argv) > 4 else None
relationship = sys.argv[5] if len(sys.argv) > 5 else None

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
    first_name_lower = first_name.lower()
    last_name_lower = last_name.lower()
    base_username = f"{first_name_lower[0]}{last_name_lower}"[:15]
    
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
    
    print(f"Generated username: {username}")
    print(f"Generated password: {password}")
    
    # Create visitor record
    cursor.execute("""
        INSERT INTO visitors (first_name, last_name, relationship_to_puc, registered_at)
        VALUES (%s, %s, %s, NOW())
    """, (first_name, last_name, relationship))
    conn.commit()
    
    # Get the visitor_id
    visitor_id = cursor.lastrowid
    print(f"Created visitor with ID: {visitor_id}")
    
    # Create user account
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    full_name = f"{first_name} {last_name}"
    
    cursor.execute("""
        INSERT INTO users (username, password_hash, role_id, email, full_name, visitor_id, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
    """, (username, hashed_password, 3, email, full_name, visitor_id))
    conn.commit()
    
    # Get the user_id
    user_id = cursor.lastrowid
    print(f"Created user with ID: {user_id}")
    
    # Insert into approvedvisitors
    cursor.execute("""
        INSERT INTO approvedvisitors 
        (pupc_id, first_name, last_name, relationship, email, visitor_id, user_id, username, password, account_created)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
    """, (pupc_id, first_name, last_name, relationship, email, visitor_id, user_id, username, password))
    conn.commit()
    
    # Get the approval_id
    approval_id = cursor.lastrowid
    print(f"Created approved visitor with ID: {approval_id}")
    
    # Verify the record was created
    cursor.execute("SELECT * FROM approvedvisitors WHERE approval_id = %s", (approval_id,))
    result = cursor.fetchone()
    if result:
        print(f"Verified approvedvisitors record: {result}")
    else:
        print("Failed to verify approvedvisitors record!")
    
    print("\nAccount created successfully!")
    print(f"Username: {username}")
    print(f"Password: {password}")

except Exception as e:
    conn.rollback()
    print(f"Error: {str(e)}")
    sys.exit(1)
finally:
    cursor.close()
    conn.close()