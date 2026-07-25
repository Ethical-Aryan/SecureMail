# 🔒 SecureMail

SecureMail is a secure, end-to-end encrypted email client system designed for enterprise-grade digital communication. It features a modern, responsive user interface with security-first mechanics like robust **Argon2** password hashing, **JWT-based** session authentication, and persistent **MySQL** database storage.

👉 **Live Demo:** [https://securemail-km5i.onrender.com/](https://securemail-km5i.onrender.com/)

---

## 🚀 Tech Stack

*   **Web Frontend:** HTML5, Vanilla CSS (custom design with sleek dark gradient UI and glassmorphism components), Vanilla JavaScript.
*   **Backend Server:** Python, [Flask](https://flask.palletsprojects.com/) (RESTful API), [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/), [Flask-CORS](https://flask-cors.cgit.io/).
*   **Security & Hashing:** [Argon2-cffi](https://argon2-cffi.readthedocs.io/) (high-performance secure password hashing), JWT (JSON Web Tokens with Refresh Tokens).
*   **Database:** [MySQL](https://www.mysql.com/) (Production database single source of truth via `mysql-connector-python` connection pool).
*   **Mobile Application:** [React Native](https://reactnative.dev/) (Dedicated mobile client).

---

## ✨ Features (Current Status)

1.  **Secure Authentication System:** Register and log in using an encrypted digital identity.
2.  **Master Password Strength Meter:** Real-time client-side password entropy check evaluating length, uppercase letters, numbers, and special characters.
3.  **JWT Vault Sessions:** Stateless JWT token storage with automated expiration validation and session termination.
4.  **Single Source of Truth MySQL Architecture:** Persistent, highly available MySQL database serving both Web and Mobile clients through Flask REST APIs.
5.  **Clean & Responsive Dark UI:** An eye-catching glassmorphism interface featuring smooth micro-animations, customizable visibility toggles for sensitive passwords, and loading spinner states.

---

## 📁 Repository Structure

Below is the layout of the repository as it currently stands.

### Current Layout
```text
SecureMail/
├── app.py                # Flask main backend entry point, MySQL connection pool & REST API handlers
├── crypto_vault.py       # AES-256-GCM encryption & PBKDF2 key derivation functions
├── test_crypto.py        # Unit tests for the cryptographic functions
├── requirements.txt      # Python dependencies list
├── .env                  # Environment configuration settings (ignored by Git)
├── scripts/
│   └── migrate_sqlite_to_mysql.py # One-time SQLite to MySQL data migration utility
├── Mobile/               # React Native mobile application codebase
└── web/                  # Web frontend files served by Flask
    ├── templates/        # HTML templates for rendering views
    │   ├── index.html    # Core homepage/redirect interface
    │   ├── login.html    # Login view with glassmorphism UI
    │   ├── register.html # Registration view with password strength meter
    │   └── dashboard.html# User dashboard view for viewing and composing encrypted emails
    └── static/           # Static assets
        ├── css/
        │   └── style.css # Custom dark theme styles (vibrant gradients & glassmorphism)
        └── js/
            ├── login.js  # JavaScript handler for user authentication
            ├── register.js# JavaScript handler for user registration & strength meter
            └── dashboard.js# JavaScript handler for viewing, composing, and decrypting emails
```

---

## 🛠️ Environment Configuration

Configuration is managed via environment variables in the `.env` file:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `FLASK_APP` | Entry file for Flask | `app.py` |
| `FLASK_ENV` | Running environment mode | `development` |
| `FLASK_DEBUG` | Flask debug server setting (`1` = ON, `0` = OFF) | `1` |
| `SECRET_KEY` | Key used for encrypting Flask session data | *Change in production* |
| `JWT_SECRET_KEY` | Key used to sign JWT Access/Refresh tokens | *Change in production* |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | Minutes until a JWT token expires | `60` |
| `MYSQL_HOST` | MySQL hostname / server address | `securemail-db.aivencloud.com` |
| `MYSQL_PORT` | MySQL server port | `15109` |
| `MYSQL_USER` | MySQL database user | `avnadmin` |
| `MYSQL_PASSWORD` | MySQL password for the specified user | *Set in .env* |
| `MYSQL_DATABASE` | Target schema database name | `defaultdb` |

---

## 🏁 Getting Started

Follow these steps to set up and run SecureMail locally.

### Prerequisites
*   Python 3.8 or higher installed on your system.
*   A MySQL database instance (e.g., Aiven MySQL, local XAMPP/WampServer, Docker, or native installer).

### Installation
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/SecureMail.git
    cd SecureMail
    ```

2.  **Create and Activate a Virtual Environment:**
    ```bash
    python -m venv venv
    
    # On Windows (PowerShell/CMD)
    .\venv\Scripts\activate
    
    # On macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Required Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Configure `.env` in the root directory with your MySQL credentials:
    ```env
    MYSQL_HOST=localhost
    MYSQL_PORT=3306
    MYSQL_USER=root
    MYSQL_PASSWORD=yourpassword
    MYSQL_DATABASE=securemail
    ```

5.  **Launch Backend Server:**
    ```bash
    python app.py
    ```


### Running the Server
Execute the application runner using Python:
```bash
python app.py
```
By default, the server will launch in debug mode on:
👉 **[http://localhost:5000](http://localhost:5000)**

You can open this URL in any modern web browser to interact with the frontend vault.

---

## 🔒 Security Design Highlights

*   **Argon2 Hashing Algorithm:** Uses the Argon2 password hashing function (winner of the Password Hashing Competition), configured with memory-hard and time-hard parameters to render brute-force GPU/ASIC attacks computationally infeasible.
*   **JWT Client Authentication:** Standard authentication tokens are generated as signed JWTs and sent securely to the client, preventing database roundtrips for state tracking while assuring server-side session validation.
*   **Email Form Normalization:** Utilizes domain checks and normalizes mail addresses to prevent input injection attacks and credential ambiguity.
