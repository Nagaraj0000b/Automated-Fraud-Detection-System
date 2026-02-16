# Assignment 4 Consolidated Discussion: Automated Fraud Detection System

We discussed the system design outcomes and finalized two deliverables: `lab4_part1.pdf` (architecture selection and justification) and `lab4_part2.pdf` (application component decomposition). This document records the final agreed discussion points that led to those submissions.

## Discussion Outcome 1: Architecture Selection

We selected **Layered Architecture** for the Automated Fraud Detection System. The team agreed this structure best fits fraud detection because responsibilities are separated cleanly and each layer communicates with adjacent layers in a controlled flow.

The final 4-layer architecture from Part 1 is:
- Presentation Layer
- Application Layer
- Business Logic Layer
- Data Layer

Why we finalized this choice:
- It improves modularity by isolating UI, orchestration, fraud logic, and persistence.
- It improves maintainability because changes in one layer have limited impact on others.
- It supports scalability by allowing core services and data access paths to scale independently.
- It supports secure separation of responsibilities, especially between user interaction, detection logic, and data handling.

## Discussion Outcome 2: Layer Responsibilities (Part 1)

### Presentation Layer
- Provides interfaces for bank customers, fraud analysts, and system administrators.
- Displays transaction status, risk alerts, and reports.
- Captures user actions such as transaction initiation, approval inputs, and review actions.

### Application Layer
- Acts as the control and coordination layer between presentation and core logic.
- Orchestrates transaction monitoring and risk evaluation requests.
- Manages workflow outcomes: **approve**, **block**, or **manual review**.

### Business Logic Layer
- Hosts the core fraud detection engine.
- Applies fraud rules and AI-assisted evaluation to detect suspicious activity.
- Performs risk scoring and pattern analysis.
- Classifies transactions as **Low**, **Medium**, or **High/Critical** risk before returning decisions to the application layer.

### Data Layer
- Stores transaction records and fraud logs.
- Maintains references to external fraud-related data sources.
- Handles secure data queries used by business logic for detection analysis.

Risk evaluation flow agreed in discussion:
- Incoming transaction reaches Presentation and Application flow.
- Business Logic computes score and classification (`Low`, `Medium`, `High/Critical`).
- Application executes decision path (`approve`, `block`, `manual review`).
- Data Layer persists results and audit-relevant records.

## Discussion Outcome 3: Why This Architecture Was Finalized

### Scalability
- Fraud detection processing and database workloads can be scaled independently.
- The layered split supports cloud deployment patterns without redesigning the full system.

### Maintainability
- Separation of concerns enables simpler debugging and targeted testing.
- New rules or detection improvements can be added in business logic without changing user-facing interfaces.

### Performance
- Risk scoring and detection computations are centralized in the business logic path.
- Real-time monitoring and fast decision routing allow efficient transaction approval or blocking.

### Security
- Sensitive detection and identity-related checks remain isolated from direct UI concerns.
- Data access is controlled through the lower layer boundary, improving secure handling and traceability.
- Real-time alerting reduces exposure time for suspicious activity.

## Discussion Outcome 4: Application Components (Part 2)

From Part 2, we extended the design into a 5-layer component mapping:
- Presentation Components
- Application/Service Components
- Business Logic Components
- Integration Components
- Data Management Components

### 1) Presentation Components
- **Customer Interface**: Displays transaction status and fraud alerts to end users.
- **Fraud Analyst Dashboard**: Supports viewing flagged transactions and case investigation.
- **System Admin Console**: Manages fraud rules, AI model settings, and compliance controls.

### 2) Application/Service Components
- **Transaction Monitoring Service**: Tracks real-time transactions and behavior signals.
- **Risk Scoring Service**: Calculates risk scores per transaction.
- **Transaction Decision Service**: Decides approve/flag/block based on thresholds.
- **Manual Review Service**: Routes suspicious transactions to analyst investigation.
- **Alert Management Service**: Generates and dispatches real-time fraud notifications.

### 3) Business Logic Components
- **Fraud Detection Rules Engine**: Executes predefined and dynamic fraud rules.
- **AI/ML Risk Evaluation Engine**: Detects anomalies and predicts fraud likelihood.
- **Risk Classification Module**: Assigns Low, Medium, or High risk categories.

### 4) Integration Components
- **External Fraud Database Connector**: Connects to blacklists and fraud intelligence feeds.
- **Notification Service Adapter**: Integrates with SMS, email, and push channels.
- **Banking/Payment Gateway Interface**: Exchanges data with core banking and payment systems.

### 5) Data Management Components
- **Transaction Database**: Stores transaction details, risk scores, and outcomes.
- **User and Role Database**: Maintains user identities, roles, and access permissions.
- **Audit and Compliance Repository**: Preserves logs and trails for regulatory needs.
- **Case Management Database**: Stores investigation history and analyst actions.

## Final Agreed Summary

We finalized two linked outcomes through this discussion:
- **Part 1** established the architecture decision: Layered Architecture with defined responsibilities and justification.
- **Part 2** finalized the component-level decomposition across five functional layers.

These outcomes together form the implementation baseline for the Automated Fraud Detection System in Assignment 4.
