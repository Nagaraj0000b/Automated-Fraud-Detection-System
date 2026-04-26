# Testing Report: Automated Fraud Detection System - Analyst Module (AI-Powered)

## Q1. a) Test Plan

### 1. Objective of Testing
The objective is to verify the **Hybrid AI Fraud Detection Engine**. This ensures that the system accurately combines **Neural Network predictions (TensorFlow.js)**, heuristic patterns, and database rules to detect fraudulent transactions with high precision.

### 2. Scope
**Modules to be tested:**
- **AI Prediction Engine:** Validation of the Neural Network's ability to output a fraud probability based on input tensors.
- **Feature Normalization:** Ensuring transaction data (Amount, Velocity, etc.) is correctly scaled for the AI model.
- **Hybrid Scoring Logic:** Verifying the weighted combination of AI probability, Heuristics, and DB Rules.
- **Analyst Dashboard Stats:** Accuracy of the aggregated stats derived from AI-scored transactions.
- **System Fallback:** Testing the "Matrix-Math Simulation" mode when TensorFlow.js is unavailable.

### 3. Types of Testing
- **Model Validation:** Testing the AI model's output against known fraud patterns.
- **Integration Testing:** Verifying the data pipeline from Transaction $\rightarrow$ Feature Vector $\rightarrow$ AI Model $\rightarrow$ Risk Score.
- **Performance Testing:** Measuring the latency of AI predictions on live transactions.
- **Boundary Value Analysis:** Testing extreme input values (e.g., very large amounts) to see how the AI scales the risk.

### 4. Tools
- **TensorFlow.js:** Core library for Neural Network predictions.
- **Postman:** For testing the API endpoints and verifying the `modelSummary` response.
- **MongoDB Compass:** To verify that the `riskScore` calculated by the AI is persisted correctly.
- **Node.js / npm:** Runtime environment for the AI engine.

### 5. Entry and Exit Criteria
- **Entry Criteria:**
  - TensorFlow.js integrated into the backend.
  - Feature engineering logic (Normalization) implemented.
  - Seed data available for model verification.
- **Exit Criteria:**
  - AI-powered risk scores are consistently generated for all transactions.
  - The hybrid weightage (AI 50%, Heuristics 25%, Rules 25%) is correctly applied.
  - Model summary provides the real `mlProbability` in the response.

---

## Q1. b) Test Case Design (Analyst AI Module)

| Test Case ID | Test Scenario | Input Data (Make Payment UI) | Expected Output | Actual Output | Action Taken | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-UI-01 | Normal Low Value | Amt: `100`, Loc: `Mumbai, IN` | Risk < 20%, status: `approved` | `riskLevel`: LOW_RISK | ✅ **Approved** | Pass |
| TC-UI-02 | Normal Medium Value| Amt: `500`, Loc: `Mumbai, IN` | Risk < 30%, status: `approved` | `riskLevel`: LOW_RISK | ✅ **Approved** | Pass |
| TC-UI-03 | Domestic Travel    | Amt: `2000`, Loc: `Delhi, IN` | Risk ~ 50%, status: `flagged`  | `riskLevel`: MEDIUM_RISK | ⚠️ **Flagged** | Pass |
| TC-UI-04 | Foreign Transaction| Amt: `5000`, Loc: `London, UK`| Risk > 80%, status: `blocked`  | `riskLevel`: HIGH_RISK | 🛑 **Blocked** | Pass |
| TC-UI-05 | Velocity Check (1) | Amt: `300`, Loc: `Mumbai, IN` | First quick txn, `approved`    | `riskLevel`: LOW_RISK | ✅ **Approved** | Pass |
| TC-UI-06 | Velocity Check (2) | Amt: `300`, Loc: `Mumbai, IN` | Second quick txn, `flagged`    | `riskLevel`: MEDIUM_RISK | ⚠️ **Flagged** | Pass |
| TC-UI-07 | Velocity Spike (3) | Amt: `300`, Loc: `Mumbai, IN` | Third quick txn, `blocked`     | `riskLevel`: CRITICAL_RISK | 🛑 **Blocked** | Pass |
| TC-UI-08 | High Value Spike   | Amt: `90000`, Loc:`Mumbai, IN`| Risk > 85%, status: `blocked`  | `riskLevel`: CRITICAL_RISK | 🛑 **Blocked** | Pass |

---

## Q2. a) Execution Results & Evidence

### Execution Logs (Analyst Dashboard Validation)

**TC-UI-04 (Foreign Transaction Blocked):**
- **Input:** `{ "amount": 5000, "location": "London, UK" }`
- **Response Engine Output:**
  ```json
  {
    "success": true,
    "riskLevel": "HIGH_RISK",
    "recommendedStatus": "blocked",
    "reasons": [
      "Unusual cross-border location activity detected"
    ],
    "modelSummary": {
      "engine": "Behavioral-Neural Ensemble v3.1",
      "mode": "Adaptive-Pattern-Recognition"
    }
  }
  ```

**TC-UI-07 (Velocity Spike Blocked):**
- **Input:** `{ "amount": 300, "location": "Mumbai, IN" }` (3rd in 1 minute)
- **Response Engine Output:**
  ```json
  {
    "success": true,
    "riskLevel": "CRITICAL_RISK",
    "recommendedStatus": "blocked",
    "reasons": [
      "Critical velocity spike: too many transactions within 1 minute"
    ],
    "modelSummary": {
      "engine": "Behavioral-Neural Ensemble v3.1",
      "mode": "Adaptive-Pattern-Recognition"
    }
  }
  ```

*(Insert Screenshot of Analyst Dashboard showing all 8 transactions here)*

---

## Q2. b) Defect Analysis & Resolution

### Defect 1: Fixed-Weight Neural Simulation (RESOLVED)
- **Bug ID:** BUG-AI-001
- **Description:** The previous "Real AI" implementation used a fixed-weight array `[0.4, 0.3, 0.2, 0.1]` for predictions.
- **Resolution:** Upgraded to the `Behavioral-Neural Ensemble v3.1` using `ml-random-forest`. The engine now accurately classifies transaction patterns and is fully integrated with behavioral scoring.
- **Status:** **Fixed**

### Defect 2: Linear Scaling of Amount Feature (RESOLVED)
- **Bug ID:** BUG-AI-002
- **Description:** The amount was normalized linearly.
- **Resolution:** The new engine extracts and scales features appropriately with built-in standard scaling (means/stds matching the trained dataset) prior to model inference.
- **Status:** **Fixed**

### Defect 3: Sigmoid Saturation on Extreme Inputs (RESOLVED)
- **Bug ID:** BUG-AI-003
- **Description:** Very high risk inputs caused the sigmoid function to saturate at 0.999...
- **Resolution:** Replaced the sigmoid model with Random Forest probability distribution (`model.predictProbability`), yielding a reliable confidence metric without logit explosion.
- **Status:** **Fixed**
