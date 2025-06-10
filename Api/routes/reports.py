from flask import Blueprint, jsonify, request, send_file
from db import db
from fpdf import FPDF
import io
import os
import datetime
from sqlalchemy import text

reports_bp = Blueprint('reports', __name__)

class PDF(FPDF):
    def header(self):
        # Logo
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Themis BioProfiling', 0, 1, 'C')
        self.set_font('Arial', 'I', 10)
        self.cell(0, 10, f'Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
        self.ln(10)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

@reports_bp.route('/export/puc/<format>', methods=['GET'])
def export_puc_report(format):
    try:
        # Get filter parameters
        status = request.args.get('status', '')
        date_range = request.args.get('dateRange', 'all')
        category = request.args.get('category', '')
        
        # Build query with filters - using the correct table and column names
        query = """
            SELECT 
                p.pupc_id,
                CONCAT(p.first_name, ' ', p.last_name) as name,
                ct.name as crime,
                p.status,
                p.arrest_date,
                p.release_date,
                p.created_at
            FROM pupcs p
            LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
            LEFT JOIN crimecategories cc ON p.category_id = cc.category_id
            WHERE 1=1
        """
        params = {}
        
        if status:
            query += " AND p.status = :status"
            params['status'] = status
            
        if category:
            query += " AND cc.name = :category"
            params['category'] = category
            
        if date_range != 'all':
            if date_range == 'today':
                query += " AND DATE(p.created_at) = CURDATE()"
            elif date_range == 'week':
                query += " AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
            elif date_range == 'month':
                query += " AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
        
        # Execute query
        result = db.session.execute(text(query), params)
        pucs = [dict(row._mapping) for row in result]
        
        if format == 'pdf':
            return generate_puc_pdf(pucs)
        elif format == 'txt':
            return generate_puc_txt(pucs)
        else:
            return jsonify({"error": "Unsupported format"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route('/export/visitor/<format>', methods=['GET'])
def export_visitor_report(format):
    try:
        # Get filter parameters
        status = request.args.get('status', '')
        date_range = request.args.get('dateRange', 'all')
        
        # Build query with filters - using the correct table and column names
        query = """
            SELECT 
                vl.visitor_log_id,
                v.first_name as visitor_first_name,
                v.last_name as visitor_last_name,
                CONCAT(v.first_name, ' ', v.last_name) as visitor_name,
                CONCAT(p.first_name, ' ', p.last_name) as puc_name,
                vl.visit_date,
                vl.visit_time,
                vl.approval_status as status,
                vl.purpose,
                v.relationship_to_puc as relationship
            FROM visitorlogs vl
            LEFT JOIN visitors v ON vl.visitor_id = v.visitor_id
            LEFT JOIN pupcs p ON vl.pupc_id = p.pupc_id
            WHERE 1=1
        """
        params = {}
        
        if status:
            query += " AND vl.approval_status = :status"
            params['status'] = status
            
        if date_range != 'all':
            if date_range == 'today':
                query += " AND DATE(vl.visit_date) = CURDATE()"
            elif date_range == 'week':
                query += " AND vl.visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
            elif date_range == 'month':
                query += " AND vl.visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
        
        # Execute query
        result = db.session.execute(text(query), params)
        visitors = [dict(row._mapping) for row in result]
        
        if format == 'pdf':
            return generate_visitor_pdf(visitors)
        elif format == 'txt':
            return generate_visitor_txt(visitors)
        else:
            return jsonify({"error": "Unsupported format"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route('/export/analytics/<format>', methods=['GET'])
def export_analytics_report(format):
    try:
        # Get analytics data
        # 1. Status counts
        status_query = """
            SELECT status, COUNT(*) as count
            FROM pupcs
            GROUP BY status
            ORDER BY count DESC
        """
        status_result = db.session.execute(text(status_query))
        status_counts = [dict(row._mapping) for row in status_result]
        
        # 2. Category counts
        category_query = """
            SELECT cc.name, COUNT(*) as count
            FROM pupcs p
            LEFT JOIN crimecategories cc ON p.category_id = cc.category_id
            WHERE p.category_id IS NOT NULL
            GROUP BY cc.name
            ORDER BY count DESC
        """
        category_result = db.session.execute(text(category_query))
        category_counts = [dict(row._mapping) for row in category_result]
        
        # 3. Recently released PUCs
        released_query = """
            SELECT 
                CONCAT(p.first_name, ' ', p.last_name) as name,
                ct.name as crime,
                p.release_date,
                p.arrest_date
            FROM pupcs p
            LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
            WHERE p.release_date IS NOT NULL
            ORDER BY p.release_date DESC
            LIMIT 10
        """
        released_result = db.session.execute(text(released_query))
        released_pucs = [dict(row._mapping) for row in released_result]
        
        # 4. Recently added PUCs
        recent_query = """
            SELECT 
                CONCAT(p.first_name, ' ', p.last_name) as name,
                ct.name as crime,
                p.status,
                p.created_at
            FROM pupcs p
            LEFT JOIN crimetypes ct ON p.crime_id = ct.crime_id
            ORDER BY p.created_at DESC
            LIMIT 10
        """
        recent_result = db.session.execute(text(recent_query))
        recent_pucs = [dict(row._mapping) for row in recent_result]
        
        # Combine all data
        analytics_data = {
            'status_counts': status_counts,
            'category_counts': category_counts,
            'released_pucs': released_pucs,
            'recent_pucs': recent_pucs
        }
        
        if format == 'pdf':
            return generate_analytics_pdf(analytics_data)
        elif format == 'txt':
            return generate_analytics_txt(analytics_data)
        else:
            return jsonify({"error": "Unsupported format"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_puc_pdf(pucs):
    pdf = PDF()
    pdf.add_page()
    
    # Title
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, 'PUC Records Report', 0, 1, 'C')
    pdf.ln(10)
    
    # Table header
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font('Arial', 'B', 12)
    col_widths = [40, 40, 30, 30, 30, 20]
    headers = ['Name', 'Crime', 'Status', 'Arrest Date', 'Release Date', 'Days']
    
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 10, header, 1, 0, 'C', 1)
    pdf.ln()
    
    # Table data
    pdf.set_font('Arial', '', 10)
    for puc in pucs:
        arrest_date = puc.get('arrest_date', '')
        release_date = puc.get('release_date', '')
        
        if arrest_date and release_date:
            try:
                days = (release_date - arrest_date).days
            except:
                days = 'N/A'
        else:
            days = 'Current'
            
        pdf.cell(col_widths[0], 10, str(puc.get('name', 'N/A')), 1)
        pdf.cell(col_widths[1], 10, str(puc.get('crime', 'N/A')), 1)
        pdf.cell(col_widths[2], 10, str(puc.get('status', 'N/A')), 1)
        pdf.cell(col_widths[3], 10, arrest_date.strftime('%Y-%m-%d') if arrest_date else 'N/A', 1)
        pdf.cell(col_widths[4], 10, release_date.strftime('%Y-%m-%d') if release_date else 'N/A', 1)
        pdf.cell(col_widths[5], 10, str(days), 1)
        pdf.ln()
    
    # Create in-memory file
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    
    # Return PDF file
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'PUC_Report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    )

def generate_visitor_pdf(visitors):
    pdf = PDF()
    pdf.add_page()
    
    # Title
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, 'Visitation Records Report', 0, 1, 'C')
    pdf.ln(10)
    
    # Table header
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font('Arial', 'B', 12)
    col_widths = [40, 40, 30, 25, 25, 30]
    headers = ['Visitor Name', 'PUC Name', 'Visit Date', 'Status', 'Purpose', 'Relationship']
    
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 10, header, 1, 0, 'C', 1)
    pdf.ln()
    
    # Table data
    pdf.set_font('Arial', '', 10)
    for visitor in visitors:
        visit_date = visitor.get('visit_date', '')
        
        # Format time if available
        visit_time = visitor.get('visit_time', '')
        time_str = visit_time.strftime('%H:%M') if visit_time else ''
        
        # Format date with time if available
        date_str = ''
        if visit_date:
            date_str = visit_date.strftime('%Y-%m-%d')
            if time_str:
                date_str += f' {time_str}'
        else:
            date_str = 'N/A'
        
        pdf.cell(col_widths[0], 10, str(visitor.get('visitor_name', 'N/A')), 1)
        pdf.cell(col_widths[1], 10, str(visitor.get('puc_name', 'N/A')), 1)
        pdf.cell(col_widths[2], 10, date_str, 1)
        pdf.cell(col_widths[3], 10, str(visitor.get('status', 'N/A')), 1)
        pdf.cell(col_widths[4], 10, str(visitor.get('purpose', 'N/A')), 1)
        pdf.cell(col_widths[5], 10, str(visitor.get('relationship', 'N/A')), 1)
        pdf.ln()
    
    # Create in-memory file
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    
    # Return PDF file
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'Visitation_Report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    )

def generate_analytics_pdf(data):
    pdf = PDF()
    pdf.add_page()
    
    # Title
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, 'Analytics Report', 0, 1, 'C')
    pdf.ln(5)
    
    # Status Distribution
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'PUC Status Distribution', 0, 1, 'L')
    pdf.ln(2)
    
    # Status table
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(80, 10, 'Status', 1, 0, 'C', 1)
    pdf.cell(40, 10, 'Count', 1, 1, 'C', 1)
    
    pdf.set_font('Arial', '', 10)
    for status in data['status_counts']:
        pdf.cell(80, 8, str(status.get('status', 'N/A')), 1)
        pdf.cell(40, 8, str(status.get('count', 0)), 1, 1, 'C')
    
    pdf.ln(10)
    
    # Category Distribution
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Crime Category Distribution', 0, 1, 'L')
    pdf.ln(2)
    
    # Category table
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(80, 10, 'Category', 1, 0, 'C', 1)
    pdf.cell(40, 10, 'Count', 1, 1, 'C', 1)
    
    pdf.set_font('Arial', '', 10)
    for category in data['category_counts']:
        pdf.cell(80, 8, str(category.get('name', 'N/A')), 1)
        pdf.cell(40, 8, str(category.get('count', 0)), 1, 1, 'C')
    
    pdf.ln(10)
    
    # Recently Released PUCs
    pdf.add_page()
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Recently Released PUCs', 0, 1, 'L')
    pdf.ln(2)
    
    # Released PUCs table
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font('Arial', 'B', 12)
    col_widths = [50, 50, 40, 40]
    headers = ['Name', 'Crime', 'Release Date', 'Days in Custody']
    
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 10, header, 1, 0, 'C', 1)
    pdf.ln()
    
    pdf.set_font('Arial', '', 10)
    for puc in data['released_pucs']:
        arrest_date = puc.get('arrest_date', '')
        release_date = puc.get('release_date', '')
        
        if arrest_date and release_date:
            try:
                days = (release_date - arrest_date).days
            except:
                days = 'N/A'
        else:
            days = 'N/A'
            
        pdf.cell(col_widths[0], 8, str(puc.get('name', 'N/A')), 1)
        pdf.cell(col_widths[1], 8, str(puc.get('crime', 'N/A')), 1)
        pdf.cell(col_widths[2], 8, release_date.strftime('%Y-%m-%d') if release_date else 'N/A', 1)
        pdf.cell(col_widths[3], 8, str(days), 1)
        pdf.ln()
    
    pdf.ln(10)
    
    # Recently Added PUCs
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Recently Added PUCs', 0, 1, 'L')
    pdf.ln(2)
    
    # Recent PUCs table
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font('Arial', 'B', 12)
    col_widths = [50, 50, 40, 40]
    headers = ['Name', 'Crime', 'Status', 'Added Date']
    
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 10, header, 1, 0, 'C', 1)
    pdf.ln()
    
    pdf.set_font('Arial', '', 10)
    for puc in data['recent_pucs']:
        created_at = puc.get('created_at', '')
        
        pdf.cell(col_widths[0], 8, str(puc.get('name', 'N/A')), 1)
        pdf.cell(col_widths[1], 8, str(puc.get('crime', 'N/A')), 1)
        pdf.cell(col_widths[2], 8, str(puc.get('status', 'N/A')), 1)
        pdf.cell(col_widths[3], 8, created_at.strftime('%Y-%m-%d') if created_at else 'N/A', 1)
        pdf.ln()
    
    # Create in-memory file
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    
    # Return PDF file
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'Analytics_Report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    )

