import os
import re
from datetime import timedelta
import sqlite3
import mysql.connector
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from email_validator import validate_email, EmailNotValidError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='web', static_folder='web', static_url_path='')

# Configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "super-secret-session-key-change-in-production")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-change-in-production")
jwt_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=jwt_minutes)

# CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# JWT Manager
jwt_manager = JWTManager(app)

# Database Switcher (defaults to SQLite for easy local setup)
DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()
SQLITE_PATH = os.getenv("SQLITE_PATH", "securemail.db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "securemail_db")

def get_connection():
    if DB_TYPE == "mysql":
        return mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def execute_db(query, args=()):
    is_mysql = (DB_TYPE == "mysql")
    if not is_mysql:
        query = query.replace("%s", "?")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        conn.commit()
        return cur.lastrowid
    finally:
        cur.close()
        conn.close()

def query_db(query, args=(), one=False):
    is_mysql = (DB_TYPE == "mysql")
    if not is_mysql:
        query = query.replace("%s", "?")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        rv = cur.fetchall()
        if is_mysql:
            columns = [col[0] for col in cur.description] if cur.description else []
            rv = [dict(zip(columns, row)) for row in rv]
        else:
            rv = [dict(row) for row in rv]
        conn.commit()
        return (rv[0] if rv else None) if one else rv
    finally:
        cur.close()
        conn.close()

def init_db():
    if DB_TYPE == "mysql":
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE}")
        cur.close()
        conn.close()
        
        create_user_table = """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    else:
        create_user_table = """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    execute_db(create_user_table)

# Initialize database tables on startup
init_db()

ph = PasswordHasher()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        valid_info = validate_email(email, check_deliverability=False)
        email = valid_info.normalized
    except EmailNotValidError as e:
        return jsonify({"error": f"Invalid email format: {str(e)}"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400

    # Check if user exists
    existing = query_db("SELECT * FROM users WHERE email = %s", (email,), one=True)
    if existing:
        return jsonify({"error": "Email is already registered"}), 409

    try:
        pw_hash = ph.hash(password)
        user_id = execute_db("INSERT INTO users (email, password_hash) VALUES (%s, %s)", (email, pw_hash))
        return jsonify({
            "message": "User registered successfully",
            "user_id": user_id
        }), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = query_db("SELECT * FROM users WHERE email = %s", (email,), one=True)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    try:
        ph.verify(user["password_hash"], password)
    except (VerifyMismatchError, Exception):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user["id"]), additional_claims={"email": user["email"]})
    refresh_token = create_refresh_token(identity=str(user["id"]))

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "email": user["email"]
        },
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
