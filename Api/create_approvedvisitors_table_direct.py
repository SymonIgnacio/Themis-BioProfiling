import mysql.connector
import random
import string

# Connect to the database
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="themis_db"
)
cursor = conn.cursor()

# Check if approvedvisitors table exists
cursor.execute("""
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'themis_db' 
    AND table_name = 'approvedvisitors'
""")
table_exists = cursor.fetchone()[0] > 0

if not table_exists:
    # Create the table
    print("Creating approvedvisitors table...")
    cursor.execute("""
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
        account_created BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    print("Table created successfully")
else:
    print("approvedvisitors table already exists")

# Get all users with visitor_id
cursor.execute("""
    SELECT u.user_id, u.username, u.email, u.full_name, u.visitor_id, 
           v.first_name, v.last_name, v.relationship_to_puc
    FROM users u
    JOIN visitors v ON u.visitor_id = v.visitor_id
    WHERE u.role_id = 3 AND u.visitor_id IS NOT NULL
""")
users = cursor.fetchall()
print(f"Found {len(users)} visitor accounts to transfer")

# Get all PUCs
cursor.execute("SELECT pupc_id FROM pupcs")
pucs = cursor.fetchall()

if not pucs:
    print("No PUCs found. Cannot transfer visitors without PUCs.")
    conn.close()
    exit(1)

# Default to first PUC if multiple exist
default_pupc_id = pucs[0][0]

# Transfer each user to approvedvisitors
for user in users:
    user_id = user[0]
    username = user[1]
    email = user[2]
    full_name = user[3]
    visitor_id = user[4]
    first_name = user[5]
    last_name = user[6]
    relationship = user[7]
    
    # Generate a random password
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    # Check if already in approvedvisitors
    cursor.execute("""
        SELECT COUNT(*) FROM approvedvisitors
        WHERE user_id = %s OR visitor_id = %s
    """, (user_id, visitor_id))
    exists = cursor.fetchone()[0] > 0
    
    if not exists:
        # Insert into approvedvisitors
        try:
            cursor.execute("""
                INSERT INTO approvedvisitors (
                    pupc_id, first_name, last_name, relationship, email,
                    visitor_id, user_id, username, password, account_created
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, TRUE
                )
            """, (
                default_pupc_id, first_name, last_name, relationship, email,
                visitor_id, user_id, username, password
            ))
            conn.commit()
            print(f"Transferred user {username} (ID: {user_id}) to approvedvisitors")
        except Exception as e:
            print(f"Error transferring user {username}: {str(e)}")
    else:
        print(f"User {username} (ID: {user_id}) already exists in approvedvisitors")

# Verify the records
cursor.execute("SELECT COUNT(*) FROM approvedvisitors")
count = cursor.fetchone()[0]
print(f"Total records in approvedvisitors table: {count}")

conn.close()
print("Transfer complete")