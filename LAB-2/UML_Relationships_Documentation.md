# UML Diagram - Relationships and Cardinality Documentation

## Overview
This document details all relationships and cardinality in the Automated Fraud Detection System UML use case diagram.

---

## Actors

### Primary Actors (Internal)
1. **Bank Customer** - End user performing transactions
2. **System Admin** - Manages system configuration and rules
3. **Fraud Analyst** - Reviews flagged transactions and provides feedback

### Secondary Actors (External)
4. **External Fraud DB** - External fraud intelligence database
5. **Notification Service** - External notification provider (SMS/Email/Push)

---

## Use Cases with Relationships

### 1. Transaction Processing Flow

#### Monitor Transaction & Bengalure
- **Actor**: Bank Customer
- **Cardinality**: `1..*` (one customer can perform many transactions)
- **Relationship**: Association (solid line)
- **Includes**: Validate, Sanitize & Normalize Data

#### Validate, Sanitize & Normalize Data
- **Included by**: Monitor Transaction & Bengalure
- **Relationship**: `<<include>>` (always executed)
- **Includes**: Detect Fraud (Rules + ML + Velocity)

---

### 2. Fraud Detection Core

#### Detect Fraud (Rules + ML + Velocity)
- **Included by**: Validate, Sanitize & Normalize Data
- **Relationship**: `<<include>>` (mandatory step)
- **Includes** (all mandatory):
  - Analyze Behavioral Biometrics
  - Assign Risk Score
  - Explain Decision (XAI)
- **External Integration**: External Fraud DB (queries fraud patterns)

#### Analyze Behavioral Biometrics
- **Included by**: Detect Fraud
- **Relationship**: `<<include>>`
- **Purpose**: Analyzes user behavior patterns (device, location, typing patterns)

#### Assign Risk Score
- **Included by**: Detect Fraud
- **Relationship**: `<<include>>`
- **Purpose**: Calculates numeric risk score (0-100)
- **Extended by**: Trigger Alert & Notify (when risk threshold exceeded)

#### Explain Decision (XAI)
- **Included by**: Detect Fraud
- **Relationship**: `<<include>>`
- **Purpose**: Provides explainability using SHAP/XAI methods

---

### 3. Alert and Response System

#### Trigger Alert & Notify
- **Extends**: Assign Risk Score
- **Relationship**: `<<extend>>` (conditional execution)
- **Condition**: `{High Risk}` - triggered when risk score > threshold
- **External Integration**: Notification Service (sends alerts)
- **Extended by**:
  - Log for Manual Review
  - Freeze Transaction / Account (API)
  - User Confirm / Reply

#### Log for Manual Review
- **Extends**: Trigger Alert & Notify
- **Relationship**: `<<extend>>`
- **Purpose**: Queues medium-risk transactions for analyst review

#### Freeze Transaction / Account (API)
- **Extends**: Trigger Alert & Notify
- **Relationship**: `<<extend>>`
- **Condition**: `{Medium Risk}` - for suspicious but not confirmed fraud
- **Purpose**: Temporarily blocks account/transaction

#### User Confirm / Reply
- **Extends**: Trigger Alert & Notify
- **Relationship**: `<<extend>>`
- **Purpose**: Allows customer to confirm or deny transaction legitimacy

---

### 4. Analysis and Continuous Improvement

#### Review & Label Transaction
- **Actor**: Fraud Analyst
- **Cardinality**: `1..*` (one analyst can review many transactions)
- **Relationship**: Association
- **Includes**: Retrain ML Model (Automated Pipeline)

#### Retrain ML Model (Automated Pipeline)
- **Included by**: Review & Label Transaction
- **Relationship**: `<<include>>`
- **Purpose**: Uses labeled data to improve ML model accuracy

#### View Dashboard & Reports
- **Actor**: Fraud Analyst
- **Cardinality**: `1` (one analyst access at a time)
- **Relationship**: Association
- **Purpose**: Monitor fraud metrics and system performance

---

### 5. System Management

#### Manage Risk Rules & AI Models
- **Actor**: System Admin
- **Cardinality**: `1` (single admin session)
- **Relationship**: Association
- **Purpose**: Configure detection rules, thresholds, and model parameters

