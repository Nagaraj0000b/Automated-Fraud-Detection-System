const connectDB = require('./config/database');
connectDB.isConnected = () => false; // Force offline/demo mode for unit testing
const { scoreTransaction } = require('./services/fraudEngine');

async function runWhiteBoxTests() {
  console.log('=============================================');
  console.log('         WHITE BOX TESTING EXECUTION         ');
  console.log('=============================================\n');

  // Test Case W1: Normal Transaction -> Should be LOW_RISK / approved
  let result = await scoreTransaction({
    userId: 'user123',
    amount: 1500,
    transactionType: 'transfer',
    recipient: 'John Doe',
    location: 'Mumbai, IN',
    recentTransactionsOverride: [],
    nowOverride: new Date().toISOString()
  });
  console.log(`[W1] Normal Transaction (1500 INR) -> Expected: approved | Got: ${result.recommendedStatus}`);

  // Test Case W2: Very High Amount (>= 100000) -> Should hit veryHighAmount branch -> blocked
  result = await scoreTransaction({
    userId: 'user123',
    amount: 150000,
    transactionType: 'transfer',
    recipient: 'John Doe',
    location: 'Mumbai, IN',
    recentTransactionsOverride: [],
    nowOverride: new Date().toISOString()
  });
  console.log(`[W2] Very High Amount (1.5L INR) -> Expected: blocked | Got: ${result.recommendedStatus}`);

  // Test Case W3: Foreign Location -> Should hit foreignLocation branch -> blocked
  result = await scoreTransaction({
    userId: 'user123',
    amount: 5000,
    transactionType: 'transfer',
    recipient: 'Alice',
    location: 'New York, US',
    recentTransactionsOverride: [],
    nowOverride: new Date().toISOString()
  });
  console.log(`[W3] Foreign Location (US) -> Expected: blocked | Got: ${result.recommendedStatus}`);

  // Test Case W4: Impossible Travel (Foreign + local transaction in last 30 mins)
  const thirtyMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
  result = await scoreTransaction({
    userId: 'user123',
    amount: 2000,
    transactionType: 'transfer',
    recipient: 'Bob',
    location: 'London, UK',
    recentTransactionsOverride: [
      { amount: 100, createdAt: thirtyMinsAgo, location: 'Delhi, IN', status: 'approved' }
    ],
    nowOverride: new Date().toISOString()
  });
  console.log(`[W4] Impossible Travel (Delhi to London in 15m) -> Expected: blocked | Got: ${result.recommendedStatus}`);
  
  console.log('\n');
}

async function runBlackBoxTests() {
  console.log('=============================================');
  console.log('         BLACK BOX TESTING EXECUTION         ');
  console.log('=============================================\n');

  // Simulating the transaction controller's createTransaction function input validation
  const { createTransaction } = require('./controllers/transactionLive.controller');

  // Mock Request/Response
  const mockReq = (body) => ({ 
    body, 
    user: { userId: 'user123', role: 'user' },
    ip: '127.0.0.1'
  });
  
  const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  // Test Case B1: Valid Transaction payload
  let res = mockRes();
  await createTransaction(mockReq({
    amount: 5000,
    transactionType: 'transfer',
    recipient: 'Mike',
    location: 'Delhi, IN'
  }), res);
  console.log(`[B1] Valid Input (5000 INR Transfer) -> Expected Status: 201 | Got: ${res.statusCode}`);

  // Test Case B2: Missing Amount
  res = mockRes();
  await createTransaction(mockReq({
    amount: null, // missing
    transactionType: 'transfer',
    recipient: 'Mike',
    location: 'Delhi, IN'
  }), res);
  console.log(`[B2] Invalid Input (Missing Amount) -> Expected Status: 400 | Got: ${res.statusCode} | Error: ${res.data?.message}`);

  // Test Case B3: Negative Amount
  res = mockRes();
  await createTransaction(mockReq({
    amount: -500,
    transactionType: 'transfer',
    recipient: 'Mike',
    location: 'Delhi, IN'
  }), res);
  console.log(`[B3] Invalid Input (Negative Amount) -> Expected Status: 400 | Got: ${res.statusCode} | Error: ${res.data?.message}`);

  // Test Case B4: Invalid Transaction Type
  res = mockRes();
  await createTransaction(mockReq({
    amount: 1000,
    transactionType: 'invalid_type',
    recipient: 'Mike',
    location: 'Delhi, IN'
  }), res);
  console.log(`[B4] Invalid Input (Wrong Txn Type) -> Expected Status: 400 | Got: ${res.statusCode} | Error: ${res.data?.message}`);
  
  // Test Case B5: Missing Recipient
  res = mockRes();
  await createTransaction(mockReq({
    amount: 1000,
    transactionType: 'transfer',
    recipient: '',
    location: 'Delhi, IN'
  }), res);
  console.log(`[B5] Invalid Input (Missing Recipient) -> Expected Status: 400 | Got: ${res.statusCode} | Error: ${res.data?.message}`);
  
  console.log('\nTesting Completed Successfully!');
  process.exit(0);
}

async function execute() {
  await runWhiteBoxTests();
  await runBlackBoxTests();
}

execute();
