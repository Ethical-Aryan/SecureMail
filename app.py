import os
import re
import redis
import random
from datetime import timedelta
import sqlite3
import mysql.connector
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from email_validator import validate_email, EmailNotValidError
from dotenv import load_dotenv
from crypto_vault import verify_passkey

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='web/templates', static_folder='web/static', static_url_path='/static')
# Connect to Redis (Using protocol=2 for Windows compatibility)
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True, protocol=2)

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
        create_emails_table = """
        CREATE TABLE IF NOT EXISTS emails (
            id INT AUTO_INCREMENT PRIMARY KEY,
            owner_email VARCHAR(255) NOT NULL,
            sender_email VARCHAR(255) NOT NULL,
            recipient_email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            passkey VARCHAR(255) NULL,
            is_encrypted BOOLEAN DEFAULT FALSE,
            is_read BOOLEAN DEFAULT FALSE,
            is_starred BOOLEAN DEFAULT FALSE,
            folder VARCHAR(50) DEFAULT 'inbox',
            attachment_name VARCHAR(255) NULL,
            attachment_size VARCHAR(50) NULL,
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
        create_emails_table = """
        CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_email TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            passkey TEXT NULL,
            is_encrypted INTEGER DEFAULT 0,
            is_read INTEGER DEFAULT 0,
            is_starred INTEGER DEFAULT 0,
            folder TEXT DEFAULT 'inbox',
            attachment_name TEXT NULL,
            attachment_size TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    execute_db(create_user_table)
    execute_db(create_emails_table)

# Initialize database tables on startup
init_db()

ph = PasswordHasher()

@app.route('/')
def index_view():
    return render_template('index.html')

@app.route('/login')
def login_view():
    return render_template('login.html')

@app.route('/register')
def register_view():
    return render_template('register.html')

@app.route('/dashboard')
def dashboard_view():
    return render_template('dashboard.html')

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

# ------------------------------------------------------------------
# Emails APIs
# ------------------------------------------------------------------

@app.route('/api/emails', methods=['GET'])
@jwt_required()
def get_emails():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    emails = query_db("SELECT * FROM emails WHERE owner_email = %s ORDER BY created_at DESC", (user_email,))
    
    res = []
    for e in emails:
        parts = e["sender_email"].split('@')[0].split('.')
        initials = parts[0][0].upper() + (parts[1][0].upper() if len(parts) > 1 and len(parts[1]) > 0 else "")
        initials = initials[:2] if initials else "US"
        
        time_str = "Just Now"
        if e["created_at"]:
            time_str = str(e["created_at"])[:19]
        
        is_enc = bool(e["is_encrypted"])
        email_body = e["body"].split('\n') if e["body"] else []
        if is_enc:
            email_body = ["🔑 [Secure Encrypted Payload - Decryption Required]"]

        attachment_info = None
        if e["attachment_name"] and not is_enc:
            attachment_info = {
                "name": e["attachment_name"],
                "size": e["attachment_size"]
            }

        res.append({
            "id": e["id"],
            "owner_email": e["owner_email"],
            "sender": e["sender_email"].split('@')[0].replace('.', ' ').title(),
            "senderEmail": e["sender_email"],
            "initials": initials,
            "subject": e["subject"],
            "preview": "🔑 Encrypted Message" if is_enc else e["body"][:100],
            "body": email_body,
            "time": time_str,
            "locked": is_enc,
            "unread": bool(not e["is_read"]),
            "starred": bool(e["is_starred"]),
            "folder": e["folder"],
            "attachment": attachment_info
        })
    
    return jsonify(res), 200

@app.route('/api/emails', methods=['POST'])
@jwt_required()
def compose_email():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    sender_email = claims.get("email")
    if not sender_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        sender_email = user["email"] if user else None

    if not sender_email:
        return jsonify({"error": "User identity not found"}), 404

    data = request.get_json() or {}
    recipient_email = data.get("recipient_email", "").strip()
    subject = data.get("subject", "").strip()
    body = data.get("body", "").strip()
    is_encrypted = data.get("is_encrypted", False)
    passkey = data.get("passkey", "").strip()
    attachment_name = data.get("attachment_name")
    attachment_size = data.get("attachment_size")

    if not recipient_email or not subject or not body:
        return jsonify({"error": "Recipient, subject, and body are required"}), 400

    recipient_row_id = execute_db(
        """INSERT INTO emails 
        (owner_email, sender_email, recipient_email, subject, body, passkey, is_encrypted, is_read, is_starred, folder, attachment_name, attachment_size) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (recipient_email, sender_email, recipient_email, subject, body, passkey, 1 if is_encrypted else 0, 0, 0, 'inbox', attachment_name, attachment_size)
    )

    sender_row_id = recipient_row_id
    if recipient_email != sender_email:
        sender_row_id = execute_db(
            """INSERT INTO emails 
            (owner_email, sender_email, recipient_email, subject, body, passkey, is_encrypted, is_read, is_starred, folder, attachment_name, attachment_size) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (sender_email, sender_email, recipient_email, subject, body, passkey, 1 if is_encrypted else 0, 1, 0, 'sent', attachment_name, attachment_size)
        )

    return jsonify({
        "message": "Secure transmission complete",
        "recipient_email": recipient_email,
        "recipient_row_id": recipient_row_id,
        "sender_row_id": sender_row_id
    }), 201

