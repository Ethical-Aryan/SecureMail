# 🔒 SecureMail

SecureMail is a secure, end-to-end encrypted email client system designed for enterprise-grade digital communication. It features a modern, responsive user interface with security-first mechanics like robust **Argon2** password hashing, **JWT-based** session authentication, and database portability supporting both **SQLite** and **MySQL**.

---

## 🚀 Tech Stack

*   **Web Frontend:** HTML5, Vanilla CSS (custom design with sleek dark gradient UI and glassmorphism components), Vanilla JavaScript.
*   **Backend Server:** Python, [Flask](https://flask.palletsprojects.com/) (RESTful API), [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/), [Flask-CORS](https://flask-cors.cgit.io/).
*   **Security & Hashing:** [Argon2-cffi](https://argon2-cffi.readthedocs.io/) (high-performance secure password hashing), JWT (JSON Web Tokens with Refresh Tokens).
*   **Databases:** [MySQL](https://www.mysql.com/) (Production-ready via `mysql-connector-python`) and [SQLite](https://www.sqlite.org/) (Zero-config local fallback).
*   **Mobile Application:** [React Native](https://reactnative.dev/) (Planned Roadmap).

---

## ✨ Features (Current Status)

1.  **Secure Authentication System:** Register and log in using an encrypted digital identity.
2.  **Master Password Strength Meter:** Real-time client-side password entropy check evaluating length, uppercase letters, numbers, and special characters.
3.  **JWT Vault Sessions:** Stateless JWT token storage in `localStorage` with automated expiration validation and session termination.
4.  **Database Portability:** Configurable environment variable switcher enabling automatic fallback to local SQLite database when MySQL is unavailable.
5.  **Clean & Responsive Dark UI:** An eye-catching glassmorphism interface featuring smooth micro-animations, customizable visibility toggles for sensitive passwords, and loading spinner states.

---

## 📁 Repository Structure

Below is the layout of the repository as it currently stands, followed by the planned modular directory structure.

### Current Layout
```text
SecureMail/
├── app.py                # Flask main backend entry point & REST API handlers
├── requirements.txt      # Python dependencies list
├── .env                  # Environment configuration settings
├── securemail.db         # SQLite local database (generated automatically)
├── structure.txt         # Roadmap specification for modular expansion
└── web/                  # Static frontend files (served by Flask)
    ├── index.html        # App interface (login, register, dashboard layouts)
    ├── css/
    │   └── style.css     # Dark mode style rules (vibrant accents & glow effects)
    └── js/
        └── app.js        # Authentication handlers, JWT verification, password meter
```

### Planned Roadmap Structure (from `structure.txt`)
To support scaling and a dedicated React Native mobile app, the repository is designed to split into:
*   **`backend/`**: Modular MVC pattern (`controllers`, `models`, `routes`, `services`, `middleware`, `schemas`).
*   **`web/`**: Full React Web App configured via Vite.
*   **`mobile/`**: React Native mobile app sharing the identical REST API backend.
*   **`docs/`**: Complete set of PRD, SRS, API docs, UML and ER diagrams.

---

## 🛠️ Environment Configuration

Configuration is managed via the environment variables in the `.env` file:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `FLASK_APP` | Entry file for Flask | `app.py` |
| `FLASK_ENV` | Running environment mode | `development` |
| `FLASK_DEBUG` | Flask debug server setting (`1` = ON, `0` = OFF) | `1` |
| `SECRET_KEY` | Key used for encrypting Flask session data | *Change in production* |
| `JWT_SECRET_KEY` | Key used to sign JWT Access/Refresh tokens | *Change in production* |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | Minutes until a JWT token expires | `60` |
| `DB_TYPE` | Primary database type to connect to (`mysql` or `sqlite`) | `sqlite` |
| `SQLITE_PATH` | Path to SQLite database file | `securemail.db` |
| `MYSQL_HOST` | MySQL hostname / server address | `localhost` |
| `MYSQL_USER` | MySQL database user | `root` |
| `MYSQL_PASSWORD` | MySQL password for the specified user | *Empty by default* |
| `MYSQL_DATABASE` | Target schema database name | `securemail` |

---

## 🏁 Getting Started

Follow these steps to set up and run SecureMail locally.

### Prerequisites
*   Python 3.8 or higher installed on your system.
*   (Optional) A local MySQL server running (e.g., via XAMPP, WampServer, Docker, or native installer) if `DB_TYPE=mysql` is desired.

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
    Create a file named `.env` in the root folder (or modify the existing one) with settings appropriate for your database choice.

---

### Database Setup

#### Option A: Local SQLite (Easiest / Standard Dev)
Set `DB_TYPE=sqlite` in your `.env`. The SQLite database (`securemail.db`) will be automatically created in the repository root directory on the first server launch. No additional configurations or database setups are required.

#### Option B: MySQL Setup (Production / Scaled)
1. Make sure your MySQL database server is running.
2. Update the environment variables in `.env` to match your local credentials:
   ```env
   DB_TYPE=mysql
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=yourpassword
   MYSQL_DATABASE=securemail
   ```
3. Run the Flask application. It will automatically check for the presence of the `securemail` database, create it if missing, and initialize the `users` table structures.

---

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