#### Generate Compliance Audit
- **Actor**: Bank Customer (indirect)
- **Relationship**: Available for compliance reporting
- **Purpose**: Creates audit trails for regulatory compliance (GDPR, CCPA, EU AI Act)

---

## Relationship Types Summary

### `<<include>>` Relationships (Mandatory)
These relationships represent essential, always-executed dependencies:

1. **Monitor Transaction** `<<include>>` **Validate, Sanitize & Normalize Data**
   - Every transaction must be validated
   
2. **Validate, Sanitize & Normalize Data** `<<include>>` **Detect Fraud**
   - Validated data must be checked for fraud
   
3. **Detect Fraud** `<<include>>` **Analyze Behavioral Biometrics**
   - Behavioral analysis is mandatory
   
4. **Detect Fraud** `<<include>>` **Assign Risk Score**
   - Every transaction gets a risk score
   
5. **Detect Fraud** `<<include>>` **Explain Decision (XAI)**
   - All decisions must be explainable
   
6. **Review & Label Transaction** `<<include>>` **Retrain ML Model**
   - Labeled data automatically triggers retraining

---

### `<<extend>>` Relationships (Conditional)
These relationships represent optional or conditional behaviors:

1. **Assign Risk Score** `<<extend>>` **Trigger Alert & Notify**
   - **Condition**: `{High Risk}` (risk score > threshold)
   - Only high-risk transactions trigger alerts
   
2. **Trigger Alert & Notify** `<<extend>>` **Log for Manual Review**
   - Medium-risk cases queued for analyst review
   
3. **Trigger Alert & Notify** `<<extend>>` **Freeze Transaction / Account**
   - **Condition**: `{Medium Risk}`
   - Suspicious transactions may be frozen
   
4. **Trigger Alert & Notify** `<<extend>>` **User Confirm / Reply**
   - Customer can respond to alerts to confirm/deny transaction

---

## Cardinality Specifications

### Actor to Use Case Cardinality

| Actor | Use Case | Cardinality | Meaning |
|-------|----------|-------------|---------|
| Bank Customer | Monitor Transaction | `1..*` | One customer can perform multiple transactions |
| System Admin | Manage Risk Rules | `1` | One admin session at a time |
| Fraud Analyst | Review & Label Transaction | `1..*` | One analyst can review many transactions |
| Fraud Analyst | View Dashboard | `1` | One analyst access session |
| External Fraud DB | Detect Fraud | `0..*` | May query database multiple times or not at all |
| Notification Service | Trigger Alert & Notify | `1..*` | One alert can trigger multiple notifications (SMS + Email + Push) |

---

## System Boundary

All use cases are contained within the **Automated Fraud Detection System** boundary, represented by a rectangle. External actors (External Fraud DB, Notification Service) are outside this boundary, indicating they are external systems integrated via APIs.

---

## Design Rationale

### Why `<<include>>` for Core Flow?
- Validation, fraud detection, and risk scoring are **mandatory** steps
- Every transaction must go through this pipeline
- Ensures consistency and completeness

### Why `<<extend>>` for Alerts?
- Alerts are **conditional** - only triggered for high-risk transactions
- Minimizes false positives and customer friction
- Different actions (review, freeze, user confirm) are optional based on risk level

### Cardinality Choices
- `1..*` for customer transactions reflects real-world usage (multiple transactions per customer)
- `1` for admin operations ensures controlled access and prevents conflicts
- `1..*` for analyst reviews reflects workload (one analyst handles many cases)

---

## Compliance and Explainability

The diagram includes **Explain Decision (XAI)** as a mandatory `<<include>>` relationship to ensure compliance with:
- **EU AI Act** - Requires explainable AI decisions
- **GDPR** - Users have right to explanation for automated decisions
- **Internal audits** - Provides transparency for fraud detection logic

---

## Future Extensions

Potential additional use cases to consider:
- **Generate Compliance Audit** - For regulatory reporting
- **Calculate Risk Score** - More granular scoring mechanisms
- **Multi-Factor Authentication** - Enhanced security for high-risk operations
- **Behavioral Analysis Training** - Continuous learning from user patterns

---

*Last Updated: 2026-02-03*
