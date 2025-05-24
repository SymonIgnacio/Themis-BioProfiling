from app import create_app

app = create_app()

if __name__ == '__main__':
    print("Starting Themis BioProfiling API on http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    app.run(debug=True, host='0.0.0.0', port=5000)