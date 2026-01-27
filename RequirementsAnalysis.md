# Automated Fraud Detection & Alerting System

A real-time system that monitors financial transactions, detects suspicious activity using rule-based logic and machine learning, assigns a risk score, and triggers instant alerts to prevent fraud while minimizing false positives.

## Purpose

To help financial institutions detect and stop fraudulent transactions at the moment they occur, reducing financial loss and improving customer trust.

## Problem Statement

Traditional fraud detection systems rely on static rules, leading to:

High false positives (legitimate users blocked)

Poor detection of new and evolving fraud patterns

This project addresses these issues using dynamic behavioral analysis and ML-based detection.

## Scope

Integrates with a bank’s transaction gateway

Analyzes transactions in real time

Flags or blocks suspicious transactions

Provides dashboards for analysts and administrators

 Note: The system does not perform fund transfers. It acts as a gatekeeper.

## Actors

End User – Bank customer performing transactions

Fraud Analyst – Reviews and labels suspicious transactions

System Administrator – Manages rules, thresholds, and reports

Transaction Gateway – Supplies transaction data

Notification Service – Sends SMS/Email/Push alerts

## High-Level Workflow

Transaction is received in real time

Data is validated, sanitized, and normalized

Fraud is detected using rules + ML

A risk score (0–100) is assigned

High-risk transactions trigger alerts and possible account freeze

Analysts review alerts and provide feedback

System retrains models using feedback

## Functional Features
### Transaction Processing

Real-time JSON transaction ingestion

Field validation and error logging

Currency normalization

### Fraud Detection Engine

Rule-based checks (thresholds, velocity)

ML-based fraud probability scoring

Risk classification (High / Medium / Low)

### Alerts & Actions

Alerts sent within 5 seconds (SMS/Email/Push)

API to freeze/unfreeze transactions

User confirmation for false alarms

### Dashboard & Reporting

Live fraud statistics dashboard

Advanced search & filtering

Monthly PDF/CSV fraud reports

### Model Lifecycle

Analyst labeling (Fraud / Safe)

Automated retraining pipeline

## Innovative Features

Behavioral Biometrics – typing speed, touch/mouse patterns

Explainable AI (XAI) – human-readable reasons for alerts

Feedback Loop Learning – continuous model improvement



## Non-Functional Requirements

 Latency

 Scalability

 Security

 Availability

 Accuracy