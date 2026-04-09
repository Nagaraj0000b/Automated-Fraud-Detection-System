import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI, accountAPI } from '../services/api';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(10000); 
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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/signin');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    if(parsedUser.accountBalance) setBalance(parsedUser.accountBalance);

    // Load accounts from backend and then load transactions for selected account
    initializeAccountsFromBackend();
  }, [navigate]);

  const getAccountNumber = () => {
    const selected = accounts.find(acc => acc.accountId === selectedAccountId);
    if (selected?.accountNumber) return selected.accountNumber;
    if (!user || !user._id) return "**** **** **** 8842";
    const last4 = user._id.slice(-4).toUpperCase();
    return `**** **** **** ${last4}`;
  };

  const getCurrentBankName = () => {
    const selected = accounts.find(acc => acc.accountId === selectedAccountId);
    return selected?.bankName || 'SecureBank';
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
      const data = await transactionAPI.getMyTransactions(accountId);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions", error);
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white font-sans overflow-hidden flex">
      
      {/* Animated Background Blobs (Fixed) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-white/10">
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

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-xs font-bold">
               {user?.name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-white truncate">{user?.name}</p>
               <p className="text-xs text-white/50 truncate">Account Holder</p>
             </div>
          </div>
          <button 
              onClick={handleSignOut}
              className="mt-3 w-full px-4 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all"
            >
              Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative z-10">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
          <span className="font-bold text-white">SecureBank</span>
          <button onClick={handleSignOut} className="text-sm text-white/70">Sign Out</button>
        </div>

        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'transactions' && 'All Transactions'}
                {activeTab === 'fraud' && 'Fraud History'}
                {activeTab === 'disputes' && 'Dispute Center'}
              </h2>
              <p className="text-white/50 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
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
                    className="text-xs font-medium text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
                  >
                    <span>Change bank</span>
                    <span className="text-[10px] opacity-80">▼</span>
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
                  className="text-xs font-medium text-emerald-300 hover:text-emerald-200 underline"
                >
                  Make Payment
                </button>
                <button
                  onClick={openAddAccountModal}
                  className="text-xs font-medium text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1"
                >
                  <span className="text-base leading-none">＋</span>
                  <span>Add Account</span>
                </button>
                {activeTab === 'transactions' && (
                  <button
                    onClick={downloadCSV}
                    className="text-xs font-medium text-cyan-300 hover:text-cyan-200 uppercase tracking-wider py-2 px-4 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors border border-cyan-500/30"
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
                    <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">₹{balance.toLocaleString()}</h2>
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
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="grid gap-4">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx._id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                             tx.status === 'blocked' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                           }`}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                           </div>
                           <div>
                             <p className="font-medium text-white">{tx.recipient}</p>
                             <p className="text-xs text-white/50">{new Date(tx.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <span className={`font-mono font-medium ${tx.status === 'blocked' ? 'text-white/30 line-through' : 'text-white'}`}>
                          -${tx.amount.toLocaleString()}
                        </span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('transactions')} className="text-sm text-blue-400 hover:text-blue-300 font-medium">View all transactions →</button>
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS / DISPUTES / FRAUD TAB CONTENT */}
          {(activeTab === 'transactions' || activeTab === 'disputes' || activeTab === 'fraud') && (
             <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-xl border border-white/10 overflow-hidden flex flex-col min-h-[500px]">
             
             {/* Filter Bar could go here */}

             <div className="overflow-x-auto flex-1">
               <table className="w-full text-left">
                 <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                   <tr>
                     <th className="px-8 py-5 font-semibold">Status</th>
                     <th className="px-8 py-5 font-semibold">Description</th>
                     <th className="px-8 py-5 font-semibold">Date & Time</th>
                     <th className="px-8 py-5 font-semibold text-right">Amount</th>
                     <th className="px-8 py-5 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
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
                       <tr key={tx._id} className="hover:bg-white/5 transition-colors group">
                         <td className="px-8 py-5 align-top">
                           {tx.status === 'approved' && (
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                               <span className="text-xs font-medium text-emerald-200">Approved</span>
                             </div>
                           )}
                           {tx.status === 'flagged' && (
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></span>
                               <span className="text-xs font-medium text-amber-200">Flagged</span>
                             </div>
                           )}
                           {tx.status === 'blocked' && (
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse"></span>
                               <span className="text-xs font-medium text-rose-200">Blocked</span>
                             </div>
                           )}
                         </td>
                         <td className="px-8 py-5">
                           <p className="font-medium text-white group-hover:text-cyan-200 transition-colors">{tx.recipient}</p>
                           <p className="text-xs text-white/40 mt-0.5">{tx.description || 'Transfer'}</p>
                         </td>
                         <td className="px-8 py-5 text-sm text-white/50">
                           {new Date(tx.createdAt).toLocaleDateString()}
                           <p className="text-xs text-white/30 mt-0.5">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </td>
                         <td className="px-8 py-5 text-right font-mono text-lg font-medium tracking-tight">
                           <span className={
                             tx.status === 'blocked' ? 'text-white/30 line-through decoration-rose-500/50' : 
                             tx.status === 'flagged' ? 'text-amber-200' : 'text-white'
                           }>
                             -${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                           </span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            {tx.disputeStatus && tx.disputeStatus !== 'none' ? (
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                tx.disputeStatus === 'resolved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 
                                tx.disputeStatus === 'rejected' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                'bg-orange-500/10 text-orange-300 border-orange-500/20 animate-pulse'
                              }`}>
                                {tx.disputeStatus === 'open' ? 'Dispute Open' : tx.disputeStatus.charAt(0).toUpperCase() + tx.disputeStatus.slice(1)}
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleDisputeClick(tx)}
                                className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all"
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
                   <div className="p-12 text-center text-white/30 italic">
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
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitDispute}
                  disabled={!disputeReason || disputeLoading}
                  className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              This will create a new account in the backend with a default starting balance of $1000.
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
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
                >
                  Save Account
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