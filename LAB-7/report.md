# LAB 8 Report: Business Logic Layer Implementation

## Automated Fraud Detection System
---

### Q1. Core Functional Modules of the Business Logic Layer and UI Interaction [10 Marks]

Based on our Layered Architecture and functional requirements, the Business Logic Layer (BLL) serves as the core decision-making brain of the Automated Fraud Detection System. It bridges the Presentation Layer (React frontend) and the Data Layer (MongoDB).

#### Core Functional Modules in the BLL

1. **Fraud Detection Rules Engine (Heuristics Engine)**
   * **Responsibility:** Executes deterministic, predefined fraud rules (e.g., `IF Transaction Amount > 5000 THEN Block`).
   * **Implementation:** Handled via `riskRule.controller.js` and the `RiskRule.js` model. It dynamically evaluates incoming transactions against active rules.
   * **UI Interaction:** Interacts with the **Admin Dashboard (`RiskRules.jsx`)**. Admins use a logic builder modal to create, enable, or disable heuristics. The engine instantly applies these rules to the `transaction.controller.js` to process future payments.

2. **Risk Classification & Scoring Module**
   * **Responsibility:** Aggregates inputs from the Rules Engine and the AI/ML Engine to calculate a definitive numeric Risk Score (0–100) and categorizes the transaction (Low, Medium, High/Critical).
   * **Implementation:** The scoring logic evaluates the weights of triggered rules and assigns a classification. If a score exceeds the threshold, it triggers the `Trigger Alert & Notify` and `Freeze Transaction` workflows.
   * **UI Interaction:** Integrates directly with the **Customer Interface (`MakePayment.jsx`)** to provide real-time transaction approval or blocking feedback. It also feeds into the **Fraud Analyst Dashboard**, visually rendering scores using color-coded severity badges.

3. **Authentication & Access Control Module**
   * **Responsibility:** Enforces system security, session management, and Role-Based Access Control (RBAC).
   * **Implementation:** Driven by `auth.middleware.js` (using JWT). It contains middleware like `verifyToken`, `requireAdmin`, and `checkMaintenanceMode`.
   * **UI Interaction:** Communicates with the **Login/OAuth UIs** and the globally rendered **Maintenance Mode UI (`Maintenance.jsx`)**, gracefully locking out non-admin users during system updates and redirecting suspended users.

---
### Q2. Business Rules, Validation Logic, and Data Transformation [30 Marks]

#### A) How are the business rules implemented for different modules?

Business rules represent the core conditions the application follows to execute its operations safely and correctly. In this project, they are implemented natively within the Express.js backend controllers and middleware:

1. **Fraud Evaluation Rules:**
   * Implemented in the **Rules Engine**. Admins define rules containing a Target Field, Operator, Threshold Value, and Action. 
   * *Example Rule Implementation:* When a user initiates a transaction, the system intercepts the request and cross-references it with active `RiskRule` documents in the database. If a rule condition matches (e.g., `amount > 50000` and `location != 'user_home_country'`), the transaction is automatically assigned a `High Risk` status, invoking the business rule to freeze the transaction and escalate it for manual review.

2. **Access Control & System Rules:**
   * Implemented via middleware (`auth.middleware.js`). 
   * **Rule:** "Suspended users cannot perform any actions." 
     * *Implementation:* `verifyToken` queries the DB for the user's current status. If `user.status === 'suspended'`, the request is immediately rejected with a `403 ACCOUNT_SUSPENDED` code.
   * **Rule:** "Only administrators can access the system during maintenance."
     * *Implementation:* `checkMaintenanceMode` evaluates the global `Setting` singleton. If `maintenanceMode` is active, it verifies if `req.user.role === 'admin'`. Non-admins receive a `503 Service Unavailable` response.

#### B) Have you implemented any validation logic for your application? Explain.

Yes, extensive validation logic is implemented to ensure data entering the system is correct, sanitized, and structurally sound before the Business Logic Layer processes it. This aligns directly with our UML Use Case: *Validate, Sanitize & Normalize Data*.

1. **Authentication & Input Validation:**
   * During user signup/signin, request payloads (`req.body`) are validated to ensure standard formats (e.g., valid email structures, minimum password lengths). 
   * JWT tokens are validated on every protected route using `jwt.verify()`. Missing, expired, or malformed tokens result in an immediate `401 Unauthorized` response.

2. **Risk Rule Creation Validation:**
   * When a System Admin uses the logic builder in `RiskRules.jsx`, the backend validates the payload to ensure that the `Operator` is valid (e.g., `=`, `>`, `<`), the `Threshold Value` matches the expected data type, and the `Action` is a recognized enum (e.g., `Block`, `Flag`, `Review`).

3. **Transaction Data Sanitization:**
   * Incoming transaction requests are checked for required fields (Amount, Currency, Recipient ID, Device Metadata). Negative transaction amounts or malformed account IDs are rejected by the validation layer before they even reach the fraud scoring engine, saving computational power and preventing application crashes.

#### C) How have you taken care of proper data transformation for your software project?

Data transformation is crucial because the raw data schema stored in MongoDB often contains sensitive, overly verbose, or technically formatted data that is not suitable for direct display on the React frontend.

1. **Transforming Database Objects to UI Payloads (DTOs):**
   * MongoDB uses `_id` fields and complex Date objects. Before sending transaction or user profiles to the Presentation Layer, the backend transforms these documents. 
   * `_id` is often mapped to `id`.
   * Sensitive fields (like password hashes or internal risk metric weights) are stripped out of the JSON response payload. 
   * Dates are converted into standardized ISO strings so the frontend can easily format them using `Intl.DateTimeFormat` or libraries like `date-fns` for the Analyst Dashboard.

2. **Transforming ML/Risk Outputs for User Comprehension:**
   * The AI/ML evaluation might return an array of probabilities or a raw SHAP value (for Explainable AI compliance). 
   * **Transformation:** The BLL transforms this raw mathematical output into a normalized 0-100 Risk Score. 
   * Furthermore, the score is transformed into distinct enumeration strings (`LOW_RISK`, `MEDIUM_RISK`, `CRITICAL_RISK`) accompanied by human-readable "Reason Codes" (e.g., "Velocity threshold exceeded"), which the UI maps to Green/Yellow/Red visual badges on the dashboard.

3. **Normalizing Incoming Data for the AI Model:**
   * Conversely, data coming *from* the UI (like a transaction request) is transformed into standardized formats before hitting the ML pipeline. Currency amounts are normalized (e.g., converted to a base currency like USD), and device metadata is hashed or categorized into encoded feature vectors that the predictive model can understand.