@app.route('/api/emails/<int:email_id>', methods=['PUT'])
@jwt_required()
def update_email(email_id):
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    email = query_db("SELECT * FROM emails WHERE id = %s", (email_id,), one=True)
    if not email:
        return jsonify({"error": "Email not found"}), 404
    if email["owner_email"] != user_email:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    updates = []
    params = []
    
    if "is_read" in data:
        updates.append("is_read = %s")
        params.append(1 if data["is_read"] else 0)
    if "is_starred" in data:
        updates.append("is_starred = %s")
        params.append(1 if data["is_starred"] else 0)
    if "folder" in data:
        updates.append("folder = %s")
        params.append(data["folder"])

    if not updates:
        return jsonify({"error": "No update params provided"}), 400

    query = f"UPDATE emails SET {', '.join(updates)} WHERE id = %s"
    params.append(email_id)
    
    execute_db(query, tuple(params))
    return jsonify({"message": "Email updated successfully"}), 200

@app.route('/api/emails/<int:email_id>', methods=['DELETE'])
@jwt_required()
def delete_email(email_id):
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    email = query_db("SELECT * FROM emails WHERE id = %s", (email_id,), one=True)
    if not email:
        return jsonify({"error": "Email not found"}), 404
    if email["owner_email"] != user_email:
        return jsonify({"error": "Unauthorized"}), 403

    execute_db("DELETE FROM emails WHERE id = %s", (email_id,))
    return jsonify({"message": "Email permanently deleted"}), 200

@app.route('/api/storage', methods=['GET'])
@jwt_required()
def get_storage():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    emails = query_db("SELECT body, attachment_size FROM emails WHERE owner_email = %s", (user_email,))
    
    total_bytes = 0
    for e in emails:
        if e["body"]:
            total_bytes += len(e["body"].encode('utf-8'))
        if e["attachment_size"]:
            sz = e["attachment_size"].lower()
            try:
                if "mb" in sz:
                    val = float(re.findall(r"[\d\.]+", sz)[0])
                    total_bytes += int(val * 1024 * 1024)
                elif "kb" in sz:
                    val = float(re.findall(r"[\d\.]+", sz)[0])
                    total_bytes += int(val * 1024)
            except Exception:
                pass
                
    gb_used = round(total_bytes / (1024 * 1024 * 1024), 4)
    percent_used = round((gb_used / 15.0) * 100, 2)
    
    return jsonify({
        "total_bytes": total_bytes,
        "gb_used": gb_used,
        "percent_used": percent_used,
        "quota_gb": 15.0
    }), 200

@app.route('/api/emails/<int:email_id>/decrypt', methods=['POST'])
@jwt_required()
def decrypt_email(email_id):
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    email = query_db("SELECT * FROM emails WHERE id = %s", (email_id,), one=True)
    if not email:
        return jsonify({"error": "Email not found"}), 404
    if email["owner_email"] != user_email:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    input_passkey = data.get("passkey", "").strip()

    if not email["is_encrypted"]:
        return jsonify({
            "status": "decrypted",
            "body": email["body"].split('\n') if email["body"] else [],
            "attachment": {
                "name": email["attachment_name"],
                "size": email["attachment_size"]
            } if email["attachment_name"] else None
        }), 200

    if verify_passkey(email["passkey"], input_passkey):
        return jsonify({
            "status": "decrypted",
            "body": email["body"].split('\n') if email["body"] else [],
            "attachment": {
                "name": email["attachment_name"],
                "size": email["attachment_size"]
            } if email["attachment_name"] else None
        }), 200
    else:
        return jsonify({"error": "Incorrect passkey"}), 401
# forget password generate teh otp with the help for redis   
@app.route('/forgot-password')
def forgot_password_view():
    return render_template('forgot_password.html')

@app.route('/api/auth/forgot-password', methods=['POST'])
def api_forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    # Check if user exists using your existing database logic
    user = query_db("SELECT * FROM users WHERE email = %s", (email,), one=True)
    if not user:
        # Return success anyway to prevent malicious users from guessing emails
        return jsonify({"message": "If that email is registered, an OTP has been sent."}), 200
        
    # Generate 6-digit OTP and store in Redis with 60-second TTL
    otp = str(random.randint(100000, 999999))
    redis_client.set(f"pwd_reset:{email}", otp, ex=60)
    
    # Print to terminal for testing
    print(f"\n--- PASSWORD RESET ---")
    print(f"Your OTP for {email} is: {otp}")
    print(f"It expires in 60 seconds.")
    print(f"----------------------\n")
    
    return jsonify({
        "message": "If that email is registered, an OTP has been sent.",
        "otp": otp
    }), 200

@app.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    otp = data.get("otp", "").strip()
    new_password = data.get("new_password", "")
    
    if not email or not otp or not new_password:
        return jsonify({"error": "Email, OTP, and new password are required"}), 400
        
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
    # Fetch OTP from Redis
    stored_otp = redis_client.get(f"pwd_reset:{email}")
    
    if not stored_otp:
        return jsonify({"error": "OTP has expired or is invalid. Please request a new one."}), 400
        
    if str(otp) != str(stored_otp):
        return jsonify({"error": "Invalid OTP. Try again."}), 400
        
    # Success! Hash new password using Argon2 and update database[cite: 1]
    pw_hash = ph.hash(new_password)
    execute_db("UPDATE users SET password_hash = %s WHERE email = %s", (pw_hash, email))
    
    # Clear the OTP from Redis manually for security
    redis_client.delete(f"pwd_reset:{email}")
    
    return jsonify({"message": "Password reset successfully. You can now log in."}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
