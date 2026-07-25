import os
import re
# pyrefly: ignore [missing-import]
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
from crypto_vault import verify_passkey, encrypt_body, decrypt_body, hash_passkey

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='web/templates', static_folder='web/static', static_url_path='/static')
# Connect to Redis gracefully (supports REDIS_URL for production or fallback if offline)
redis_url = os.getenv("REDIS_URL")
redis_client = None
if redis_url:
    try:
        redis_client = redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        print(f"[WARNING] Could not connect to REDIS_URL: {e}")
else:
    try:
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True, socket_connect_timeout=2)
        redis_client.ping()
    except Exception as e:
        print(f"[WARNING] Local Redis offline: {e}")
        redis_client = None

# Configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "super-secret-session-key-change-in-production")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-change-in-production")
jwt_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=jwt_minutes)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

# CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# JWT Manager
jwt_manager = JWTManager(app)

# [ADDED FOR MOBILE] Redis token blocklist loader for secure mobile logout
@jwt_manager.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload: dict):
    jti = jwt_payload["jti"]
    if redis_client:
        try:
            token_in_redis = redis_client.get(f"revoked_token:{jti}")
            return token_in_redis is not None
        except Exception as e:
            print(f"Redis blocklist error: {e}")
            return False
    return False

# Database Switcher (reads directly from environment variables)
load_dotenv(override=True)

DB_TYPE = os.getenv("DB_TYPE", "mysql").lower()
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "securemail")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "securemail.db")

