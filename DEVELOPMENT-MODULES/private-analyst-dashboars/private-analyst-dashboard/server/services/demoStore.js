const store = {
  users: new Map(),
  transactions: [],
  notifications: [],
  rules: [],
  models: [
    {
      id: 'neural-network-v1',
      name: 'Neural Network',
      type: 'Deep Learning Fraud Detector',
      status: 'ready',
      accuracy: 96.7,
      version: 'v1.0',
      lastTrainedAt: null,
      progress: 0,
      coverage: 91,
    },
  ],
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureUser = (sessionUser) => {
  const id = sessionUser.userId || sessionUser.id;
  if (!id) {
    throw new Error('Missing session user id');
  }

  if (!store.users.has(id)) {
    const name = sessionUser.name || 'Demo User';
    const email = sessionUser.email || `${id}@demo.local`;
    store.users.set(id, {
      _id: id,
      id,
      name,
      email,
      role: sessionUser.role || 'user',
      status: sessionUser.status || 'active',
      accountBalance: 250000,
      accounts: [
        {
          accountId: `acc-${id}`,
          bankName: 'SecureBank',
          accountNumber: `**** **** **** ${String(id).slice(-4).toUpperCase()}`,
          balance: 250000,
        },
      ],
      createdAt: new Date(),
    });
  }

  return store.users.get(id);
};

const getAllUsers = () => Array.from(store.users.values());

const addTransaction = (transaction) => {
  const newTransaction = {
    _id: makeId('txn'),
    disputeStatus: 'none',
    disputeReason: '',
    createdAt: new Date(),
    ...transaction,
  };
  store.transactions.unshift(newTransaction);
  return newTransaction;
};

const updateTransaction = (transactionId, updates) => {
  const index = store.transactions.findIndex((item) => item._id === transactionId);
  if (index === -1) return null;
  store.transactions[index] = { ...store.transactions[index], ...updates };
  return store.transactions[index];
};

const getTransactions = () => store.transactions;

const addNotification = (notification) => {
  const newNotification = {
    _id: makeId('noti'),
    read: false,
    createdAt: new Date(),
    ...notification,
  };
  store.notifications.unshift(newNotification);
  return newNotification;
};

const getNotificationsForUser = (userId) =>
  store.notifications.filter((notification) => notification.user === userId);

const markNotificationAsRead = (notificationId, userId) => {
  const notification = store.notifications.find(
    (item) => item._id === notificationId && item.user === userId
  );
  if (!notification) return null;
  notification.read = true;
  return notification;
};

const deleteTransaction = (transactionId) => {
  const index = store.transactions.findIndex((item) => item._id === transactionId);
  if (index === -1) return false;
  store.transactions.splice(index, 1);
  return true;
};

const clearAllTransactions = () => {
  store.transactions = [];
  return true;
};

module.exports = {
  store,
  ensureUser,
  getAllUsers,
  addTransaction,
  updateTransaction,
  getTransactions,
  deleteTransaction,
  clearAllTransactions,
  addNotification,
  getNotificationsForUser,
  markNotificationAsRead,
};
