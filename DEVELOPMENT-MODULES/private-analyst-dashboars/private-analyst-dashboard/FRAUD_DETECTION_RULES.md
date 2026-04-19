# Fraud Detection Rules

This document outlines the automated logic used by the FraudGuard system to determine the status of transactions and user accounts.

## 1. Transaction Status Rules

Transactions are evaluated automatically based on the following five rules. If any "Block" rule is triggered, the transaction is immediately blocked regardless of other checks.

| Rule | Condition | Status | Action |
| :--- | :--- | :--- | :--- |
| **Single Txn Limit** | Amount > ₹5,000 | `Blocked` | Transaction rejected & Account suspended. |
| **Daily Limit** | Today's Total + Current Amount > ₹2,50,000 | `Blocked` | Transaction rejected & Account suspended. |
| **Country Change** | Current Country $\neq$ Last Transaction Country | `Blocked` | Transaction rejected & Account suspended. |
| **City/IP Anomaly** | Different City (Same Country) OR Different IP | `Flagged` | Held for manual Analyst review. |
| **Frequency (High)** | > 6 transactions per minute | `Blocked` | Transaction rejected & Account suspended. |
| **Frequency (Med)** | 4 to 6 transactions per minute | `Flagged` | Held for manual Analyst review. |
| **Normal** | All rules passed | `Approved` | Transaction processed normally. |

## 2. Automatic Account Suspension

- **Trigger:** Any transaction that is automatically marked as `Blocked`.
- **Action:** User account status is updated to `suspended`.
- **Effect:** User is blocked from system access until an Administrator reactivates the account.

---

## 3. Black Box Testing Scenarios

These cases are used to verify that the fraud engine is working correctly.

### ✅ Case 1: Normal Case
- **Input:** Amount = ₹3,000 | Today's Total = ₹0 | Same City | Tx/Min = 2
- **Expected Output:** `APPROVE`
- **Reason:** Normal user behavior; all limits within safe range.

### ❌ Case 2: Single Transaction Limit
- **Input:** Amount = ₹6,000
- **Expected Output:** `BLOCK`
- **Reason:** Exceeds the ₹5,000 single transaction limit.

### ❌ Case 3: Daily Limit Case
- **Input:** Today's Total = ₹2,48,000 | Amount = ₹5,000
- **Expected Output:** `BLOCK`
- **Reason:** Total daily volume exceeds ₹2,50,000.

### ⚠️ Case 4: Location Change (Same Country)
- **Input:** Amount = ₹3,000 | Different City (Same Country)
- **Expected Output:** `FLAG`
- **Reason:** Geographical anomaly detected (City change), requires review.

### ❌ Case 5: High Frequency
- **Input:** Amount = ₹3,000 | Tx/Min = 7
- **Expected Output:** `BLOCK`
- **Reason:** Transaction frequency exceeds the critical limit of 6 per minute.
