function extractFeatures(transaction) {
  const amount = parseFloat(transaction.amount || 0);
  let hour = 12, dayOfWeek = 1;
  try {
    const ts = transaction.createdAt || transaction.timestamp || transaction.date;
    if (ts) { const dt = new Date(ts); hour = dt.getHours(); dayOfWeek = dt.getDay(); }
  } catch (_) {}
  const typeMap = { transfer: 0, payment: 1, withdrawal: 2, deposit: 3, purchase: 4 };
  const statusMap = { pending: 0, completed: 1, failed: 2, flagged: 3 };
  const txType = typeMap[(transaction.type || 'payment').toLowerCase()] ?? 1;
  const status = statusMap[(transaction.status || 'completed').toLowerCase()] ?? 1;
  const isLarge = amount > 10000 ? 1 : 0;
  const isOddHour = (hour < 6 || hour > 22) ? 1 : 0;
  const riskScore = parseFloat(transaction.riskScore || transaction.risk_score || 0);
  return [amount, hour, dayOfWeek, txType, status, isLarge, isOddHour, riskScore];
}
module.exports = { extractFeatures };
