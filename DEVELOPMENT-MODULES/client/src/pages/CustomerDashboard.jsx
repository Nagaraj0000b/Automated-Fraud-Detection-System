import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI, accountAPI } from '../services/api';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0); 
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'transactions' | 'disputes' | 'fraud'

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Add Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountBankName, setNewAccountBankName] = useState("");
  const [showBankList, setShowBankList] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [addMoneyLoading, setAddMoneyLoading] = useState(false);

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addMoneyAmount || isNaN(addMoneyAmount) || Number(addMoneyAmount) <= 0) return;
    setAddMoneyLoading(true);
    try {
      const response = await accountAPI.addMoney({
        accountId: selectedAccountId,
        amount: Number(addMoneyAmount)
      });
      if (response.success && response.account) {
        setBalance(response.account.balance);
        setAccounts(response.accounts);
        setShowAddMoneyModal(false);
        setAddMoneyAmount("");
      }
    } catch (error) {
      console.error('Failed to add money', error);
      alert('Failed to add money: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddMoneyLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/signin');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Load accounts from backend and then load transactions for selected account
    initializeAccountsFromBackend();
  }, [navigate]);

  const getAccountNumber = () => {
    const selected = accounts.find(acc => acc.accountId === selectedAccountId);
    if (selected?.accountNumber) return selected.accountNumber;
    if (!accounts.length) return "No account selected";
    return accounts[0]?.accountNumber || "No account selected";
  };

  const getCurrentBankName = () => {
    // If any real accounts exist, prefer showing their bank name
    if (accounts.length > 0) {
      const selected = accounts.find(acc => acc.accountId === selectedAccountId);
      return selected?.bankName || accounts[0]?.bankName || 'No bank linked';
    }
    // Fallback default label when no accounts yet
    return 'No bank linked';
  };

  const initializeAccountsFromBackend = async () => {
    try {
      const response = await accountAPI.getMyAccounts();
      if (response.success && Array.isArray(response.accounts) && response.accounts.length > 0) {
        setAccounts(response.accounts);
        const first = response.accounts[0];
        setSelectedAccountId(first.accountId);
        if (typeof first.balance === 'number') {
          setBalance(first.balance);
        }
        await fetchHistory(first.accountId);
      }
    } catch (error) {
      console.error('Failed to load accounts from backend', error);
    }
  };

  const fetchHistory = async (accountId) => {
    try {
      console.log('Fetching history for account:', accountId);
      setTransactionsLoading(true);
      const data = await transactionAPI.getMyTransactions(accountId);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load transactions", error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedAccountId) {
      fetchHistory(selectedAccountId);
    } else {
      initializeAccountsFromBackend();
    }
  };

  const handleDisputeClick = (tx) => {
    setSelectedTransaction(tx);
    setShowDisputeModal(true);
    setDisputeReason("");
  };

  const submitDispute = async () => {
    if (!disputeReason) return;
    setDisputeLoading(true);
    try {
      await transactionAPI.raiseDispute(selectedTransaction._id, disputeReason);
      setShowDisputeModal(false);
      // Refresh transactions for the currently selected bank account
      if (selectedAccountId) {
        fetchHistory(selectedAccountId);
      }
    } catch (error) {
      console.error("Failed to raise dispute", error);
      alert("Failed to raise dispute: " + (error.response?.data?.message || error.message));
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleAccountSelectChange = (accountId) => {
    setSelectedAccountId(accountId);
    setShowBankList(false);
    const selected = accounts.find(acc => acc.accountId === accountId);
    if (selected && typeof selected.balance === 'number') {
      setBalance(selected.balance);
    }
    fetchHistory(accountId);
  };

  const openAddAccountModal = () => {
    setNewAccountBankName("");
    setShowAddAccountModal(true);
  };

  const addNewAccount = (event) => {
    event.preventDefault();
    const bankName = newAccountBankName.trim() || 'New Bank Account';
    (async () => {
      try {
        const response = await accountAPI.addAccount({ bankName });
        if (response.success && response.account) {
          const updatedAccounts = response.accounts || [];
          setAccounts(updatedAccounts);
          const newAcc = response.account;
          setSelectedAccountId(newAcc.accountId);
          if (typeof newAcc.balance === 'number') {
            setBalance(newAcc.balance);
          }
          await fetchHistory(newAcc.accountId);
        }
      } catch (error) {
        console.error('Failed to add account', error);
      } finally {
        setShowAddAccountModal(false);
      }
    })();
  };

  const downloadCSV = () => {
    if (!transactions.length) return;
    const headers = ["Status,Recipient,Description,Date,Amount"];
    const rows = transactions.map(tx => {
      const date = new Date(tx.createdAt).toLocaleDateString();
      const time = new Date(tx.createdAt).toLocaleTimeString();
      const safeDesc = (tx.description || '').replace(/,/g, ' '); 
      return `${tx.status},${tx.recipient},${safeDesc},${date} ${time},${tx.amount}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const SidebarItem = ({ id, icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:-translate-y-0.5' 
          : 'text-slate-300 hover:text-white hover:bg-slate-800 hover:-translate-y-0.5'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden flex">

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900 text-slate-100 flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-cyan-500/20">
              SB
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              {getCurrentBankName()}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-2 flex-1">
          <SidebarItem 
            id="overview" 
            label="Overview" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>} 
          />
          <SidebarItem 
            id="transactions" 
            label="Transactions" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>} 
          />
          <SidebarItem 
            id="fraud" 
            label="Fraud History" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0zM12 9v4m0 4h.01" /></svg>} 
          />
           <SidebarItem 
            id="disputes" 
            label="My Disputes" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} 
          />
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-xs font-bold">
               {user?.name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-slate-50 truncate">{user?.name}</p>
               <p className="text-xs text-slate-400 truncate">Account Holder</p>
             </div>
          </div>
          <button 
              onClick={handleSignOut}
              className="mt-3 w-full px-4 py-2 text-xs font-medium text-rose-200 hover:text-rose-100 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded-lg transition-all transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative z-10">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden p-4 flex justify-between items-center bg-white border-b border-slate-200">
          <span className="font-bold text-slate-900">SecureBank</span>
          <button 
            onClick={handleSignOut} 
            className="text-sm text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Sign Out
          </button>
        </div>

        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'transactions' && 'All Transactions'}
                {activeTab === 'fraud' && 'Fraud History'}
                {activeTab === 'disputes' && 'Dispute Center'}
              </h2>
              <p className="text-slate-500 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {getCurrentBankName()}
                </span>
                <span>Welcome back, {user?.name}</span>
              </p>
            </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {accounts.length > 0 && (
                <div className="relative inline-flex">
                  <button
                    type="button"
                    onClick={() => setShowBankList((prev) => !prev)}
                    className="group relative overflow-hidden text-sm font-semibold text-sky-900 py-2.5 px-6 rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 border border-sky-200 flex items-center gap-1 shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-lg hover:from-sky-200 hover:to-cyan-200 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/70 text-sky-500 shadow group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2L2 6v2h16V6L10 2z" /><path d="M4 10h2v6H4v-6zm10 0h2v6h-2v-6zM8 10h4v6H8v-6z" /></svg>
                    </span>
                    <span className="ml-2">Change bank</span>
                    <span className="ml-1 text-[10px] opacity-80 group-hover:translate-y-0.5 transition-transform">▼</span>
                  </button>
                  {showBankList && (
                    <div className="absolute right-0 mt-1 w-44 max-h-56 overflow-y-auto bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-lg shadow-cyan-900/40 z-20 backdrop-blur-sm">
                      {accounts.map((acc) => (
                        <button
                          key={acc.accountId}
                          type="button"
                          onClick={() => handleAccountSelectChange(acc.accountId)}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            selectedAccountId === acc.accountId
                              ? 'bg-cyan-600/40 text-cyan-100 font-semibold'
                              : 'text-white/80 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          {acc.bankName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/make-payment')}
                  className="group relative overflow-hidden text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-full px-7 py-2.5 shadow-md shadow-emerald-900/40 transform transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white mix-blend-screen transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4h12a2 2 0 012 2v2H2V6a2 2 0 012-2z" /><path d="M2 10h16v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4zm10 2a1 1 0 100 2 1 1 0 000-2z" /></svg>
                    </span>
                    <span>Make Payment</span>
                    <span className="text-[11px] opacity-80 group-hover:translate-x-0.5 transition-transform">→</span>
                  </span>
                </button>
                <button
                  onClick={openAddAccountModal}
                  className="group text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-6 py-2.5 transition-all flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">＋</span>
                  <span>Add Account</span>
                </button>
                <button
                  onClick={handleRefresh}
                  className="text-xs font-medium text-blue-300 hover:text-blue-200 underline mr-2"
                >
                  Refresh
                </button>
                {activeTab === 'transactions' && (
                  <button
                    onClick={downloadCSV}
                    className="text-xs font-medium text-cyan-700 hover:text-cyan-800 uppercase tracking-wider py-2 px-4 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-all border border-cyan-200 shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    Download Report
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OVERVIEW TAB CONTENT */}
          {activeTab === 'overview' && (
            <>
              {/* Balance Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-violet-700 p-8 rounded-3xl shadow-2xl shadow-blue-900/40 border border-white/10 group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M2,10 L2,20 L22,20 L22,10 L2,10 Z M20,8 L20,6 L4,6 L4,8 L20,8 Z M8,12 L8,18 L6,18 L6,12 L8,12 Z M18,12 L18,18 L16,18 L16,12 L18,12 Z M13,12 L13,18 L11,18 L11,12 L13,12 Z"></path></svg>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                  <div>
                    <p className="text-blue-100 text-sm font-medium tracking-wider uppercase mb-2">Total Balance</p>
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">₹{balance.toLocaleString()}</h2>
                      <button 
                        onClick={() => setShowAddMoneyModal(true)}
                        className="hidden md:flex bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 transition-all items-center gap-2 shadow-lg"
                      >
                        <span className="text-lg leading-none">+</span> Add Funds
                      </button>
                    </div>
                    <button 
                      onClick={() => setShowAddMoneyModal(true)}
                      className="mt-4 md:hidden w-full flex justify-center bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/10 transition-all items-center gap-2 shadow-lg"
                    >
                      <span className="text-lg leading-none">+</span> Add Funds
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-medium text-white/90">Active Account</span>
                    </div>
                    <span className="text-sm text-white/60 font-mono tracking-wider">{getAccountNumber()}</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h3>
                <div className="grid gap-4">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx._id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                             tx.status === 'blocked' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                           }`}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                           </div>
                           <div>
                             <p className="font-medium text-slate-900">{tx.recipient}</p>
                             <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <span className={`font-mono font-medium ${tx.status === 'blocked' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          -₹{(tx.amount || 0).toLocaleString()}
                        </span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('transactions')} className="text-sm text-blue-600 hover:text-blue-500 font-medium">View all transactions →</button>
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS / DISPUTES / FRAUD TAB CONTENT */}
          {(activeTab === 'transactions' || activeTab === 'disputes' || activeTab === 'fraud') && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
             
             {/* Filter Bar could go here */}

             <div className="overflow-x-auto flex-1">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                   <tr>
                     <th className="px-8 py-5 font-semibold">Status</th>
                     <th className="px-8 py-5 font-semibold">Description</th>
                     <th className="px-8 py-5 font-semibold">Date & Time</th>
                     <th className="px-8 py-5 font-semibold text-right">Amount</th>
                     <th className="px-8 py-5 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {transactions
                     .filter(tx => {
                       if (activeTab === 'disputes') {
                         return tx.disputeStatus && tx.disputeStatus !== 'none';
                       }
                       if (activeTab === 'fraud') {
                         return tx.status === 'flagged' || tx.status === 'blocked';
                       }
                       return true;
                     })
                     .map((tx) => (
                       <tr key={tx._id} className="hover:bg-slate-50 transition-colors group">
                         <td className="px-8 py-5 align-top">
                           {tx.status === 'approved' && (
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                               <span className="text-xs font-medium text-emerald-700">Approved</span>
                             </div>
                           )}
                           {tx.status === 'flagged' && (
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                               <span className="text-xs font-medium text-amber-700">Flagged</span>
                             </div>
                           )}
                           {tx.status === 'blocked' && (
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                               <span className="text-xs font-medium text-rose-700">Blocked</span>
                             </div>
                           )}
                         </td>
                         <td className="px-8 py-5">
                           <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{tx.recipient}</p>
                           <p className="text-xs text-slate-500 mt-0.5">{tx.description || 'Transfer'}</p>
                         </td>
                         <td className="px-8 py-5 text-sm text-slate-600">
                           {new Date(tx.createdAt).toLocaleDateString()}
                           <p className="text-xs text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </td>
                         <td className="px-8 py-5 text-right font-mono text-lg font-medium tracking-tight">
                           <span className={
                             tx.status === 'blocked' ? 'text-slate-400 line-through decoration-rose-500/50' : 
                             tx.status === 'flagged' ? 'text-amber-600' : 'text-slate-900'
                           }>
                             -₹{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                           </span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            {tx.disputeStatus && tx.disputeStatus !== 'none' ? (
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                tx.disputeStatus === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                tx.disputeStatus === 'rejected' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                              }`}>
                                {tx.disputeStatus === 'open' ? 'Dispute Open' : tx.disputeStatus.charAt(0).toUpperCase() + tx.disputeStatus.slice(1)}
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleDisputeClick(tx)}
                                className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              >
                                Raise Dispute
                              </button>
                            )}
                         </td>
                       </tr>
                     ))}
                 </tbody>
               </table>
               {transactions.filter(tx => {
                   if (activeTab === 'disputes') {
                     return tx.disputeStatus && tx.disputeStatus !== 'none';
                   }
                   if (activeTab === 'fraud') {
                     return tx.status === 'flagged' || tx.status === 'blocked';
                   }
                   return true;
                 }).length === 0 && (
                   <div className="p-12 text-center text-slate-400 italic">
                     {activeTab === 'disputes' && "You haven't raised any disputes yet."}
                     {activeTab === 'fraud' && "No suspicious transactions detected for this account."}
                     {activeTab === 'transactions' && "No transactions found."}
                   </div>
               )}
             </div>
           </div>
          )}

        </div>
      </main>

      {/* Dispute Modal (Same as before) */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 transform transition-all scale-100 opacity-100">
            <h3 className="text-xl font-bold text-white mb-2">Raise a Dispute</h3>
              <p className="text-sm text-white/50 mb-6">
              Reporting transaction for <span className="text-white font-medium">₹{selectedTransaction?.amount}</span> to <span className="text-white font-medium">{selectedTransaction?.recipient}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70 uppercase tracking-wider mb-2 block">Reason for Dispute</label>
                <textarea 
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[120px]"
                  placeholder="Please describe why you are disputing this transaction..."
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitDispute}
                  disabled={!disputeReason || disputeLoading}
                  className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal (frontend-only, local state) */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Add New Account</h3>
            <p className="text-sm text-white/50 mb-6">
              This will create a new account in the backend with a default starting balance of ₹1000.
            </p>
            <form onSubmit={addNewAccount} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70 uppercase tracking-wider mb-2 block">Bank Name</label>
                <input
                  type="text"
                  value={newAccountBankName}
                  onChange={(e) => setNewAccountBankName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g., SecureBank, Global Bank"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-900/20 transition-all transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Add Funds to Account</h3>
            <p className="text-sm text-white/50 mb-6">
              Enter the amount you wish to deposit into <span className="font-mono text-white/80">{getAccountNumber()}</span>.
            </p>
            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70 uppercase tracking-wider mb-2 block">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g., 5000"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddMoneyModal(false); setAddMoneyAmount(""); }}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMoneyLoading || !addMoneyAmount}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {addMoneyLoading ? 'Processing...' : 'Deposit Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;