from flask import Blueprint, jsonify, request, current_app
import traceback
from sqlalchemy import text
import datetime

from db import db
from routes.auth import token_required

# Create blueprint
blacklist_bp = Blueprint('blacklist', __name__)

@blacklist_bp.route('/blacklist', methods=['POST'])
@token_required
def add_to_blacklist(current_user):
    try:
        # Check if user has permission (admin or officer)
        if current_user.role_id not in [1, 2]:  # Assuming 1=admin, 2=officer
            return jsonify({"error": "Unauthorized"}), 403
            
        data = request.json
        
        # Validate required fields
        if 'visitor_id' not in data:
            return jsonify({"error": "Missing required field: visitor_id"}), 400
        
        # Get visitor information
        visitor_query = text("""
            SELECT v.visitor_id, v.first_name, v.last_name, u.user_id
            FROM visitors v
            LEFT JOIN users u ON v.visitor_id = u.visitor_id
            WHERE v.visitor_id = :visitor_id
        """)
        
        visitor = db.session.execute(visitor_query, {"visitor_id": data['visitor_id']}).fetchone()
        
        if not visitor:
            return jsonify({"error": "Visitor not found"}), 404
        
        # Check if visitor is already blacklisted
        check_query = text("""
            SELECT black_id FROM blacklist
            WHERE visitor_id = :visitor_id
        """)
        
        existing = db.session.execute(check_query, {"visitor_id": data['visitor_id']}).fetchone()
        
        if existing:
            return jsonify({"error": "Visitor is already blacklisted"}), 400
        
        # Add to blacklist
        blacklist_query = text("""
            INSERT INTO blacklist (visitor_id, reason, added_at)
            VALUES (:visitor_id, :reason, :added_at)
        """)
        
        db.session.execute(blacklist_query, {
            "visitor_id": data['visitor_id'],
            "reason": data.get('reason', 'No reason provided'),
            "added_at": datetime.datetime.utcnow()
        })
        db.session.commit()
        
        # Get the blacklist_id
        blacklist_id_query = text("SELECT LAST_INSERT_ID()")
        blacklist_id = db.session.execute(blacklist_id_query).scalar()
        
        return jsonify({
            'black_id': blacklist_id,
            'visitor_id': data['visitor_id'],
            'first_name': visitor[1],
            'last_name': visitor[2],
            'reason': data.get('reason', 'No reason provided'),
            'message': 'Visitor added to blacklist'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding to blacklist: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@blacklist_bp.route('/blacklist', methods=['GET'])
@token_required
def get_blacklist(current_user):
    try:
        # Get all blacklisted visitors
        query = text("""
            SELECT b.black_id, b.visitor_id, v.first_name, v.last_name, b.reason, b.added_at
            FROM blacklist b
            JOIN visitors v ON b.visitor_id = v.visitor_id
            ORDER BY b.added_at DESC
        """)
        
        result = db.session.execute(query)
        
        blacklist = []
        for row in result:
            blacklist.append({
                'black_id': row[0],
                'visitor_id': row[1],
                'first_name': row[2],
                'last_name': row[3],
                'reason': row[4],
                'added_at': row[5].isoformat() if row[5] else None
            })
        
        return jsonify(blacklist)
    except Exception as e:
        current_app.logger.error(f"Error fetching blacklist: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500