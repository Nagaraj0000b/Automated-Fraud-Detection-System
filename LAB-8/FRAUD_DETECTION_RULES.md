# Fraud Detection Rules

This document outlines the automated logic used by the FraudGuard system to determine the status of transactions and user accounts.

## 1. Transaction Status Rules

Transactions are evaluated immediately upon creation based on the transaction amount.

| Condition | Status | Risk Score | Action |
| :--- | :--- | :--- | :--- |
| **Amount > ₹1,00,000** | `Blocked` | 0.99 (Critical) | Transaction is rejected. User account is automatically suspended. |
| **Amount > ₹50,000** | `Flagged` | 0.85 (High) | Transaction is held for manual review by an Analyst. |
| **Amount $\le$ ₹50,000** | `Approved` | 0.00 (Low) | Transaction is processed normally. |

## 2. Automatic Account Suspension

To prevent further potential fraud, the system implements an automatic lockout mechanism:

- **Trigger:** Any transaction that is automatically marked as `Blocked`.
- **Action:** The user's account status is updated to `suspended`.
- **Effect:** The user is immediately blocked from accessing the system until an Administrator manually reactivates the account.

## 3. Manual Review Process

Transactions marked as `Flagged` are sent to the Analyst Portal. An analyst can manually change the status to:
- **Approved:** Clear the transaction and allow it to proceed.
- **Blocked:** Reject the transaction and trigger account suspension.

## 4. Audit Logging

Every automated and manual action (Blocking, Flagging, Suspending) is recorded in the Audit Logs with the following details:
- Actor (System AI or Admin Name)
- Target (Transaction ID or User Email)
- Reason/Risk Score
- Timestamp and IP Address