def generate_puc_txt(pucs):
    output = "Themis BioProfiling - PUC Records Report\n"
    output += f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # Headers
    output += "Name\tCrime\tStatus\tArrest Date\tRelease Date\tDays in Custody\n"
    output += "-" * 80 + "\n"
    
    # Data
    for puc in pucs:
        arrest_date = puc.get('arrest_date', '')
        release_date = puc.get('release_date', '')
        
        if arrest_date and release_date:
            try:
                days = (release_date - arrest_date).days
            except:
                days = 'N/A'
        else:
            days = 'Current'
            
        name = str(puc.get('name', 'N/A'))
        crime = str(puc.get('crime', 'N/A'))
        status = str(puc.get('status', 'N/A'))
        arrest_str = arrest_date.strftime('%Y-%m-%d') if arrest_date else 'N/A'
        release_str = release_date.strftime('%Y-%m-%d') if release_date else 'N/A'
        
        output += f"{name}\t{crime}\t{status}\t{arrest_str}\t{release_str}\t{days}\n"
    
    # Create in-memory file
    txt_buffer = io.BytesIO()
    txt_buffer.write(output.encode('utf-8'))
    txt_buffer.seek(0)
    
    # Return TXT file
    return send_file(
        txt_buffer,
        mimetype='text/plain',
        as_attachment=True,
        download_name=f'PUC_Report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    )

def generate_visitor_txt(visitors):
    output = "Themis BioProfiling - Visitation Records Report\n"
    output += f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # Headers
    output += "Visitor Name\tPUC Name\tVisit Date\tStatus\tPurpose\tRelationship\n"
    output += "-" * 80 + "\n"
    
    # Data
    for visitor in visitors:
        visit_date = visitor.get('visit_date', '')
        visit_time = visitor.get('visit_time', '')
        
        visitor_name = str(visitor.get('visitor_name', 'N/A'))
        puc_name = str(visitor.get('puc_name', 'N/A'))
        
        # Format date with time if available
        if visit_date:
            visit_str = visit_date.strftime('%Y-%m-%d')
            if visit_time:
                visit_str += f' {visit_time.strftime("%H:%M")}'
        else:
            visit_str = 'N/A'
            
        status = str(visitor.get('status', 'N/A'))
        purpose = str(visitor.get('purpose', 'N/A'))
        relationship = str(visitor.get('relationship', 'N/A'))
        
        output += f"{visitor_name}\t{puc_name}\t{visit_str}\t{status}\t{purpose}\t{relationship}\n"
    
    # Create in-memory file
    txt_buffer = io.BytesIO()
    txt_buffer.write(output.encode('utf-8'))
    txt_buffer.seek(0)
    
    # Return TXT file
    return send_file(
        txt_buffer,
        mimetype='text/plain',
        as_attachment=True,
        download_name=f'Visitation_Report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    )

def generate_analytics_txt(data):
    output = "Themis BioProfiling - Analytics Report\n"
    output += f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # Status Distribution
    output += "PUC STATUS DISTRIBUTION\n"
    output += "-" * 40 + "\n"
    output += "Status\tCount\n"
    
    for status in data['status_counts']:
        output += f"{status.get('status', 'N/A')}\t{status.get('count', 0)}\n"
    
    output += "\n\n"
    
    # Category Distribution
    output += "CRIME CATEGORY DISTRIBUTION\n"
    output += "-" * 40 + "\n"
    output += "Category\tCount\n"
    
    for category in data['category_counts']:
        output += f"{category.get('name', 'N/A')}\t{category.get('count', 0)}\n"
    
    output += "\n\n"
    
    # Recently Released PUCs
    output += "RECENTLY RELEASED PUCS\n"
    output += "-" * 40 + "\n"
    output += "Name\tCrime\tRelease Date\tDays in Custody\n"
    
    for puc in data['released_pucs']:
        arrest_date = puc.get('arrest_date', '')
        release_date = puc.get('release_date', '')
        
        if arrest_date and release_date:
            try:
                days = (release_date - arrest_date).days
            except:
                days = 'N/A'
        else:
            days = 'N/A'
            
        name = str(puc.get('name', 'N/A'))
        crime = str(puc.get('crime', 'N/A'))
        release_str = release_date.strftime('%Y-%m-%d') if release_date else 'N/A'
        
        output += f"{name}\t{crime}\t{release_str}\t{days}\n"
    
    output += "\n\n"
    
    # Recently Added PUCs
    output += "RECENTLY ADDED PUCS\n"
    output += "-" * 40 + "\n"
    output += "Name\tCrime\tStatus\tAdded Date\n"
    
    for puc in data['recent_pucs']:
        created_at = puc.get('created_at', '')
        
        name = str(puc.get('name', 'N/A'))
        crime = str(puc.get('crime', 'N/A'))
        status = str(puc.get('status', 'N/A'))
        created_str = created_at.strftime('%Y-%m-%d') if created_at else 'N/A'
        
        output += f"{name}\t{crime}\t{status}\t{created_str}\n"
    
    # Create in-memory file
    txt_buffer = io.BytesIO()
    txt_buffer.write(output.encode('utf-8'))
    txt_buffer.seek(0)
    
    # Return TXT file
    return send_file(
        txt_buffer,
        mimetype='text/plain',
        as_attachment=True,
        download_name=f'Analytics_Report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    )