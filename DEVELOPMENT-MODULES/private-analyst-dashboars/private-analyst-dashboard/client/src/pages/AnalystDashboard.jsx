import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Lucide-style inline SVG icons ──────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  alert:      "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  brain:      "M9.5 2a2.5 2.5 0 0 1 5 0v.5a2.5 2.5 0 0 1-2.5 2.5H9.5A2.5 2.5 0 0 1 7 2.5V2zM2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0zm10-4v4l3 3",
  activity:   "M22 12h-4l-3 9L9 3l-3 9H2",
  search:     "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  filter:     "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  logout:     "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  refresh:    "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  check:      "M20 6L9 17l-5-5",
  x:          "M18 6 6 18 M6 6l12 12",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  download:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  trend:      "M23 6l-9.5 9.5-5-5L1 18",
  cpu:        "M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M9 9h6v6H9z",
  network:    "M9 3H5a2 2 0 0 0-2 2v4 M19 3h-4 M19 3a2 2 0 0 1 2 2v4 M3 15v4a2 2 0 0 0 2 2h4 M15 21h4a2 2 0 0 0 2-2v-4 M9 3v18 M15 3v18 M3 9h18 M3 15h18",
  forest:     "M17 14v6 M3 14v6 M10 3l7 11H3L10 3z M3 20h14",
  bell:       "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  user:       "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  arrowUp:    "M12 19V5 M5 12l7-7 7 7",
  arrowDown:  "M12 5v14 M19 12l-7 7-7-7",
  dots:       "M12 5v.01 M12 12v.01 M12 19v.01",
  clock:      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  barChart:   "M18 20V10 M12 20V4 M6 20v-6",
  zap:        "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

// ── Static mock data ───────────────────────────────────────────────────────
const ALERTS = [
  { id: "FA-2041", time: "2 min ago", user: "john.carter@mail.com", amount: "$12,450", risk: 98, type: "Card Cloning", status: "Critical", location: "Lagos, NG" },
  { id: "FA-2040", time: "11 min ago", user: "priya.s@corp.in", amount: "$3,200", risk: 85, type: "Velocity Abuse", status: "High", location: "Delhi, IN" },
  { id: "FA-2039", time: "28 min ago", user: "marcus.t@webco.com", amount: "$780", risk: 71, type: "Account Takeover", status: "High", location: "Chicago, US" },
  { id: "FA-2038", time: "45 min ago", user: "lena.b@fintech.eu", amount: "$250", risk: 55, type: "Unusual Location", status: "Medium", location: "Berlin, DE" },
  { id: "FA-2037", time: "1 hr ago", user: "ali.r@shop.ae", amount: "$95", risk: 42, type: "Small Transaction", status: "Low", location: "Dubai, AE" },
  { id: "FA-2036", time: "2 hr ago", user: "sarah.m@bank.uk", amount: "$8,900", risk: 91, type: "Identity Fraud", status: "Critical", location: "London, UK" },
  { id: "FA-2035", time: "3 hr ago", user: "wang.y@tech.cn", amount: "$1,550", risk: 67, type: "Phishing", status: "Medium", location: "Shanghai, CN" },
  { id: "FA-2034", time: "4 hr ago", user: "emma.k@retail.de", amount: "$430", risk: 38, type: "Unusual Time", status: "Low", location: "Munich, DE" },
];

