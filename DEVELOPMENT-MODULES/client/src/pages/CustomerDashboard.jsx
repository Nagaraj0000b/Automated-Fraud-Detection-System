import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI, accountAPI } from '../services/api';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  ShieldAlert, 
  AlertCircle, 
  LogOut, 
  Plus, 
  Download, 
  ChevronDown,
  Building2,
  CheckCircle2,
  XCircle,
  Send,
  CreditCard,
  Search
} from 'lucide-react';

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
    initializeAccountsFromBackend();
  }, [navigate]);

  const getAccountNumber = () => {
    const selected = accounts.find(acc => acc.accountId === selectedAccountId);
    if (selected?.accountNumber) return selected.accountNumber;
    if (!accounts.length) return "No account selected";
    return accounts[0]?.accountNumber || "No account selected";
  };

  const getCurrentBankName = () => {
    if (accounts.length > 0) {
      const selected = accounts.find(acc => acc.accountId === selectedAccountId);
      return selected?.bankName || accounts[0]?.bankName || 'No bank linked';
    }
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
        activeTab === id 
          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              FG
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              FraudGuard
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-1.5 flex-1">
          <SidebarItem id="overview" label="Overview" icon={<LayoutDashboard className="w-5 h-5" />} />
          <SidebarItem id="transactions" label="Transactions" icon={<ArrowRightLeft className="w-5 h-5" />} />
          <SidebarItem id="fraud" label="Security Alerts" icon={<ShieldAlert className="w-5 h-5" />} />
          <SidebarItem id="disputes" label="Dispute Center" icon={<AlertCircle className="w-5 h-5" />} />
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-default">
             <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold">
               {user?.name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
               <p className="text-xs text-slate-500 truncate">Personal Account</p>
             </div>
          </div>
          <button 
              onClick={handleSignOut}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex justify-between items-center bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">FG</div>
             <span className="font-bold text-slate-900">FraudGuard</span>
          </div>
          <button onClick={handleSignOut} className="text-sm text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 font-medium">
            Sign Out
          </button>
        </div>

        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'transactions' && 'All Transactions'}
                {activeTab === 'fraud' && 'Security Alerts'}
                {activeTab === 'disputes' && 'Dispute Center'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.name}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {accounts.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBankList((prev) => !prev)}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="max-w-[140px] truncate">{getCurrentBankName()}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  {showBankList && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-30 py-2">
                      <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Accounts</div>
                      {accounts.map((acc) => (
                        <button
                          key={acc.accountId}
                          type="button"
                          onClick={() => handleAccountSelectChange(acc.accountId)}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                            selectedAccountId === acc.accountId
                              ? 'bg-slate-50 text-slate-900 font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <span className="truncate">{acc.bankName}</span>
                          {selectedAccountId === acc.accountId && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                        <button
                          onClick={() => { setShowBankList(false); openAddAccountModal(); }}
                          className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Link New Bank
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'transactions' && (
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  Export
                </button>
<<<<<<< HEAD
              )}
=======
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
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Export
                  </button>
                )}
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
              {/* Clean Balance Card */}
              <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Building2 className="w-48 h-48" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Total Balance</p>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">₹{(balance || 0).toLocaleString()}</h2>
                  <p className="text-slate-500 text-sm font-mono mt-3 flex items-center gap-2 bg-slate-50 inline-flex px-3 py-1.5 rounded-lg border border-slate-100">
                    <CreditCard className="w-4 h-4 text-slate-400" /> {getAccountNumber()}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
                  <button 
                    onClick={() => setShowAddMoneyModal(true)}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-medium transition-colors shadow-md shadow-slate-900/10 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" /> Add Funds
                  </button>
                  <button 
                    onClick={() => navigate('/make-payment')}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl font-medium transition-colors shadow-sm w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4 text-slate-400" /> Transfer
                  </button>
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-sm text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors">
                    View all <ArrowRightLeft className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid gap-3">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx._id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between hover:shadow-sm hover:border-slate-300 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                             tx.status === 'blocked' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                           }`}>
                             <ArrowRightLeft className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="font-bold text-slate-900">{tx.recipient}</p>
                             <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} • {tx.description || 'Transfer'}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-lg font-bold block ${tx.status === 'blocked' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            -₹{(tx.amount || 0).toLocaleString()}
                          </span>
                          {tx.status === 'blocked' && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Blocked</span>}
                        </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 text-sm">
                      No recent activity on this account.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS / DISPUTES / FRAUD TAB CONTENT */}
          {(activeTab === 'transactions' || activeTab === 'disputes' || activeTab === 'fraud') && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
             
             <div className="overflow-x-auto flex-1">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50/80 border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                     <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Details</th>
                     <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date & Time</th>
                     <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Amount</th>
                     <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {transactions
                     .filter(tx => {
                       if (activeTab === 'disputes') return tx.disputeStatus && tx.disputeStatus !== 'none';
                       if (activeTab === 'fraud') return tx.status === 'flagged' || tx.status === 'blocked';
                       return true;
                     })
                     .map((tx) => (
                       <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-6 py-4 align-middle">
                           {tx.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>}
                           {tx.status === 'flagged' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><AlertCircle className="w-3.5 h-3.5" /> Reviewing</span>}
                           {tx.status === 'blocked' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><XCircle className="w-3.5 h-3.5" /> Blocked</span>}
                         </td>
                         <td className="px-6 py-4">
                           <p className="font-bold text-slate-900">{tx.recipient}</p>
                           <p className="text-xs font-medium text-slate-500 mt-0.5">{tx.description || 'Transfer'}</p>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                           {new Date(tx.createdAt).toLocaleDateString()}
                           <p className="text-xs text-slate-400 mt-0.5 font-normal">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-lg font-bold tracking-tight">
                           <span className={tx.status === 'blocked' ? 'text-slate-400 line-through' : 'text-slate-900'}>
                             -₹{(tx.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            {tx.disputeStatus && tx.disputeStatus !== 'none' ? (
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-block ${
                                tx.disputeStatus === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                tx.disputeStatus === 'rejected' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {tx.disputeStatus === 'open' ? 'Dispute Open' : tx.disputeStatus.charAt(0).toUpperCase() + tx.disputeStatus.slice(1)}
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleDisputeClick(tx)}
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-all shadow-sm focus:ring-2 focus:ring-slate-900"
                              >
                                Dispute
                              </button>
                            )}
                         </td>
                       </tr>
                     ))}
                 </tbody>
               </table>
               {transactions.filter(tx => {
                   if (activeTab === 'disputes') return tx.disputeStatus && tx.disputeStatus !== 'none';
                   if (activeTab === 'fraud') return tx.status === 'flagged' || tx.status === 'blocked';
                   return true;
                 }).length === 0 && (
                   <div className="p-16 text-center">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                       <Search className="w-8 h-8 text-slate-300" />
                     </div>
                     <p className="text-slate-900 font-medium">No records found</p>
                     <p className="text-slate-500 text-sm mt-1">
                       {activeTab === 'disputes' && "You haven't raised any disputes."}
                       {activeTab === 'fraud' && "No suspicious transactions detected."}
                       {activeTab === 'transactions' && "You don't have any transactions yet."}
                     </p>
                   </div>
               )}
             </div>
           </div>
          )}

        </div>
      </main>

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Raise a Dispute</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Report issue for <span className="font-bold text-slate-900">₹{selectedTransaction?.amount}</span> to <span className="font-bold text-slate-900">{selectedTransaction?.recipient}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reason for Dispute</label>
                <textarea 
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all min-h-[120px] resize-none"
                  placeholder="Please describe why you are disputing this transaction..."
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowDisputeModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitDispute}
                  disabled={!disputeReason || disputeLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm shadow-slate-900/10 disabled:opacity-50 transition-all"
                >
                  {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900">Link New Account</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              This will create a new connected account for your profile.
            </p>
            <form onSubmit={addNewAccount} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bank Name</label>
                <input
                  type="text"
                  value={newAccountBankName}
                  onChange={(e) => setNewAccountBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  placeholder="e.g., SecureBank, Global Bank"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MONEY MODAL */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900">Deposit Funds</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Enter the amount to deposit into <span className="font-mono text-slate-900 font-medium">{getAccountNumber()}</span>.
            </p>
            <form onSubmit={handleAddMoney} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-mono text-lg"
                  placeholder="e.g., 5000"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddMoneyModal(false); setAddMoneyAmount(""); }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMoneyLoading || !addMoneyAmount}
                  className="px-5 py-2.5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm disabled:opacity-50 transition-all"
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