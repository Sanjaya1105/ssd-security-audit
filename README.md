# Hot & Fast: Security Assessment and Remediation

**SE4030 – Secure Software Development | Sri Lanka Institute of Information Technology**  
**Year 4, Semester 2 | Group 47**

## 1. Project References

| Item | Details |
| --- | --- |
| Original application | [Dunkit1/Hot-Fast](https://github.com/Dunkit1/Hot-Fast) |
| Modified application | [Sanjaya1105/ssd-security-audit](https://github.com/Sanjaya1105/ssd-security-audit) |
| Original baseline | **Pending: record the original commit hash and date used for the assessment.** The assignment requires the original code to predate the semester. |

## 2. Project Overview

Hot & Fast is a restaurant management application supporting customer ordering, staff operations, inventory, recipes, production, point-of-sale transactions, payment reporting, and sales forecasting. This assessment examines vulnerabilities in the original application, implements selected mitigations, and adds Google OpenID Connect (OIDC) authentication.

The assessment is organised according to the OWASP Top 10:2025 categories. The accompanying report documents the original vulnerabilities, their security impact, implemented mitigations, verification evidence, and remaining risks. The scope is an academic security assessment rather than a complete production-readiness evaluation.

### Technology Stack

| Layer | Technologies |
| --- | --- |
| Client | React 19, Vite, React Router, Tailwind CSS, Ant Design, Axios |
| API | Node.js, Express, mysql2 |
| Data store | MySQL |
| Authentication | bcryptjs, JSON Web Tokens, HttpOnly cookies, Google OIDC |
| Payments and images | Stripe test mode, Cloudinary |
| Email | Nodemailer with Gmail configuration |
| Forecasting | Python, pandas, scikit-learn, joblib, mysql-connector-python |
| Scheduling | node-cron |

## 3. Repository Structure

```text
.
├── README.md
├── .gitignore
├── backend/
│   ├── server.js                  # Express entry point, database, headers, ML routes, cron
│   ├── package.json
│   ├── package-lock.json
│   ├── controller/                # Users, Google OIDC, payments, orders, inventory, sales
│   ├── route/                     # API route definitions and middleware composition
│   ├── middleware/
│   │   ├── AuthMiddleware.js      # JWT authentication and role checks
│   │   ├── rateLimiter.js         # In-memory authentication request counter
│   │   └── errorHandler.js        # Response sanitisation, 404 and error handling
│   ├── utils/
│   │   ├── securityLogger.js      # JSON-line security logging and alert events
│   │   └── emailService.js
│   ├── AI_MODEL_REAL_ONE/
│   │   ├── db_config.py           # Reads database configuration from backend/.env
│   │   ├── train_model.py
│   │   └── predict.py
│   └── logs/                     # Runtime output; excluded from version control
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx                # Client-side route composition
│       ├── components/            # Login, OIDC callback, role guard, layouts, uploads
│       ├── pages/                 # Ordering and operational screens
│       ├── config/                # Axios and Cloudinary configuration
│       └── styles/
├── PurchaseController.js          # Additional root-level controller file
└── tmp/                           # Local review artefacts; not application source
```

Purchase routes use `backend/controller/PurchaseController.js`. The root-level controller and `tmp/` review folder are not required to run the application. This local copy does not include database schema or seed scripts, or a runnable automated test suite.

## 4. Installation and Configuration

### Prerequisites

- Node.js and npm compatible with the supplied lockfiles. The assessment session used Node.js 24.14.0; no project-level engine constraint is declared.
- MySQL and the matching Hot & Fast database schema, including required triggers and representative test data.
- Python 3 available as `python` on PATH when forecasting is used.
- Stripe test credentials; Google OAuth credentials for Google login; Gmail credentials for email flows; Cloudinary configuration for image uploads.

**Database setup:** import a sanitised Hot & Fast database export, including the required schema, triggers, and test data, before starting the application. This local copy does not contain a complete SQL export or migration set. An empty database is insufficient; the export and import instructions are needed for reproducible setup.

### Install JavaScript Dependencies

Run from the project root in PowerShell:

```powershell
Set-Location backend
npm ci
Set-Location ../frontend
npm ci
Set-Location ..
```

### Backend Configuration

Create `backend/.env` locally. Replace the example values; do not commit the file.

```dotenv
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_imported_database_name
JWT_SECRET=REPLACE_WITH_A_NEW_RANDOM_SECRET
STRIPE_SECRET_KEY=your_stripe_test_secret_key
EMAIL_USER=your_test_email_account
EMAIL_PASS=your_email_app_password
EMAIL_PASSWORD=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/users/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Generate a random JWT secret and copy its output into `JWT_SECRET`:

```powershell
node -p "require('crypto').randomBytes(32).toString('hex')"
```

The backend requires a JWT secret of at least 32 characters; use the generated random value rather than a manually chosen phrase. Configure both `EMAIL_PASS` and `EMAIL_PASSWORD`: `UserController.js` and `emailService.js` currently use different variable names. Setting `STRIPE_WEBHOOK_SECRET` does not activate the commented webhook implementation.

### Frontend Configuration

Create `frontend/.env`:

```dotenv
VITE_STRIPE_PUBLIC_KEY=your_stripe_test_publishable_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Values prefixed with `VITE_` are exposed to the browser. Never put a Stripe secret key, Google client secret, JWT secret, or database password in this file.

### Start the Application

Backend terminal, from the project root:

```powershell
Set-Location backend
node server.js
```

Frontend terminal, from the project root:

```powershell
Set-Location frontend
npm run dev -- --port 5173 --strictPort
```

Open `http://localhost:5173` in a browser. The API runs at `http://localhost:3000`. Verify that the backend reports both server startup and a successful MySQL connection.

The server's CORS origin and many client API URLs are hardcoded to these ports. Changing `FRONTEND_URL` or `PORT` alone does not reconfigure every client request. Customer accounts can be registered through the UI. A trusted administrator must provision the initial staff account through controlled database setup; no public administrator credentials are provided.

### Forecasting Setup

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install pandas scikit-learn joblib mysql-connector-python
Set-Location backend
python AI_MODEL_REAL_ONE/train_model.py
```

The Python dependencies above are currently unpinned. Training requires compatible sales, order, and product tables with sufficient data. Run training from `backend/` because `sales_model.pkl` and `daily_sales_summary.csv` use relative paths. Start the backend with the virtual environment activated so that Python subprocesses use the same environment.

The protected `/train-model` route runs the same training script. Cron retraining runs at 02:00 in the server's timezone while the process is running. The separate `/api/predict-sales` route references `ml_models/predict_sales.py`, which is absent from this checkout; it is not a working alternative to `/predict`.

## 5. Security Improvements

| Category | Implemented control | Main source files |
| --- | --- | --- |
| A01 | Customer role for public registration; role checks for selected staff APIs; own-record checks; safe user fields | `UserController.js`, `UserRoutes.js`, `AuthMiddleware.js`, `recipeRoutes.js` |
| A02 | Staff-only ML routes; security response headers; disabled `X-Powered-By`; daily internal training | `backend/server.js` |
| A04 | Minimum JWT-secret length; `crypto.randomInt` OTPs; Python environment credentials; three-hour JWT/cookie lifetime | `UserController.js`, `server.js`, `db_config.py` |
| A05 | Real calendar-date validation; `execFile` with fixed script paths and argument arrays | `server.js`, `route/predictSales.js` |
| A06 | Database-derived payment total; order checks; Stripe status retrieval before card fulfilment; completed-payment guard | `paymentController.js`, `OrderController.js` |
| A07 | OTP revalidation at reset; expiry check; shared eight-request/15-minute authentication limit per IP | `UserController.js`, `UserRoutes.js`, `rateLimiter.js` |
| A09 | Persistent event records; failed-login, access-denied, rate-limit, OAuth and payment events; alert log entries | `utils/securityLogger.js` and calling controllers/middleware |
| A10 | Centralised sanitisation for supported JSON responses; generic server-error handling; controlled unknown-route response | `middleware/errorHandler.js` |

These controls address the selected assessment findings. Concurrent payment confirmation and complete API authorization coverage require further verification.

## 6. Google OpenID Connect

The implementation uses an authorization-code flow with `openid`, `email`, and `profile` scopes:

```text
Google button → backend authorization redirect → Google authentication
→ backend callback → state check → code exchange → ID-token verification
→ existing-user lookup / customer creation → HttpOnly JWT cookie
→ frontend callback → GET /api/users/me → role-specific home page
```

| Endpoint | Purpose |
| --- | --- |
| `GET /api/users/auth/google` | Starts Google authorization and sets an OAuth state cookie |
| `GET /api/users/auth/google/callback` | Validates state, exchanges the code, verifies the ID token, and creates the application session |
| `GET /api/users/me` | Returns safe fields for the authenticated application user |

Configure the Google web application's redirect URI to exactly match `GOOGLE_REDIRECT_URI`; ensure the account used for assessment is permitted by the Google application's consent configuration. The frontend callback is `/auth/google/callback`. New Google accounts are assigned `customer`; existing accounts retain their stored role. Customer navigation finishes at `/homeafterlogging`.

The application JWT uses a three-hour expiry. Its `token` cookie is HttpOnly, SameSite=Lax, and Secure only when `NODE_ENV=production`. The callback attempts to add `auth_provider` and `google_sub` to the existing `user` table. Provision these columns through a reviewed migration for deployment rather than granting ongoing schema-change privileges to the runtime account.

The current implementation does not include PKCE, nonce validation, dedicated Google-route throttling, or application-wide token revocation. Refresh tokens are not stored; the documented feature uses Google for sign-in only.

## 7. Verification and Assessment Evidence

Assessment methods include manual code review, Postman API testing, browser developer tools, database inspection, security-log inspection, and dependency audits. Each executed test should record the account role, request, expected outcome, and observed response. Code excerpts describe the implementation; execution results establish whether a test passed.

### Verification Commands

```powershell
# From frontend/
npm run build
npm run lint
npm audit
npm audit --omit=dev

# From backend/
npm audit
npm ls express mysql2 jsonwebtoken
```

The backend's `npm test` command is a placeholder and currently exits with an error. The report includes test excerpts, but this local copy does not contain a runnable automated security suite. Automated coverage therefore requires the corresponding test files and execution results. Record build, lint, and dependency-audit results against the revision submitted for assessment.