const TRANSACTIONS = [
  { id: "TXN-9901", date: "29 Mar 2026", user: "john.carter@mail.com", merchant: "GlobalShop", amount: "$12,450", method: "Visa •••4521", riskScore: 98, status: "Flagged" },
  { id: "TXN-9900", date: "29 Mar 2026", user: "priya.s@corp.in", merchant: "FastPay", amount: "$3,200", method: "MC •••8823", riskScore: 85, status: "Review" },
  { id: "TXN-9899", date: "29 Mar 2026", user: "marcus.t@webco.com", merchant: "TechStore", amount: "$780", method: "Amex •••3310", riskScore: 71, status: "Review" },
  { id: "TXN-9898", date: "28 Mar 2026", user: "lena.b@fintech.eu", merchant: "EuroMart", amount: "$250", method: "Visa •••0092", riskScore: 55, status: "Pending" },
  { id: "TXN-9897", date: "28 Mar 2026", user: "ali.r@shop.ae", merchant: "QuickBuy", amount: "$95", method: "Debit •••7741", riskScore: 42, status: "Cleared" },
  { id: "TXN-9896", date: "28 Mar 2026", user: "sarah.m@bank.uk", merchant: "LuxuryLine", amount: "$8,900", method: "Visa •••2198", riskScore: 91, status: "Flagged" },
  { id: "TXN-9895", date: "27 Mar 2026", user: "wang.y@tech.cn", merchant: "OnlinePro", amount: "$1,550", method: "MC •••5567", riskScore: 67, status: "Review" },
  { id: "TXN-9894", date: "27 Mar 2026", user: "emma.k@retail.de", merchant: "NightShop", amount: "$430", method: "Visa •••8812", riskScore: 38, status: "Cleared" },
  { id: "TXN-9893", date: "27 Mar 2026", user: "dev.p@startup.io", merchant: "CloudSvc", amount: "$2,100", method: "MC •••4490", riskScore: 22, status: "Cleared" },
  { id: "TXN-9892", date: "26 Mar 2026", user: "nina.v@agency.ru", merchant: "AdNetwork", amount: "$5,600", method: "Visa •••1123", riskScore: 78, status: "Review" },
];

const MODEL_METRICS = {
  randomForest: { accuracy: 94.2, precision: 92.8, recall: 91.5, f1: 92.1, detected: 1284, falsePos: 47, lastTrained: "25 Mar 2026", status: "Active", color: "#10b981" },
  neuralNetwork: { accuracy: 96.7, precision: 95.1, recall: 94.3, f1: 94.7, detected: 1391, falsePos: 31, lastTrained: "27 Mar 2026", status: "Active", color: "#6366f1" },
  isolationForest: { accuracy: 89.4, precision: 87.2, recall: 88.9, f1: 88.0, detected: 1102, falsePos: 89, lastTrained: "22 Mar 2026", status: "Active", color: "#f59e0b" },
};

// ── Sparkline mini chart ───────────────────────────────────────────────────
const Sparkline = ({ data, color, height = 40 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const w = 100, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${h} ` + pts + ` ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Donut chart ────────────────────────────────────────────────────────────
const Donut = ({ pct, color, size = 64 }) => {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        strokeDashoffset={c * 0.25} strokeLinecap="round" />
      <text x="32" y="37" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
};

// ── Bar mini ───────────────────────────────────────────────────────────────
const MiniBar = ({ values, color }) => {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, background: color, borderRadius: 3, height: `${(v / max) * 100}%`, opacity: i === values.length - 1 ? 1 : 0.4 }} />
      ))}
    </div>
  );
};

// ── Risk badge ─────────────────────────────────────────────────────────────
const RiskBadge = ({ score }) => {
  const cfg = score >= 85 ? { bg: "#fef2f2", color: "#dc2626", label: "Critical" }
    : score >= 70 ? { bg: "#fff7ed", color: "#ea580c", label: "High" }
    : score >= 50 ? { bg: "#fefce8", color: "#ca8a04", label: "Medium" }
    : { bg: "#f0fdf4", color: "#16a34a", label: "Low" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ s }) => {
  const cfg = {
    "Flagged": { bg: "#fef2f2", color: "#dc2626" },
    "Review":  { bg: "#fff7ed", color: "#ea580c" },
    "Pending": { bg: "#fefce8", color: "#ca8a04" },
    "Cleared": { bg: "#f0fdf4", color: "#16a34a" },
    "Critical":{ bg: "#fef2f2", color: "#dc2626" },
    "High":    { bg: "#fff7ed", color: "#ea580c" },
    "Medium":  { bg: "#fefce8", color: "#ca8a04" },
    "Low":     { bg: "#f0fdf4", color: "#16a34a" },
    "Active":  { bg: "#eff6ff", color: "#2563eb" },
  }[s] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{s}</span>
  );
};

