# Fraud Detection Rules & Testing

##  Fraud Detection Rules

🔹 **1. Single Transaction Limit**
Max per transaction = ₹5,000
amount > 5000 → BLOCK
else → OK

🔹 **2. Daily Transaction Limit**
Max per day = ₹2,50,000
todayTotal + amount > 2,50,000 → BLOCK
else → OK

🔹 **3. Location Rule**
Same city → APPROVE
Same country, different city → FLAG
Different country → BLOCK

🔹 **4. Transaction Frequency (1 min)**
≤ 3 transactions → APPROVE
4–6 transactions → FLAG
≥ 6 transactions → BLOCK

---

## ⬛ BLACK BOX TESTING (Input → Output)
 

** Test Cases**
- **Normal Case**
  `amount = 3000, todayTotal = 0, same city, tx/min = 2` $\rightarrow$ **APPROVE**
- **Single Transaction Limit**
  `amount = 6000` $\rightarrow$ **BLOCK**
- **Daily Limit Case**
  `todayTotal = 248000, amount = 5000` $\rightarrow$ **BLOCK**
- **Location Change (same country)**
  `amount = 3000, different city` $\rightarrow$ **FLAG**
- **High Frequency**
  `amount = 3000, tx/min = 7` $\rightarrow$ **BLOCK**

---

##  WHITE BOX TESTING (Logic/Condition Coverage)
 

** Test Cases**
- **amount condition (true case)**
  `amount = 7000` $\rightarrow$ **BLOCK**
  *(covers: amount > 5000)*
- **daily limit condition (true case)**
  `todayTotal = 249000, amount = 4000` $\rightarrow$ **BLOCK**
  *(covers: todayTotal + amount > 250000)*
- **location branch (city change)**
  `amount = 3000, different city` $\rightarrow$ **FLAG**
  *(covers: location condition)*
- **location branch (country change)**
  `amount = 3000, different country` $\rightarrow$ **BLOCK**
  *(covers: location condition)*
- **frequency condition**
  `tx/min = 5` $\rightarrow$ **FLAG**
  `tx/min = 7` $\rightarrow$ **BLOCK**
  *(covers: both branches)*
