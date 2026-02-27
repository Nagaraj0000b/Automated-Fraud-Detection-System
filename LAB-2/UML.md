# 🛡️ Automated Fraud Detection & Alerting System


##  Project Overview
The Automated Fraud Detection & Alerting System is a real-time solution that monitors bank transactions, detects suspicious activity using **rule-based logic and machine learning**, assigns a **numeric risk score**, and triggers **immediate alerts** (with optional account freezes).

Fraud analysts review flagged transactions, and the system continuously improves by retraining models using labeled feedback.

---

##  Actors
- **End User** — Bank customer performing transactions  
- **Transaction Gateway** — External source that supplies transaction events  
- **Fraud Analyst** — Reviews alerts, labels transactions, and views the dashboard  
- **System Administrator** — Manages rules, thresholds, and system settings  
- **Notification Service** — External provider that sends SMS / Email / Push notifications  

---

##  Use Cases 
- Perform Transaction  
- Validate, Sanitize & Normalize Data  
- Detect Fraud (Rules + ML + Velocity)  
- Analyze Behavioral Biometrics  
- Assign Risk Score (0–100)  
- Explain Decision (XAI / SHAP)  
- Trigger Alert & Notify  
- User Confirm / Reply  
- Freeze Transaction / Account (API)  
- Review & Label Transaction  
- Retrain ML Model (Automated Pipeline)  
- Manage Rules, Thresholds & Users  
- View Dashboard & Reports  

---

## 🔗 Key Relationships (`<<include>>` / `<<extend>>`)
- **Perform Transaction** `<<include>>` **Validate, Sanitize & Normalize Data**  
- **Validate, Sanitize & Normalize Data** `<<include>>` **Detect Fraud**  
- **Detect Fraud** `<<include>>` **Analyze Behavioral Biometrics**, **Assign Risk Score**, **Explain Decision**  
- **Assign Risk Score** `<<extend>>` **Trigger Alert & Notify**  
  - (Alert occurs when risk crosses threshold)  
- **Trigger Alert & Notify** `<<extend>>` **Freeze Transaction / Account**  
  - (For high-severity fraud cases)  
- **Review & Label Transaction** `<<include>>` **Retrain ML Model**  
- **Trigger Alert & Notify** `<<extend>>` **User Confirm / Reply**  
  - (User can confirm or deny the transaction)


