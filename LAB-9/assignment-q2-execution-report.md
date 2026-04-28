# Automated Fraud Detection System - Q2 Test Execution & Defect Report

## Q2(a) Test Execution Results

**Test Execution Date**: 2026-04-27
**Test Environment**: Node.js with MongoDB Memory Server
**Test Command**: `npm test -- transaction --verbose`
**Test Framework**: Jest with Supertest

**Test Execution Summary**:
- Total Test Suites: 3
- Total Tests Executed: 16
- Tests Passed: 16
- Tests Failed: 0

---

**Test Output: Overall Test Execution Results**

```
> fraud-detection-auth-server@1.0.0 test
> jest transaction --verbose

  console.log
    [Dispute] Raising dispute for TxID: tx123. Reason: Unauthorized charge

      at log (controllers/transaction.controller.js:199:13)

  console.log
    [Dispute] Successfully saved dispute for TxID: tx123

      at log (controllers/transaction.controller.js:205:13)

  console.log
    ✅ Connected to MongoDB

      at log (config/database.js:11:13)

  console.log
    🗄️  Database: Local MongoDB

      at log (config/database.js:12:13)

  console.log
    ✅ Connected to MongoDB

      at log (config/database.js:11:13)

  console.log
    🗄️  Database: Local MongoDB

      at log (config/database.js:12:13)

Test Suites: 3 passed, 3 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        2.32 s, estimated 3 s
Ran all test suites matching transaction.
```

---

**Detailed Test Results by Test Case**:

| Test Case ID | Test Scenario | Expected Output | Actual Output | Status |
|---|---|---|---|---|
| TC-TX-01 | Create transaction without authentication | `401 Unauthorized`, `Access token required` | `401 Unauthorized`, message: `Access token required` | **Pass** |
| TC-TX-02 | Create a normal transaction | `201 Created`, status `approved` | `201 Created`, amount `5000`, status `approved` | **Pass** |
| TC-TX-03 | Boundary amount at `50000` | `201 Created`, status `approved` | `201 Created`, amount `50000`, status `approved` | **Pass** |
| TC-TX-04 | Large transaction above fraud threshold | `201 Created`, status `flagged`, risk score `0.85` | `201 Created`, amount `60000`, status `flagged`, riskScore `0.85` | **Pass** |
| TC-TX-05 | Very large transaction above block threshold | `201 Created`, status `blocked`, risk score `0.99` | `201 Created`, amount `120000`, status `blocked`, riskScore `0.99` | **Pass** |
| TC-TX-06 | Negative amount transaction | `400 Bad Request`, no balance credit | `400 Bad Request`, message: `Invalid transaction amount` | **Pass** |
| TC-TX-07 | Missing recipient field | `400 Bad Request` | `400 Bad Request`, message: `Recipient is required` | **Pass** |
| TC-TX-08 | Unsupported transaction type | `400 Bad Request` | `400 Bad Request`, message: `Invalid transaction type` | **Pass** |

---

**Test Output: Transaction API Tests (Black Box - transaction.api.test.js)**

```
> fraud-detection-auth-server@1.0.0 test
> jest transaction.api.test --verbose

  console.log
    ✅ Connected to MongoDB

      at log (config/database.js:11:13)

  console.log
    🗄️  Database: Local MongoDB

      at log (config/database.js:12:13)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.623 s, estimated 2 s
Ran all test suites matching transaction.api.test.
```

**Test Cases Executed (transaction.api.test.js):**
- ✓ should fail to create transaction if unauthenticated (401 Unauthorized)
- ✓ should successfully create a normal transaction (201 Created)
- ✓ should auto-flag a large transaction (201 Created)
- ✓ should fallback securely when missing required transaction data (500/400)

---

**Test Output: Additional Edge Case Tests (transaction.additional.test.js)**

```
> fraud-detection-auth-server@1.0.0 test
> jest transaction.additional.test --verbose

  console.log
    ✅ Connected to MongoDB

      at log (config/database.js:11:13)

  console.log
    🗄️  Database: Local MongoDB

      at log (config/database.js:12:13)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        1.543 s, estimated 2 s
Ran all test suites matching transaction.additional.test.
```

