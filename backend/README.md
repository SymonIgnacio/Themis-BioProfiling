# Themis BioProfiling Backend

This is the backend for the Themis BioProfiling application, designed for a city jail client.

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - The `.env` file contains basic configuration
   - For production, make sure to change the SECRET_KEY

### Running the Application

1. Make sure your virtual environment is activated
2. Run the Flask application:
   ```
   flask run
   ```
   or
   ```
   python app.py
   ```

3. The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- **POST /api/signup**
  - Creates a new user account
  - Request body: `{ "username": "example", "email": "user@example.com", "password": "securepassword" }`

- **POST /api/login**
  - Authenticates a user and returns a JWT token
  - Request body: `{ "username": "example", "password": "securepassword" }`

- **GET /api/profile**
  - Returns the current user's profile information
  - Requires Authentication: Yes (JWT token in Authorization header)

## Security Notes

- In production, make sure to:
  - Change the SECRET_KEY in the .env file
  - Use HTTPS
  - Consider using a more robust database (PostgreSQL, MySQL)
  - Implement rate limiting
  - Add more comprehensive validation