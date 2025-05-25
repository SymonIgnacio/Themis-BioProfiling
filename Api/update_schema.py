from flask import Flask
from db import db, init_db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/themis_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = init_db(app)

with app.app_context():
    # Add columns if they don't exist
    with db.engine.connect() as conn:
        conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) NULL"))
        conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) NULL"))
        conn.commit()
        print("Database schema updated successfully!")