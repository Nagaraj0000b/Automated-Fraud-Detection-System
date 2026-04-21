# 🔐 Test Login Credentials

> **Note:** Run `node server/seedDatabase.js` from the `DEVELOPMENT-MODULES` directory to seed these users into MongoDB.

---

## 🛡️ Admin Accounts

| Name | Email | Password | Department |
|------|-------|----------|------------|
| Sarah Johnson | `admin@fraudshield.com` | `Admin@123` | Security Operations |
| Michael Chen | `admin2@fraudshield.com` | `Admin@456` | IT Management |

---

## 📊 Analyst Accounts

| Name | Email | Password | Department |
|------|-------|----------|------------|
| Emily Davis | `analyst@fraudshield.com` | `Analyst@123` | Fraud Analysis |
| James Wilson | `analyst2@fraudshield.com` | `Analyst@456` | Risk Assessment |

---

## 👤 User Accounts

| Name | Email | Password | Department |
|------|-------|----------|------------|
| John Smith | `user@fraudshield.com` | `User@123` | General |
| Lisa Anderson | `user2@fraudshield.com` | `User@456` | General |
| David Brown | `user3@fraudshield.com` | `User@789` | General |

---

## 🚀 How to Seed

```bash
cd DEVELOPMENT-MODULES/server
node seedDatabase.js
```

> ⚠️ **Warning:** Running the seed script will **clear all existing users** from the database and replace them with the test accounts above.
