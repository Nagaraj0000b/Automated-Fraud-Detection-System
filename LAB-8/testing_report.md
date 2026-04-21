# Software Testing Report: Fraud Detection System

As requested, here are the different test cases covering both **White Box Testing** (Glass Box Testing) and **Black Box Testing** (Functional Testing) for the Fraud Detection system, along with the results of their execution.

## 1. White Box Testing (Glass Box Testing)

White box testing evaluates the internal structure, logic, and branches of the code. We are testing the internal `scoreTransaction` function within the `fraudEngine.js` module to ensure that all logical pathways (heuristics & rules) execute correctly.

### Test Cases (White Box)

| Test Case ID | Description / Internal Logic Path | Input Details | Expected Internal State & Output | Result |
| :--- | :--- | :--- | :--- | :--- |
| **W1** | **Normal Flow** (No rules triggered) | Amount: ₹1,500, Location: Local (IN) | Heuristics remain low. Recommended status: `approved`. | PASS |
| **W2** | **High Amount Branch** (`veryHighAmount` logic) | Amount: ₹1,50,000 (>= 100k) | Hits `if (veryHighAmount)` branch. Adds 0.55 to heuristic score. Status: `blocked`. | PASS |
| **W3** | **Foreign Location Branch** (`isForeignLocation` logic) | Location: "New York, US" | Hits `else if (foreignLocation)` branch. Adds 0.55 to score. Status: `blocked`. | PASS |
| **W4** | **Impossible Travel Branch** (Time & Location mismatch) | Foreign Txn 15 mins after a Local Txn | Hits `if (impossibleTravel)` branch. Adds 0.65 to score. Status: `blocked`. | PASS |

> [!NOTE]
> *Execution Details:* The script injected mock transaction data directly into the `scoreTransaction` function to evaluate the exact decision trees and heuristics calculated inside the engine.

---

## 2. Black Box Testing (Functional Testing)

Black box testing evaluates the system purely based on inputs and expected outputs, without interacting with the internal code logic. We are testing the `/api/transactions/create` API endpoint via the `transactionLive.controller.js`.

### Test Cases (Black Box)

| Test Case ID | Description | Input Payload | Expected API Response | Result |
| :--- | :--- | :--- | :--- | :--- |
| **B1** | **Valid Payload** | Amount: 5000, Type: "transfer", Recipient: "Mike", Location: "Delhi, IN" | HTTP 201 Created | PASS |
| **B2** | **Missing Amount Validation** | Amount: null, Type: "transfer", Recipient: "Mike" | HTTP 400 Bad Request ("Valid amount is required") | PASS |
| **B3** | **Negative Amount Validation** | Amount: -500, Type: "transfer", Recipient: "Mike" | HTTP 400 Bad Request ("Valid amount is required") | PASS |
| **B4** | **Invalid Transaction Type** | Amount: 1000, Type: "invalid_type" | HTTP 400 Bad Request ("Invalid transaction type") | PASS |
| **B5** | **Missing Recipient Validation** | Amount: 1000, Type: "transfer", Recipient: "" (Empty) | HTTP 400 Bad Request ("Recipient is required") | PASS |

> [!IMPORTANT]
> *Execution Details:* The tests passed simulated HTTP Requests to the API controller to ensure proper handling of request validation without directly evaluating the internal state variables.

---

## Execution Output Log

I wrote a test script (`run_tests.js`) and executed these cases against the backend system. Here is the raw output confirming everything works:

```text
=============================================
         WHITE BOX TESTING EXECUTION         
=============================================

[W1] Normal Transaction (1500 INR) -> Expected: approved | Got: approved
[W2] Very High Amount (1.5L INR) -> Expected: blocked | Got: blocked
[W3] Foreign Location (US) -> Expected: blocked | Got: blocked
[W4] Impossible Travel (Delhi to London in 15m) -> Expected: blocked | Got: blocked


=============================================
         BLACK BOX TESTING EXECUTION         
=============================================

[B1] Valid Input (5000 INR Transfer) -> Expected Status: 201 | Got: 201
[B2] Invalid Input (Missing Amount) -> Expected Status: 400 | Got: 400 | Error: Valid amount is required
[B3] Invalid Input (Negative Amount) -> Expected Status: 400 | Got: 400 | Error: Valid amount is required
[B4] Invalid Input (Wrong Txn Type) -> Expected Status: 400 | Got: 400 | Error: Invalid transaction type
[B5] Invalid Input (Missing Recipient) -> Expected Status: 400 | Got: 400 | Error: Recipient is required

Testing Completed Successfully!
```
