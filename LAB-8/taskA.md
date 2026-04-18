# Report for LAB-8 Part A: Data Access Layer Implementation

## Overview
Part A of Assignment 8 requires the creation of databases, necessary tables (or collections), and the implementation of the Data Access Layer (DAL) components.

I have just completed implementing these requirements for the Automated Fraud Detection System.

## Implementation Details

To build the Data Access Layer (DAL) and the required database structures, I utilized **MongoDB** (a NoSQL database) alongside the **Mongoose** Object Data Modeling (ODM) library. Mongoose serves as the core of our DAL, providing a robust abstraction layer that allows the application's business logic to interact securely and efficiently with the database using object-oriented JavaScript.

### 1. Database Connection Architecture
I have centralized the connection logic to abstract the connection parameters and handle the lifecycle.
*   **Location:** `DEVELOPMENT-MODULES/server/config/database.js`
*   **Functionality:** It establishes a connection to either a local MongoDB instance or a remote MongoDB Atlas cluster based on environment variables, ensuring flexibility across different environments (development, testing, production).

### 2. Data Models (Tables/Collections) Definition
I created the schemas representing the necessary entities in the `DEVELOPMENT-MODULES/server/models/` directory. Each model defines the structured schema, data validation rules, and default values required for the system:

*   **`User` Model (`users` collection):** Stores user account information, authentication credentials, assigned roles (`user`, `admin`, `analyst`, `auditor`), and associated financial account balances.
*   **`Transaction` Model (`transactions` collection):** Records financial transactions, maintaining the sender, receiver, amount, status, and specific risk scores tied to fraud detection.
*   **`AuditLog` Model (`auditlogs` collection):** Acts as the compliance log, storing system events, actions performed by users, IP addresses, and specific action types.
*   **`ReactivationRequest` Model (`reactivationrequests` collection):** Tracks requests initiated by suspended users attempting to regain access to the platform.
*   **`Setting` Model (`settings` collection):** Manages global system parameters and configurations, such as fraud thresholds and maintenance modes.

## Conclusion
The MongoDB database environment is initialized, the connection script is operational, and the Mongoose schemas are successfully implemented and exported. The DAL is now fully functional and ready to be used by the application's controller layer.

 
 