// ── Progress bar ───────────────────────────────────────────────────────────
const Prog = ({ pct, color }) => (
  <div style={{ background: "#e5e7eb", borderRadius: 999, height: 6, width: "100%", overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 1s ease" }} />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function AnalystDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [alertFilter, setAlertFilter] = useState("All");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [tick, setTick] = useState(0);
  const [tempBlockedUsers, setTempBlockedUsers] = useState([]);
  const [permBlockedUsers, setPermBlockedUsers] = useState([]);
  const [trainingModels, setTrainingModels] = useState({});
  const [modelStatus, setModelStatus] = useState({});
  const [transactions, setTransactions] = useState(TRANSACTIONS.map(t => ({
    ...t,
    displayStatus: t.status,
    displayRisk: t.riskScore >= 85 ? "Critical" : t.riskScore >= 70 ? "High" : t.riskScore >= 50 ? "Medium" : "Low"
  })));
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    try {
      const user = storedUser ? JSON.parse(storedUser) : null;
      const role = user?.role;

      if (!["admin", "analyst"].includes(role)) {
        navigate("/user-dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Failed to parse analyst session:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

  // logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.log("Backend logout failed (ignore for now)");
    }

    // ALWAYS run this 👇
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/signin", { replace: true });
  };

  // blocking handlers
  const handleTemporaryBlock = (userEmail) => {
    if (!tempBlockedUsers.includes(userEmail)) {
      setTempBlockedUsers([...tempBlockedUsers, userEmail]);
    }
  };

  const handlePermanentBlock = (userEmail) => {
    if (!permBlockedUsers.includes(userEmail)) {
      setPermBlockedUsers([...permBlockedUsers, userEmail]);
      setTempBlockedUsers(tempBlockedUsers.filter(u => u !== userEmail));
    }
  };

  const handleUnblock = (userEmail, type) => {
    if (type === "temp") {
      setTempBlockedUsers(tempBlockedUsers.filter(u => u !== userEmail));
    } else {
      setPermBlockedUsers(permBlockedUsers.filter(u => u !== userEmail));
    }
  };

  // get block status and type
  const getBlockStatus = (userEmail) => {
    if (permBlockedUsers.includes(userEmail)) return { status: "perm", label: "Permanently Blocked" };
    if (tempBlockedUsers.includes(userEmail)) return { status: "temp", label: "Temporarily Blocked" };
    return { status: null, label: "Active" };
  };

  // get block action based on risk score
  const getBlockAction = (riskScore) => {
    if (riskScore >= 90) return "permanent";
    if (riskScore >= 50) return "both";
    return "temporary";
  };

  // model training handlers
  const handleModelTrain = (modelName) => {
    setTrainingModels({ ...trainingModels, [modelName]: true });
    setModelStatus({ ...modelStatus, [modelName]: "Training..." });
    
    setTimeout(() => {
      setTrainingModels({ ...trainingModels, [modelName]: false });
      setModelStatus({ ...modelStatus, [modelName]: "✓ Training Complete" });
    }, 3000);
  };

  const handleModelRetrain = (modelName) => {
    setTrainingModels({ ...trainingModels, [modelName]: true });
    setModelStatus({ ...modelStatus, [modelName]: "Retraining..." });
    
    setTimeout(() => {
      setTrainingModels({ ...trainingModels, [modelName]: false });
      setModelStatus({ ...modelStatus, [modelName]: "✓ Retrain Complete" });
    }, 3000);
  };

  const handleModelStop = (modelName) => {
    setTrainingModels({ ...trainingModels, [modelName]: false });
    setModelStatus({ ...modelStatus, [modelName]: "⊗ Stopped" });
  };

  // transaction handlers
  const handleClear = (id) => {
    setTransactions(prev =>
      prev.map(txn =>
        txn.id === id ? { ...txn, displayStatus: "Cleared", displayRisk: "Low" } : txn
      )
    );
  };

  const handleFlag = (id) => {
    setTransactions(prev =>
      prev.map(txn =>
        txn.id === id ? { ...txn, displayStatus: "Flagged", displayRisk: "High" } : txn
      )
    );
  };

  const handleEscalate = (id) => {
    setTransactions(prev =>
      prev.map(txn =>
        txn.id === id ? { ...txn, displayStatus: "Escalated", displayRisk: "Critical" } : txn
      )
    );
  };

  // live clock + pulse
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const weekData = [120, 185, 162, 210, 178, 243, 198];
  const monthData = [890, 1020, 945, 1180, 1090, 1340, 1210, 1450, 1320, 1580, 1490, 1640];

  // ── filter transactions ────────────────────────────────────────────────
  const filteredTxn = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.id.toLowerCase().includes(q) || t.user.toLowerCase().includes(q)
      || t.merchant.toLowerCase().includes(q) || t.amount.includes(q);
    const matchS = filterStatus === "All" || t.displayStatus === filterStatus;
    const matchR = filterRisk === "All"
      || (filterRisk === "Critical" && t.riskScore >= 85)
      || (filterRisk === "High" && t.riskScore >= 70 && t.riskScore < 85)
      || (filterRisk === "Medium" && t.riskScore >= 50 && t.riskScore < 70)
      || (filterRisk === "Low" && t.riskScore < 50);
    return matchQ && matchS && matchR;
  });

  const filteredAlerts = ALERTS.filter(a =>
    alertFilter === "All" || a.status === alertFilter
  );

  // export CSV handler
  const handleExportCSV = () => {
    const headers = ["Alert ID", "Time", "User", "Amount", "Risk Score", "Type", "Location", "Status"];
    const rows = filteredAlerts.map(a => [
      a.id,
      a.time,
      a.user,
      a.amount,
      a.risk,
      a.type,
      a.location,
      a.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fraud-alerts-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // ── nav items ──────────────────────────────────────────────────────────
  const NAV = [
    { id: "overview",   label: "Overview",     icon: "activity" },
    { id: "alerts",     label: "Fraud Alerts",  icon: "alert" },
    { id: "models",     label: "AI Models",     icon: "brain" },
    { id: "transactions",label:"Transactions",  icon: "barChart" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", position: "relative", isolation: "isolate", opacity: 1 }}>
      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside style={{
        width: 230, background: "#0f172a", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#ec4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon d={ICONS.shield} size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>FraudGuard</div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Analyst Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 8 }}>NAVIGATION</div>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                marginBottom: 4, transition: "all .15s",
                background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                color: active ? "#fff" : "#94a3b8",
                fontWeight: active ? 700 : 500, fontSize: 13,
              }}>
                <Icon d={ICONS[n.icon]} size={16} color={active ? "#fff" : "#64748b"} />
                {n.label}
                {n.id === "alerts" && (
                  <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "1px 6px" }}>
                    {ALERTS.filter(a => a.status === "Critical").length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "16px", borderTop: "1px solid #1e293b" }}>
          
          {/* Profile */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#1e293b",
            padding: "10px",
            borderRadius: 10,
            marginBottom: 10
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Icon d={ICONS.user} size={15} color="#fff" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
                Emily Davis
              </div>
              <div style={{ fontSize: 10, color: "#64748b" }}>
                Senior Analyst
              </div>
            </div>
          </div>

          {/* 🔥 LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            onMouseOver={(e) => e.target.style.background = "#ef4444"}
            onMouseOut={(e) => e.target.style.background = "transparent"}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Sign Out
          </button>

        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 230, flex: 1, minHeight: "100vh", position: "relative", zIndex: 1, pointerEvents: "auto" }}>
        {/* Topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40, background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>
              {NAV.find(n => n.id === tab)?.label}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", padding: "5px 12px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: `0 0 0 ${tick % 2 === 0 ? 4 : 2}px rgba(34,197,94,0.3)`, transition: "box-shadow .5s" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>LIVE</span>
            </div>
            {/* Notification */}
            <div style={{ position: "relative" }}>
              <div style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, width: 38, height: 38,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon d={ICONS.bell} size={17} color="#64748b" />
                <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #f8fafc" }} />
              </div>
              {false && (
                <div style={{
                  position: "absolute", right: 0, top: 46, width: 300, background: "#fff",
                  borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", zIndex: 100,
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13 }}>Notifications</div>
                  {ALERTS.slice(0, 4).map(a => (
                    <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: a.status === "Critical" ? "#fef2f2" : "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon d={ICONS.alert} size={15} color={a.status === "Critical" ? "#dc2626" : "#ea580c"} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{a.type} — {a.amount}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ padding: "28px" }}>

          {/* ══════════ OVERVIEW ══════════════════════════════════════════ */}
          {tab === "overview" && (
            <>
              {/* KPI cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Fraud Detected", value: "3,777", sub: "+12% this week", icon: "shield", iconBg: "#fef2f2", iconColor: "#dc2626", sparkData: [300,420,390,510,480,560,521], sparkColor: "#dc2626" },
                  { label: "Total Transactions", value: "142,891", sub: "+8% this week", icon: "barChart", iconBg: "#eff6ff", iconColor: "#2563eb", sparkData: [10200,11800,11200,13400,12900,14500,14200], sparkColor: "#2563eb" },
                  { label: "Avg Risk Score", value: "67.4", sub: "−3.2 pts from last wk", icon: "activity", iconBg: "#fff7ed", iconColor: "#ea580c", sparkData: [72,68,74,69,71,66,67], sparkColor: "#ea580c" },
                  { label: "Model Accuracy", value: "96.7%", sub: "Neural Net leading", icon: "zap", iconBg: "#f0fdf4", iconColor: "#16a34a", sparkData: [93,94,93,95,94,96,96.7], sparkColor: "#16a34a" },
                ].map(k => (
                  <div key={k.label} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{k.sub}</div>
                      </div>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: k.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={ICONS[k.icon]} size={18} color={k.iconColor} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent alerts summary */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Recent Fraud Alerts</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Last 4 hours</div>
                  </div>
                  <button onClick={() => setTab("alerts")} style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>View All →</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                        {["Alert ID","User","Amount","Risk","Type","Status"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ALERTS.slice(0, 5).map(a => (
                        <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#6366f1" }}>{a.id}</td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>{a.user}</td>
                          <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{a.amount}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 48, height: 5, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                                <div style={{ width: `${a.risk}%`, height: "100%", background: a.risk >= 85 ? "#dc2626" : a.risk >= 70 ? "#ea580c" : a.risk >= 50 ? "#f59e0b" : "#22c55e", borderRadius: 999 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{a.risk}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b" }}>{a.type}</td>
                          <td style={{ padding: "10px 12px" }}><StatusBadge s={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══════════ FRAUD ALERTS ═══════════════════════════════════════ */}
          {tab === "alerts" && (
            <>
              {/* Summary chips */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Critical", count: ALERTS.filter(a => a.status === "Critical").length, color: "#dc2626", bg: "#fef2f2" },
                  { label: "High", count: ALERTS.filter(a => a.status === "High").length, color: "#ea580c", bg: "#fff7ed" },
                  { label: "Medium", count: ALERTS.filter(a => a.status === "Medium").length, color: "#ca8a04", bg: "#fefce8" },
                  { label: "Low", count: ALERTS.filter(a => a.status === "Low").length, color: "#16a34a", bg: "#f0fdf4" },
                ].map(c => (
                  <div key={c.label} onClick={() => setAlertFilter(alertFilter === c.label ? "All" : c.label)}
                    style={{ background: alertFilter === c.label ? c.color : "#fff", borderRadius: 14, padding: "16px 20px", cursor: "pointer", border: `2px solid ${alertFilter === c.label ? c.color : "#e2e8f0"}`, transition: "all .15s" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: alertFilter === c.label ? "#fff" : c.color }}>{c.count}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: alertFilter === c.label ? "rgba(255,255,255,0.8)" : "#94a3b8" }}>{c.label} Alerts</div>
                  </div>
                ))}
              </div>

              {/* Search + filter */}
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Icon d={ICONS.search} size={15} color="#94a3b8" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search alerts by ID, user, type…"
                    style={{
                      width: "100%", paddingLeft: 36, paddingRight: 14, height: 40,
                      borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff",
                      fontSize: 13, color: "#0f172a", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon d={ICONS.search} size={15} color="#94a3b8" />
                  </div>
                </div>
                <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)}
                  style={{ height: 40, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", padding: "0 14px", fontSize: 13, color: "#374151", outline: "none" }}>
                  <option value="All">All Severity</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Alerts table */}
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                    Fraud Alerts <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>({filteredAlerts.length} records)</span>
                  </div>
                  <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Icon d={ICONS.download} size={13} color="#fff" /> Export CSV
                  </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        {["Alert ID","Time","User","Amount","Risk Score","Type","Location","Status","Action"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlerts.filter(a => !search || a.id.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase())).map((a, i) => (
                        <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#6366f1", whiteSpace: "nowrap" }}>{a.id}</td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{a.time}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.user}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{a.amount}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 56, height: 5, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                                <div style={{ width: `${a.risk}%`, height: "100%", borderRadius: 999, background: a.risk >= 85 ? "#dc2626" : a.risk >= 70 ? "#ea580c" : "#f59e0b" }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: a.risk >= 85 ? "#dc2626" : a.risk >= 70 ? "#ea580c" : "#ca8a04" }}>{a.risk}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{a.type}</td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{a.location}</td>
                          <td style={{ padding: "12px 16px" }}><StatusBadge s={a.status} /></td>
                          <td style={{ padding: "12px 16px" }}>
                            {(() => {
                              const blockStatus = getBlockStatus(a.user);
                              const blockAction = getBlockAction(a.risk);

                              if (blockStatus.status === "perm") {
                                return (
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <button 
                                      onClick={() => handleUnblock(a.user, "perm")}
                                      style={{ 
                                        fontSize: 10, 
                                        padding: "4px 8px", 
                                        borderRadius: 6, 
                                        border: "1px solid #bfdbfe", 
                                        background: "#eff6ff", 
                                        color: "#2563eb", 
                                        cursor: "pointer",
                                        fontWeight: 600
                                      }}
                                    >
                                      Unblock
                                    </button>
                                    <span style={{ fontSize: 10, padding: "4px 8px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, fontWeight: 700 }}>
                                      BLOCKED
                                    </span>
                                  </div>
                                );
                              }

                              if (blockStatus.status === "temp") {
                                return (
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <button 
                                      onClick={() => handleUnblock(a.user, "temp")}
                                      style={{ 
                                        fontSize: 10, 
                                        padding: "4px 8px", 
                                        borderRadius: 6, 
                                        border: "1px solid #bfdbfe", 
                                        background: "#eff6ff", 
                                        color: "#2563eb", 
                                        cursor: "pointer",
                                        fontWeight: 600
                                      }}
                                    >
                                      Unblock
                                    </button>
                                    <span style={{ fontSize: 10, padding: "4px 8px", background: "#fef3c7", color: "#d97706", borderRadius: 6, fontWeight: 700 }}>
                                      TEMP
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div style={{ display: "flex", gap: 6 }}>
                                  {(blockAction === "temporary" || blockAction === "both") && (
                                    <button
                                      onClick={() => handleTemporaryBlock(a.user)}
                                      style={{
                                        fontSize: 10,
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        border: "1px solid #fbbf24",
                                        background: "#fef3c7",
                                        color: "#d97706",
                                        cursor: "pointer",
                                        fontWeight: 600
                                      }}
                                      title={a.risk >= 50 ? "Temporarily block this user" : "Low risk - temporary block"}
                                    >
                                      Temp
                                    </button>
                                  )}
                                  {(blockAction === "permanent" || blockAction === "both") && (
                                    <button
                                      onClick={() => handlePermanentBlock(a.user)}
                                      style={{
                                        fontSize: 10,
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        border: "1px solid #fecaca",
                                        background: "#fee2e2",
                                        color: "#dc2626",
                                        cursor: "pointer",
                                        fontWeight: 600
                                      }}
                                      title={a.risk >= 90 ? "Permanently block this user" : "Option to permanently block"}
                                    >
                                      Perm
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══════════ AI MODELS ══════════════════════════════════════════ */}
          {tab === "models" && (
            <div style={{ background: "#0f172a", borderRadius: "20px", padding: "32px", minHeight: "600px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
              <h2 style={{ marginBottom: "28px", color: "#fff", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>AI Models</h2>

              {/* MODELS LIST */}
              {[
                {
                  name: "Random Forest",
                  desc: "Ensemble decision tree model for fraud detection"
                },
                {
                  name: "Neural Network",
                  desc: "Deep learning model for transaction pattern detection"
                },
                {
                  name: "Logistic Regression",
                  desc: "Baseline model for quick fraud probability estimation"
                }
              ].map((model, i) => {
                const isTraining = trainingModels[model.name];
                const status = modelStatus[model.name] || "Ready";
                
                return (
                  <div key={i} style={{
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    padding: "20px",
                    borderRadius: "14px",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #334155",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    transition: "all 0.3s ease"
                  }}>
                    
                    {/* LEFT SIDE */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "16px", fontWeight: "700" }}>{model.name}</h3>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: 6, marginBottom: 0 }}>
                        {model.desc}
                      </p>
                      <div style={{ fontSize: "11px", color: isTraining ? "#f59e0b" : "#16a34a", marginTop: 8, fontWeight: "600" }}>
                        Status: <strong>{status}</strong>
                      </div>
                    </div>

                    {/* RIGHT SIDE BUTTONS */}
                    <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                      
                      <button
                        onClick={() => handleModelTrain(model.name)}
                        disabled={isTraining}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background: isTraining ? "#4ade80" : "#22c55e",
                          color: "#fff",
                          cursor: isTraining ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "12px",
                          opacity: isTraining ? 0.7 : 1,
                          transition: "all 0.2s"
                        }}
                      >
                        {isTraining ? "Training..." : "Train"}
                      </button>

                      <button
                        onClick={() => handleModelRetrain(model.name)}
                        disabled={isTraining}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background: isTraining ? "#818cf8" : "#6366f1",
                          color: "#fff",
                          cursor: isTraining ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "12px",
                          opacity: isTraining ? 0.7 : 1,
                          transition: "all 0.2s"
                        }}
                      >
                        {isTraining ? "Processing..." : "Retrain"}
                      </button>

                      <button
                        onClick={() => handleModelStop(model.name)}
                        disabled={!isTraining}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background: !isTraining ? "#fca5a5" : "#ef4444",
                          color: "#fff",
                          cursor: !isTraining ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "12px",
                          opacity: !isTraining ? 0.5 : 1,
                          transition: "all 0.2s"
                        }}
                      >
                        Stop
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════ TRANSACTIONS ═══════════════════════════════════════ */}
          {tab === "transactions" && (
            <>
              {/* Search & filters */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {/* Search */}
                  <div style={{ flex: 2, minWidth: 200, position: "relative" }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                      <Icon d={ICONS.search} size={15} color="#94a3b8" />
                    </div>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search by ID, user, merchant, amount…"
                      style={{
                        width: "100%", paddingLeft: 38, paddingRight: 14, height: 42, boxSizing: "border-box",
                        borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc",
                        fontSize: 13, color: "#0f172a", outline: "none",
                      }}
                    />
                  </div>
                  {/* Status filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon d={ICONS.filter} size={14} color="#94a3b8" />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      style={{ height: 42, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", padding: "0 14px", fontSize: 13, color: "#374151", outline: "none" }}>
                      <option value="All">All Status</option>
                      <option value="Flagged">Flagged</option>
                      <option value="Review">Under Review</option>
                      <option value="Pending">Pending</option>
                      <option value="Cleared">Cleared</option>
                    </select>
                  </div>
                  {/* Risk filter */}
                  <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                    style={{ height: 42, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", padding: "0 14px", fontSize: 13, color: "#374151", outline: "none" }}>
                    <option value="All">All Risk Levels</option>
                    <option value="Critical">Critical (85+)</option>
                    <option value="High">High (70–84)</option>
                    <option value="Medium">Medium (50–69)</option>
                    <option value="Low">Low (&lt;50)</option>
                  </select>
                  {/* Reset */}
                  {(search || filterStatus !== "All" || filterRisk !== "All") && (
                    <button onClick={() => { setSearch(""); setFilterStatus("All"); setFilterRisk("All"); }}
                      style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Clear Filters
                    </button>
                  )}
                  <button style={{ height: 42, marginLeft: "auto", padding: "0 18px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon d={ICONS.download} size={14} color="#fff" /> Export
                  </button>
                </div>

                {/* Active filter chips */}
                {(filterStatus !== "All" || filterRisk !== "All") && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {filterStatus !== "All" && <span style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>Status: {filterStatus}</span>}
                    {filterRisk !== "All" && <span style={{ fontSize: 11, background: "#f5f3ff", color: "#7c3aed", padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>Risk: {filterRisk}</span>}
                  </div>
                )}
              </div>

              {/* Table */}
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                    All Transactions <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>({filteredTxn.length} of {transactions.length})</span>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        {["TXN ID","Date","User","Merchant","Amount","Method","Risk Score","Status","Actions"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxn.length === 0 ? (
                        <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No transactions match the current filters.</td></tr>
                      ) : filteredTxn.map((t, i) => (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: "1px solid #f8fafc",
                            background: i % 2 === 0 ? "#fff" : "#f9fafb"
                          }}
                          onClick={() => setSelectedTxn(selectedTxn?.id === t.id ? null : t)}
                        >
                          <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#6366f1", whiteSpace: "nowrap" }}>{t.id}</td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{t.date}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.user}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#374151" }}>{t.merchant}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{t.amount}</td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{t.method}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 56, height: 5, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                                <div style={{ width: `${t.riskScore}%`, height: "100%", borderRadius: 999, background: t.riskScore >= 85 ? "#dc2626" : t.riskScore >= 70 ? "#ea580c" : t.riskScore >= 50 ? "#f59e0b" : "#22c55e" }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: t.riskScore >= 85 ? "#dc2626" : t.riskScore >= 70 ? "#ea580c" : t.riskScore >= 50 ? "#ca8a04" : "#16a34a" }}>{t.riskScore}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}><StatusBadge s={t.displayStatus} /></td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              
                              <button
                                onClick={() => handleClear(t.id)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #22c55e",
                                  color: "#22c55e",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "600"
                                }}
                              >
                                Clear
                              </button>

                              <button
                                onClick={() => handleFlag(t.id)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #ef4444",
                                  color: "#ef4444",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "600"
                                }}
                              >
                                Flag
                              </button>

                              <button
                                onClick={() => handleEscalate(t.id)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #3b82f6",
                                  color: "#3b82f6",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "600"
                                }}
                              >
                                Escalate
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expanded detail row */}
                {selectedTxn && (
                  <div style={{ padding: "20px 24px", borderTop: "2px solid #f1f5f9", background: "#f8fafc", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>TRANSACTION ID</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#6366f1" }}>{selectedTxn.id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>USER EMAIL</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{selectedTxn.user}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>RISK ASSESSMENT</div>
                      <RiskBadge score={selectedTxn.riskScore} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>QUICK ACTIONS</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleClear(selectedTxn.id)} style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", cursor: "pointer" }}>Clear</button>
                        <button onClick={() => handleFlag(selectedTxn.id)} style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer" }}>Flag</button>
                        <button onClick={() => handleEscalate(selectedTxn.id)} style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", cursor: "pointer" }}>Escalate</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