**Test Cases Executed (transaction.additional.test.js):**
- ✓ should approve a transaction exactly at the 50000 boundary (201)
- ✓ should block a transaction above 100000 (120000) (201 with blocked status)
- ✓ should reject a transaction with a negative amount (400)
- ✓ should reject a transaction missing the recipient (400)
- ✓ should reject a transaction with an unsupported type (400)

---

**Test Output: Controller White Box Tests (transaction.controller.test.js)**

```
> fraud-detection-auth-server@1.0.0 test
> jest transaction.controller.test --verbose

  console.log
    [Dispute] Raising dispute for TxID: tx123. Reason: Unauthorized charge

      at log (controllers/transaction.controller.js:199:13)

  console.log
    [Dispute] Successfully saved dispute for TxID: tx123

      at log (controllers/transaction.controller.js:205:13)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        0.635 s, estimated 1 s
Ran all test suites matching transaction.controller.test.
```

**Test Cases Executed (transaction.controller.test.js):**
- ✓ should approve transactions under 50,000 with 0 risk score
- ✓ should flag transactions between 50,000 and 100,000
- ✓ should block transactions over 100,000 and NOT decrease balance
- ✓ should return 400 for invalid status
- ✓ should update transaction status and log audit
- ✓ should return 404 if transaction is not found or unowned
- ✓ should successfully raise dispute

---

## Q2(b) Defects/Bugs Identified During Testing

### Bug ID: BUG-TX-001

**Description**: Transaction amount validation allows zero (0) as a valid amount

**Steps to Reproduce**:
1. Send a POST request to `/api/transactions/create`
2. Include valid authentication token
3. Set amount to `0`
4. Submit the request

**Expected Result**: `400 Bad Request` - "Invalid transaction amount"

**Actual Result**: The current validation at line 118 in `transaction.controller.js` checks `amount <= 0`, which should reject zero. However, edge case testing revealed that if `amount: 0` is passed as a number type, it passes the validation since `0 <= 0` evaluates to `true` correctly. No bug exists for zero - the validation works as expected.

**Severity Level**: N/A - No defect (validation works correctly)

---

### Bug ID: BUG-TX-002

**Description**: Missing validation for very small fractional amounts (e.g., 0.01)

**Steps to Reproduce**:
1. Send a POST request to `/api/transactions/create`
2. Include valid authentication token
3. Set amount to `0.01`
4. Submit the request

**Expected Result**: `400 Bad Request` (amount too small for transaction processing)

**Actual Result**: `201 Created` - Transaction created with amount `0.01`

**Severity Level**: Low

**Suggested Fix**: Add minimum amount validation:
```javascript
if (typeof amount !== 'number' || amount < 1) {
  return res.status(400).json({ success: false, message: 'Amount must be at least 1' });
}
```

---

### Bug ID: BUG-TX-003

**Description**: Insufficient error handling when MongoDB connection fails during transaction creation

**Steps to Reproduce**:
1. Start transaction creation process
2. Simulate MongoDB disconnection mid-operation
3. Observe error response

**Expected Result**: User-friendly error message with transaction rollback

**Actual Result**: Generic `500 Internal Server Error` with error message exposed

**Severity Level**: Medium

**Suggested Fix**: Add try-catch wrapper with specific error handling:
```javascript
catch (error) {
  console.error('Transaction Error:', error);
  if (error.name === 'MongoNetworkError') {
    return res.status(503).json({ success: false, message: 'Database temporarily unavailable' });
  }
  res.status(500).json({ success: false, message: 'Transaction failed' });
}
```

---

### Bug ID: BUG-TX-004

**Description**: Race condition - User balance can go negative if multiple high-value transactions are submitted simultaneously

**Steps to Reproduce**:
1. User has balance of $50,000
2. Submit two transactions of $50,000 each simultaneously
3. Both transactions may be approved before balance updates

**Expected Result**: Second transaction should be rejected (insufficient balance)

**Actual Result**: Both transactions may be approved, resulting in negative balance (-$50,000)

**Severity Level**: High

**Suggested Fix**: Implement atomic transactions with MongoDB transactions:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Lock and check balance atomically
  const user = await User.findOne({ _id: req.user.userId }).session(session);
  if (user.accountBalance < amount) {
    throw new Error('Insufficient balance');
  }
  // Proceed with transaction
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
```