#########################################################
# MOBILE SUPPORT UPDATE
#
# Added/Modified for React Native Mobile Compatibility
#
# Reason:
# Enforce MySQL as single source of truth in production while
# allowing optional ALLOW_SQLITE_FALLBACK only when explicitly enabled.
# Prevents silent DB divergence between Web and Mobile.
#
# Related Mobile Files:
# - Mobile/src/services/api.js
# - Mobile/src/context/AuthContext.js
#
# Date: 2026-07-24
#
# Do not remove without updating Mobile.
#########################################################
def get_connection():
    global DB_TYPE

    if DB_TYPE == "mysql":
        try:
            is_local = (MYSQL_HOST.lower() in ("localhost", "127.0.0.1"))
            return mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                ssl_disabled=is_local,
                ssl_verify_cert=False,
                connection_timeout=5
            )
        except Exception as e:
            print(f"[WARNING] MySQL connection failed ({e}). Switching DB_TYPE to SQLite for instant local responses...")
            DB_TYPE = "sqlite"

    conn = sqlite3.connect(SQLITE_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    except Exception:
        pass
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
    global DB_TYPE
    if DB_TYPE == "mysql":
        try:
            is_local = (MYSQL_HOST.lower() in ("localhost", "127.0.0.1"))
            conn = mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                ssl_disabled=is_local,
                ssl_verify_cert=False,
                ssl_verify_cert=True,
                connection_timeout=5)
            cur = conn.cursor()
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}`")
            cur.close()
            conn.close()
        except Exception as e:
            allow_fallback = os.getenv("ALLOW_SQLITE_FALLBACK", "false").lower() == "true"
            if allow_fallback:
                print(f"[WARNING] MySQL initialization failed ({str(e)}). Falling back to SQLite for local development...")
                DB_TYPE = "sqlite"
            else:
                print(f"[ERROR] MySQL initialization failed: {e}")
                raise e

    if DB_TYPE == "mysql":
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

###############################################################
# MOBILE SUPPORT UPDATE
# Added for React Native Mobile Application
# Purpose:
# Initialize database tables for Mobile Device Push Tokens,
# Mobile Notifications, and Mobile Push Delivery Queue.
# Do not remove without updating the mobile application.
###############################################################
    if DB_TYPE == "mysql":
        create_devices_table = """
        CREATE TABLE IF NOT EXISTS devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            push_token VARCHAR(255) NOT NULL,
            platform VARCHAR(50) DEFAULT 'unknown',
            is_active BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY user_token (user_email, push_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        create_notifications_table = """
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            data_json TEXT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        create_queue_table = """
        CREATE TABLE IF NOT EXISTS notification_queue (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            data_json TEXT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    else:
        create_devices_table = """
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            push_token TEXT NOT NULL,
            platform TEXT DEFAULT 'unknown',
            is_active INTEGER DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_email, push_token)
        );
        """
        create_notifications_table = """
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            data_json TEXT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        create_queue_table = """
        CREATE TABLE IF NOT EXISTS notification_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            data_json TEXT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    execute_db(create_devices_table)
    execute_db(create_notifications_table)
    execute_db(create_queue_table)

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

# [ADDED FOR MOBILE] Refresh token endpoint to support secure biometric login without passwords
@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    user = query_db("SELECT id, email FROM users WHERE id = %s", (current_user_id,), one=True)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    access_token = create_access_token(identity=current_user_id, additional_claims={"email": user["email"]})
    return jsonify({
        "success": True,
        "access_token": access_token,
        "user": {
            "id": user["id"],
            "email": user["email"]
        }
    }), 200

# [ADDED FOR MOBILE] Secure logout endpoint to explicitly revoke mobile access and refresh tokens
@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    access_jti = get_jwt()["jti"]
    try:
        if redis_client:
            redis_client.setex(f"revoked_token:{access_jti}", timedelta(minutes=jwt_minutes), "true")
    except Exception as e:
        print(f"Redis logout error: {e}")
    
    data = request.get_json(silent=True) or {}
    refresh_token = data.get("refresh_token")
    if refresh_token:
        try:
            from flask_jwt_extended import decode_token
            decoded_refresh = decode_token(refresh_token)
            refresh_jti = decoded_refresh["jti"]
            if redis_client:
                redis_client.setex(f"revoked_token:{refresh_jti}", timedelta(days=30), "true")
        except Exception as e:
            print(f"Redis logout error: {e}")

    return jsonify({"success": True, "message": "Successfully logged out"}), 200

# ------------------------------------------------------------------
# Helper Utilities
# ------------------------------------------------------------------

def to_bool(val):
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val != 0
    if isinstance(val, str):
        return val.strip().lower() in ("true", "1", "yes", "t")
    return bool(val)

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

    user_email_lower = user_email.lower()
    emails = query_db(
        "SELECT * FROM emails WHERE LOWER(recipient_email) = %s OR LOWER(sender_email) = %s ORDER BY created_at DESC", 
        (user_email_lower, user_email_lower)
    )
    
    res = []
    for e in emails:
        parts = e["sender_email"].split('@')[0].split('.')
        initials = parts[0][0].upper() + (parts[1][0].upper() if len(parts) > 1 and len(parts[1]) > 0 else "")
        initials = initials[:2] if initials else "US"
        
        time_str = "Just Now"
        if e["created_at"]:
            time_str = str(e["created_at"])[:19]
        
        has_passkey = bool(e["passkey"] and str(e["passkey"]).strip())
        is_enc = to_bool(e["is_encrypted"]) or has_passkey
        email_body = e["body"].split('\n') if e["body"] else []
        if is_enc:
            email_body = ["🔑 [Secure Encrypted Payload - Decryption Required]"]

        attachment_info = None
        if e["attachment_name"] and not is_enc:
            attachment_info = {
                "name": e["attachment_name"],
                "size": e["attachment_size"]
            }

        # Dynamically determine folder: if requesting user is the sender (and not self-mail), show under 'sent'
        sender_lower = e["sender_email"].lower()
        recipient_lower = e["recipient_email"].lower()
        if sender_lower == user_email_lower and recipient_lower != user_email_lower:
            display_folder = "sent"
        else:
            display_folder = e["folder"] or "inbox"

        res.append({
            "id": e["id"],
            "owner_email": user_email,
            "sender": e["sender_email"].split('@')[0].replace('.', ' ').title(),
            "senderEmail": e["sender_email"],
            "initials": initials,
            "subject": e["subject"],
            "preview": "🔑 Encrypted Message" if is_enc else (e["body"][:100] if e["body"] else ""),
            "body": email_body,
            "time": time_str,
            "locked": is_enc,
            "unread": not to_bool(e["is_read"]),
            "starred": to_bool(e["is_starred"]),
            "folder": display_folder,
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
    recipient_email = data.get("recipient_email", "").strip().lower()
    sender_email = sender_email.lower()
    subject = data.get("subject", "").strip()
    body = data.get("body", "").strip()
    is_encrypted = to_bool(data.get("is_encrypted", False))
    passkey = data.get("passkey", "").strip()
    attachment_name = data.get("attachment_name")
    attachment_size = data.get("attachment_size")

    if not recipient_email or not subject:
        return jsonify({"error": "Recipient email and subject are required"}), 400

    db_body = body
    db_passkey = None
    
    if is_encrypted:
        if not passkey:
            return jsonify({"error": "Passkey is required for encryption"}), 400
        try:
            ciphertext, salt = encrypt_body(body, passkey)
            hashed = hash_passkey(passkey, salt)
            db_body = ciphertext
            db_passkey = f"{salt}:{hashed}"
        except Exception as e:
            return jsonify({"error": f"Encryption failed: {str(e)}"}), 500

    # Single-Row Storage: Insert only ONE row into database
    email_row_id = execute_db(
        """INSERT INTO emails 
        (owner_email, sender_email, recipient_email, subject, body, passkey, is_encrypted, is_read, is_starred, folder, attachment_name, attachment_size) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (recipient_email, sender_email, recipient_email, subject, db_body, db_passkey, 1 if is_encrypted else 0, 0, 0, 'inbox', attachment_name, attachment_size)
    )

###############################################################
# MOBILE SUPPORT UPDATE
# Added for React Native Mobile Application
# Purpose:
# Automatically generate a mobile notification for the recipient
# when a new email is created/sent.
# Do not remove without updating the mobile application.
    try:
        import json
        notif_title = f"New Email from {sender_email.split('@')[0].title()}"
        notif_body = f"🔒 Encrypted message: {subject}" if is_encrypted else subject
        notif_type = "encrypted_email" if is_encrypted else "new_email"
        notif_data = json.dumps({"email_id": email_row_id, "sender_email": sender_email, "type": notif_type})
        
        execute_db(
            """INSERT INTO notifications (user_email, title, body, type, data_json, is_read)
            VALUES (%s, %s, %s, %s, %s, %s)""",
            (recipient_email, notif_title, notif_body, notif_type, notif_data, 0)
        )
    except Exception as notif_err:
        print(f"[WARNING] Notification creation skipped: {notif_err}")

    return jsonify({
        "message": "Secure transmission complete",
        "recipient_email": recipient_email,
        "recipient_row_id": email_row_id,
        "sender_row_id": email_row_id,
        "email_id": email_row_id
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
    
    u_lower = user_email.lower()
    if u_lower not in (email["sender_email"].lower(), email["recipient_email"].lower(), (email["owner_email"] or "").lower()):
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
    
    u_lower = user_email.lower()
    if u_lower not in (email["sender_email"].lower(), email["recipient_email"].lower(), (email["owner_email"] or "").lower()):
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

    u_lower = user_email.lower()
    emails = query_db("SELECT body, attachment_size FROM emails WHERE LOWER(recipient_email) = %s OR LOWER(sender_email) = %s", (u_lower, u_lower))
    
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
    
    u_lower = user_email.lower()
    if u_lower not in (email["sender_email"].lower(), email["recipient_email"].lower(), (email["owner_email"] or "").lower()):
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
        try:
            salt_b64 = email["passkey"].split(':')[0]
            decrypted_body = decrypt_body(email["body"], salt_b64, input_passkey)
            return jsonify({
                "status": "decrypted",
                "body": decrypted_body.split('\n') if decrypted_body else [],
                "attachment": {
                    "name": email["attachment_name"],
                    "size": email["attachment_size"]
                } if email["attachment_name"] else None
            }), 200
        except Exception as e:
            return jsonify({"error": f"Decryption failed: {str(e)}"}), 500
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

############################################################
# MOBILE SUPPORT UPDATE
#
# Added for React Native Mobile
#
# Reason:
# Backend APIs for push token registration, notification listing,
# marking notifications read, deletion, and test notifications.
#
# Related Mobile Files:
# - Mobile/src/services/notificationService.js
# - Mobile/src/screens/Notifications/NotificationsScreen.js
# - Mobile/src/utils/pushNotificationHandler.js
#
# Date: 2026-07-24
############################################################

@app.route('/api/mobile/register-push-token', methods=['POST'])
@jwt_required()
def register_push_token():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    data = request.get_json() or {}
    push_token = data.get("push_token", "").strip()
    platform = data.get("platform", "unknown").strip()

    if not push_token:
        return jsonify({"error": "Push token is required"}), 400

    execute_db(
        """INSERT INTO devices (user_email, push_token, platform, is_active)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE platform = %s, is_active = %s""",
        (user_email, push_token, platform, 1, platform, 1)
    )

    return jsonify({"message": "Push token registered successfully"}), 200

@app.route('/api/mobile/remove-push-token', methods=['POST'])
@jwt_required()
def remove_push_token():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    data = request.get_json() or {}
    push_token = data.get("push_token", "").strip()

    if push_token:
        execute_db("DELETE FROM devices WHERE user_email = %s AND push_token = %s", (user_email, push_token))
    else:
        execute_db("DELETE FROM devices WHERE user_email = %s", (user_email,))

    return jsonify({"message": "Push token removed successfully"}), 200

@app.route('/api/mobile/notifications', methods=['GET'])
@jwt_required()
def get_mobile_notifications():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    raw_notifications = query_db(
        "SELECT * FROM notifications WHERE user_email = %s ORDER BY created_at DESC LIMIT 50",
        (user_email,)
    )

    import json
    notifications = []
    unread_count = 0
    for n in raw_notifications:
        is_read = bool(n["is_read"])
        if not is_read:
            unread_count += 1
        
        parsed_data = None
        if n["data_json"]:
            try:
                parsed_data = json.loads(n["data_json"])
            except Exception:
                parsed_data = {}

        notifications.append({
            "id": n["id"],
            "title": n["title"],
            "body": n["body"],
            "type": n["type"],
            "data": parsed_data,
            "is_read": is_read,
            "created_at": str(n["created_at"])[:19] if n["created_at"] else "Just now"
        })

    return jsonify({
        "notifications": notifications,
        "unread_count": unread_count
    }), 200

@app.route('/api/mobile/notifications/read', methods=['PUT'])
@jwt_required()
def mark_notifications_read():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    data = request.get_json() or {}
    notification_id = data.get("notification_id")

    if notification_id:
        execute_db("UPDATE notifications SET is_read = 1 WHERE id = %s AND user_email = %s", (notification_id, user_email))
    else:
        execute_db("UPDATE notifications SET is_read = 1 WHERE user_email = %s", (user_email,))

    return jsonify({"message": "Notifications marked as read"}), 200

@app.route('/api/mobile/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_mobile_notification(notification_id):
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    execute_db("DELETE FROM notifications WHERE id = %s AND user_email = %s", (notification_id, user_email))
    return jsonify({"message": "Notification deleted successfully"}), 200

@app.route('/api/mobile/test-notification', methods=['POST'])
@jwt_required()
def send_test_notification():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_email = claims.get("email")
    if not user_email:
        user_id = get_jwt_identity()
        user = query_db("SELECT email FROM users WHERE id = %s", (user_id,), one=True)
        user_email = user["email"] if user else None

    if not user_email:
        return jsonify({"error": "User identity not found"}), 404

    import json
    test_title = "🔒 Security Alert"
    test_body = "This is a test notification from SecureMail backend verification system."
    test_type = "security_alert"
    test_data = json.dumps({"test": True, "type": test_type})

    notif_id = execute_db(
        """INSERT INTO notifications (user_email, title, body, type, data_json, is_read)
        VALUES (%s, %s, %s, %s, %s, %s)""",
        (user_email, test_title, test_body, test_type, test_data, 0)
    )

    return jsonify({
        "message": "Test notification created successfully",
        "notification_id": notif_id
    }), 201

############################################################
# MOBILE SUPPORT UPDATE
#
# Added for React Native Compose Screen
#
# Purpose:
# File upload endpoint to receive email attachments from mobile
# client, validate file size/extension, and return metadata.
#
# Related Mobile Files:
# - Mobile/src/screens/Compose/ComposeScreen.js
# - Mobile/src/services/mailService.js
#
# Date: 2026-07-24
############################################################

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_attachment():
    if 'file' not in request.files:
        return jsonify({"error": "No file payload provided"}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    filename = file.filename
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)

    if file_length > 10 * 1024 * 1024:
        return jsonify({"error": "File size exceeds 10MB limit"}), 400

    if file_length >= 1024 * 1024:
        size_str = f"{round(file_length / (1024 * 1024), 2)} MB"
    else:
        size_str = f"{round(file_length / 1024, 1)} KB"

    return jsonify({
        "message": "File upload processed successfully",
        "attachment_name": filename,
        "attachment_size": size_str,
        "size_bytes": file_length
    }), 201

init_db()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
