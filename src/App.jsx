import { useState, useEffect } from 'react'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth"

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore"

import { auth, db } from './firebase'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

import jsPDF from 'jspdf'

import './App.css'
import LandingPage from './LandingPage'

// PREMIUM CATEGORY MAPPINGS FOR ICONS AND STYLES
const CATEGORY_DETAILS = {
  Food: {
    label: "Food",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.1)",
    border: "rgba(99, 102, 241, 0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M11 2v4M15 2v8a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V2M18 13v9" />
      </svg>
    )
  },
  Travel: {
    label: "Travel",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    )
  },
  Shopping: {
    label: "Shopping",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  Bills: {
    label: "Bills",
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.1)",
    border: "rgba(244, 63, 94, 0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 10h6M9 14h6M9 18h6" />
      </svg>
    )
  },
  Entertainment: {
    label: "Entertainment",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.1)",
    border: "rgba(168, 85, 247, 0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    )
  },
  Default: {
    label: "Other",
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.1)",
    border: "rgba(148, 163, 184, 0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  }
}

function getCategoryDetails(category) {
  return CATEGORY_DETAILS[category] || CATEGORY_DETAILS.Default
}

function getMerchantAvatar(title, category) {
  const initials = title
    ? title
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "TX";
  const cat = getCategoryDetails(category);
  return (
    <div
      className="merchant-avatar"
      style={{
        background: `linear-gradient(135deg, ${cat.color}dd, ${cat.color}55)`,
        color: '#ffffff'
      }}
    >
      {initials}
    </div>
  );
}

function App() {

  const [currentPage, setCurrentPage] = useState("landing")

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("expense_tracker_dark_mode");
    return saved !== null ? JSON.parse(saved) : false;
  })

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const [budget, setBudget] = useState("")
  const [budgetType, setBudgetType] = useState("Monthly")
  const [isBudgetTypeDropdownOpen, setIsBudgetTypeDropdownOpen] = useState(false)
  const [isBudgetTypeDropdownOpenTab, setIsBudgetTypeDropdownOpenTab] = useState(false)

  const [expenseTitle, setExpenseTitle] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [dateMode, setDateMode] = useState("today")

  const [expenses, setExpenses] = useState([])

  const [editingId, setEditingId] = useState(null)

  const [searchTerm, setSearchTerm] = useState("")

  const [filterCategory, setFilterCategory] = useState("All")

  const [showChart, setShowChart] = useState(false)

  // STABILITY & PERSISTENCE STATES
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("expense_tracker_active_tab") || "overview";
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("expense_tracker_sidebar_collapsed") === "true";
  })

  // QUICK ADD MODAL & SMART DEFAULT STATES
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [advancedQuickAdd, setAdvancedQuickAdd] = useState(false)

  const getMostFrequentCategory = () => {
    if (expenses.length === 0) return "Food";
    const counts = {};
    expenses.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    let maxCat = "Food";
    let maxCount = 0;
    Object.keys(counts).forEach(cat => {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        maxCat = cat;
      }
    });
    return maxCat;
  };

  async function handleSignup() {

    try {

      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      setCurrentPage("dashboard")

    }

    catch (error) {

      alert(error.message)

    }

  }

  async function handleLogin() {

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      setCurrentPage("dashboard")

    }

    catch (error) {

      alert("Invalid Credentials")

    }

  }

  async function handleLogout() {

    try {

      await signOut(auth)

      setExpenses([])

      setCurrentPage("logout")

    }

    catch (error) {

      alert("Logout Failed")

    }

  }

  async function fetchExpenses(uid) {

    const activeUid = uid || currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) return;

    const q = query(

      collection(db, "expenses"),

      where(
        "uid",
        "==",
        activeUid
      )

    )

    const querySnapshot =
      await getDocs(q)

    const expenseList = []

    querySnapshot.forEach((docSnap) => {

      expenseList.push({

        id: docSnap.id,

        ...docSnap.data()

      })

    })

    // Sort latest date first (descending), then by creation timestamp (descending)
    expenseList.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      if (dateB !== dateA) {
        return dateB.localeCompare(dateA);
      }
      
      const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : (a.createdAt.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt))) : 0;
      const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : (b.createdAt.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt))) : 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }

      return (b.id || "").localeCompare(a.id || "");
    });

    setExpenses(expenseList)

  }

  async function saveBudget() {

    const activeUid = currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) {
      alert("User session not found")
      return
    }

    await setDoc(

      doc(
        db,
        "budgets",
        activeUid
      ),

      {

        amount: budget,

        type: budgetType

      }

    )

    alert("Budget Saved")

  }

  async function fetchBudget(uid) {

    const activeUid = uid || currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) return;

    const budgetRef = doc(

      db,
      "budgets",
      activeUid

    )

    const budgetSnap =
      await getDoc(budgetRef)

    if (budgetSnap.exists()) {

      setBudget(
        budgetSnap.data().amount
      )

      setBudgetType(
        budgetSnap.data().type
      )

    }

  }

  async function handleAddExpense() {

    if (
      !expenseTitle ||
      !expenseAmount ||
      !expenseCategory ||
      !expenseDate
    ) {

      alert("Fill all fields")

      return

    }

    if (Number(expenseAmount) <= 0 || isNaN(Number(expenseAmount))) {
      alert("Please enter a valid expense amount.")
      return
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (expenseDate > todayStr) {
      alert("Future transactions are not allowed.")
      return
    }

    const activeUid = currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) {
      alert("User session not found")
      return
    }

    if (editingId) {

      const expenseRef = doc(
        db,
        "expenses",
        editingId
      )

      await updateDoc(expenseRef, {

        title: expenseTitle,

        amount: expenseAmount,

        category: expenseCategory,

        date: expenseDate

      })

      setEditingId(null)

    }

    else {

      await addDoc(

        collection(db, "expenses"),

        {

          title: expenseTitle,

          amount: expenseAmount,

          category: expenseCategory,

          date: expenseDate,

          uid: activeUid,

          createdAt: serverTimestamp()

        }

      )

    }

    setExpenseTitle("")
    setExpenseAmount("")
    setExpenseCategory("")
    setExpenseDate(new Date().toISOString().slice(0, 10))
    setDateMode("today")

    fetchExpenses(activeUid)

  }

  async function handleQuickAddSave() {
    const amt = expenseAmount;
    if (!amt || Number(amt) <= 0 || isNaN(Number(amt))) {
      alert("Please enter a valid expense amount.");
      return;
    }

    const cat = expenseCategory || getMostFrequentCategory();
    const title = expenseTitle.trim() || `${cat} Expense`;
    const date = expenseDate || new Date().toISOString().slice(0, 10);

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date > todayStr) {
      alert("Future transactions are not allowed.");
      return;
    }

    const activeUid = currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) {
      alert("User session not found");
      return;
    }

    try {
      await addDoc(
        collection(db, "expenses"),
        {
          title: title,
          amount: amt,
          category: cat,
          date: date,
          uid: activeUid,
          createdAt: serverTimestamp()
        }
      );

      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseCategory("");
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setDateMode("today");
      setAdvancedQuickAdd(false);
      setShowQuickAdd(false);

      fetchExpenses(activeUid);
    } catch (error) {
      alert("Failed to save expense: " + error.message);
    }
  }

  async function handleDeleteExpense(id) {

    await deleteDoc(
      doc(db, "expenses", id)
    )

    const activeUid = currentUser?.uid || auth.currentUser?.uid;
    fetchExpenses(activeUid)

  }

  function handleEditExpense(expense) {

    setExpenseTitle(expense.title)

    setExpenseAmount(expense.amount)

    setExpenseCategory(expense.category)

    setExpenseDate(expense.date)

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (expense.date === todayStr) {
      setDateMode("today");
    } else if (expense.date === yesterdayStr) {
      setDateMode("yesterday");
    } else {
      setDateMode("custom");
    }

    setEditingId(expense.id)

    // Automatically transition to Transactions Tab for editing
    setActiveTab("transactions")

  }

  function exportPDF() {

    const pdf = new jsPDF()

    // --------------------------------------------------
    // PAGE 1: BRANDING & EXECUTIVE SUMMARY
    // --------------------------------------------------
    
    // Left decorative brand bar
    pdf.setFillColor(15, 23, 42); // Deep Slate Navy
    pdf.rect(0, 0, 8, 297, "F");

    // Growth Compass Logo Mark
    pdf.setFillColor(16, 185, 129); // Emerald
    pdf.rect(20, 15, 3, 7, "F");
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.rect(25, 11, 3, 11, "F");
    pdf.setFillColor(245, 158, 11); // Gold
    pdf.rect(30, 17, 3, 5, "F");

    // Brand Name and Tagline
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text("TrackWise", 38, 20);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Track smarter. Spend wiser.", 38, 25);

    // Thin divider line
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(20, 31, 190, 31);

    // User metadata row
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("PREPARED FOR", 20, 40);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(currentUser?.email || "User Account", 20, 46);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("REPORT PERIOD", 85, 40);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${budgetType || "Monthly"} Budget Cycle`, 85, 46);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("AUTHORSHIP", 145, 40);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Built by A.", 145, 46);

    pdf.line(20, 52, 190, 52);

    // Section Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text("EXECUTIVE SUMMARY", 20, 62);

    // 2x2 grid of Cards
    // Row 1
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(20, 68, 80, 24, "S");
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20.5, 68.5, 79, 23, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("TOTAL BUDGET LIMIT", 25, 75);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Rs ${budget || 0}`, 25, 84);

    pdf.setDrawColor(226, 232, 240);
    pdf.rect(110, 68, 80, 24, "S");
    pdf.setFillColor(248, 250, 252);
    pdf.rect(110.5, 68.5, 79, 23, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("TOTAL EXPENSES DEBITED", 115, 75);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(239, 68, 68); // Red
    pdf.text(`Rs ${totalSpent}`, 115, 84);

    // Row 2
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(20, 98, 80, 24, "S");
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20.5, 98.5, 79, 23, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("REMAINING BALANCES", 25, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    if (budgetLeft >= 0) {
      pdf.setTextColor(16, 185, 129); // Green
    } else {
      pdf.setTextColor(239, 68, 68); // Red
    }
    pdf.text(`Rs ${budgetLeft}`, 25, 114);

    pdf.setDrawColor(226, 232, 240);
    pdf.rect(110, 98, 80, 24, "S");
    pdf.setFillColor(248, 250, 252);
    pdf.rect(110.5, 98.5, 79, 23, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("BUDGET UTILIZATION RATE", 115, 105);
    const utilizationRate = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    if (utilizationRate > 100) {
      pdf.setTextColor(239, 68, 68);
    } else if (utilizationRate > 80) {
      pdf.setTextColor(245, 158, 11);
    } else {
      pdf.setTextColor(37, 99, 235);
    }
    pdf.text(`${utilizationRate}%`, 115, 114);

    // Spending Insights Section
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text("REAL-TIME SPENDING INSIGHTS", 20, 134);

    pdf.setDrawColor(226, 232, 240);
    pdf.rect(20, 140, 170, 80, "S");
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20.5, 140.5, 169, 79, "F");

    let peakCategory = "None";
    let peakAmount = 0;
    let minCategory = "None";
    let minAmount = Infinity;

    Object.keys(categoryTotals).forEach(cat => {
      const val = categoryTotals[cat];
      if (val > peakAmount) {
        peakAmount = val;
        peakCategory = cat;
      }
      if (val < minAmount) {
        minAmount = val;
        minCategory = cat;
      }
    });
    if (minCategory === "None" || minAmount === Infinity) {
      minCategory = "None";
      minAmount = 0;
    }

    const concentrationRatio = totalSpent > 0 ? Math.round((peakAmount / totalSpent) * 100) : 0;
    const savingsRatio = budget > 0 ? Math.max(0, Math.round(((budget - totalSpent) / budget) * 100)) : 0;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    
    pdf.text("Spending Concentration:", 26, 154);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(70, 80, 95);
    pdf.text(`Your top category (${peakCategory}) represents ${concentrationRatio}% of total spending.`, 65, 154);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text("Peak Expense Category:", 26, 168);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(70, 80, 95);
    pdf.text(`Highest allocation is ${peakCategory} with a total debit of Rs ${peakAmount}.`, 65, 168);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text("Min Expense Category:", 26, 182);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(70, 80, 95);
    pdf.text(`Lowest allocation is ${minCategory} with a total debit of Rs ${minAmount}.`, 65, 182);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text("Transaction Count:", 26, 196);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(70, 80, 95);
    pdf.text(`A total of ${expenses.length} transaction entries have been processed in this cycle.`, 65, 196);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text("Cycle Balance Rating:", 26, 210);
    let statusRating = "Optimized Balance Flow";
    let statusColor = [16, 185, 129];
    if (utilizationRate > 100) {
      statusRating = "Budget Overrun Warning";
      statusColor = [239, 68, 68];
    } else if (utilizationRate > 80) {
      statusRating = "Caution Threshold Reached";
      statusColor = [245, 158, 11];
    }
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(`${statusRating} (Savings Rate: ${savingsRatio}%)`, 65, 210);

    // --------------------------------------------------
    // PAGE 2: CATEGORY BREAKDOWN & LEDGER APPENDIX
    // --------------------------------------------------
    pdf.addPage();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text("FINANCIAL ANALYTICS & CATEGORY BREAKDOWN", 20, 24);

    const categoriesAvailable = ["Food", "Travel", "Shopping", "Bills", "Entertainment"];
    let barY = 32;

    categoriesAvailable.forEach((category) => {
      const amt = categoryTotals[category] || 0;
      const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(category, 20, barY);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(37, 99, 235);
      pdf.text(`Rs ${amt} (${Math.round(pct)}%)`, 190, barY, { align: "right" });

      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, barY + 2, 170, 3, "F");

      const styleCat = getCategoryDetails(category);
      let cleanHex = styleCat.color.replace('#', '');
      let rFill = parseInt(cleanHex.substring(0, 2), 16);
      let gFill = parseInt(cleanHex.substring(2, 4), 16);
      let bFill = parseInt(cleanHex.substring(4, 6), 16);

      pdf.setFillColor(rFill, gFill, bFill);
      pdf.rect(20, barY + 2, Math.min((pct / 100) * 170, 170), 3, "F");

      barY += 10;
    });

    pdf.line(20, 86, 190, 86);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text("TRANSACTION LEDGER APPENDIX", 20, 96);

    pdf.setFillColor(15, 23, 42);
    pdf.rect(20, 102, 170, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Title", 22, 107.5);
    pdf.text("Category", 96, 107.5);
    pdf.text("Amount", 188, 107.5, { align: "right" });

    // Format helper for dates in PDF
    const formatPDFDate = (dateStr) => {
      if (!dateStr || dateStr === "No Date") return "No Date";
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = months[monthIdx] || parts[1];
      const dayStr = String(day).padStart(2, '0');
      return `${monthName} ${dayStr}, ${year}`;
    };

    // Sort transactions latest first
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      if (dateB !== dateA) {
        return dateB.localeCompare(dateA);
      }
      
      const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : (a.createdAt.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt))) : 0;
      const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : (b.createdAt.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt))) : 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }

      return (b.id || "").localeCompare(a.id || "");
    });

    // Group transactions by date
    const dateGroups = {};
    sortedExpenses.forEach((expense) => {
      const dStr = expense.date || "No Date";
      if (!dateGroups[dStr]) {
        dateGroups[dStr] = [];
      }
      dateGroups[dStr].push(expense);
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
      if (a === "No Date") return 1;
      if (b === "No Date") return -1;
      return new Date(b) - new Date(a);
    });

    let tableY = 114;
    let rowCount = 0;

    sortedDates.forEach((dateStr) => {
      const groupExpenses = dateGroups[dateStr];
      if (!groupExpenses || groupExpenses.length === 0) return;

      // Check if we need a page break for the Date Header + 1 transaction row
      if (tableY + 18 > 265) {
        pdf.addPage();
        
        pdf.setFillColor(15, 23, 42);
        pdf.rect(20, 25, 170, 8, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text("Title", 22, 30.5);
        pdf.text("Category", 96, 30.5);
        pdf.text("Amount", 188, 30.5, { align: "right" });

        tableY = 37;
      }

      // Draw Group Date Header
      if (tableY !== 114 && tableY !== 37) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(20, tableY - 1, 190, tableY - 1);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(formatPDFDate(dateStr), 22, tableY + 4);

      // Draw underline beneath the date header
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(20, tableY + 6, 190, tableY + 6);

      tableY += 10;

      // Draw group transactions
      groupExpenses.forEach((expense) => {
        if (tableY > 265) {
          pdf.addPage();

          pdf.setFillColor(15, 23, 42);
          pdf.rect(20, 25, 170, 8, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text("Title", 22, 30.5);
          pdf.text("Category", 96, 30.5);
          pdf.text("Amount", 188, 30.5, { align: "right" });

          tableY = 37;
        }

        if (rowCount % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(20, tableY, 170, 8, "F");
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);

        let titleStr = expense.title || "";
        if (titleStr.length > 35) titleStr = titleStr.substring(0, 32) + "...";
        pdf.text(titleStr, 22, tableY + 5.5);

        pdf.text(expense.category || "Other", 96, tableY + 5.5);

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(15, 23, 42);
        pdf.text(`Rs ${expense.amount}`, 188, tableY + 5.5, { align: "right" });

        tableY += 8;
        rowCount++;
      });

      // Add a small spacer after the group
      tableY += 4;
    });

    // --------------------------------------------------
    // GLOBAL PASS: HEADER & FOOTER CONFIGURATION
    // --------------------------------------------------
    const totalCount = pdf.internal.getNumberOfPages();
    const dateFormatted = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    
    for (let i = 1; i <= totalCount; i++) {
      pdf.setPage(i);

      // Header Rule (skip first page since it already has visual brand header)
      if (i > 1) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text("TrackWise Financial Statement — Confidential", 20, 13);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(20, 15, 190, 15);
      }

      // Footer Rule (on all pages)
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(20, 280, 190, 280);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Page ${i} of ${totalCount}`, 190, 285, { align: "right" });
      pdf.text(`TrackWise — Statement Summary  •  Generated on ${dateFormatted}`, 20, 285);
    }

    pdf.save("TrackWise_Financial_Statement.pdf");

  }

  const totalSpent = expenses.reduce(

    (total, expense) =>

      total + Number(expense.amount),

    0

  )

  const budgetLeft =
    Number(budget || 0) - totalSpent

  const latestExpense =
    expenses[0]?.title || "No Expenses"

  const filteredExpenses =
    expenses.filter((expense) => {

      const matchesSearch =
        expense.title
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )

      const matchesCategory =

        filterCategory === "All"
          ? true
          : expense.category ===
          filterCategory

      return (
        matchesSearch &&
        matchesCategory
      )

    })

  const monthlyExpenses =
    expenses.filter((expense) => {

      const currentMonth =
        new Date()
          .toISOString()
          .slice(0, 7)

      return expense.date.startsWith(
        currentMonth
      )

    })

  const monthlySpent =
    monthlyExpenses.reduce(

      (total, expense) =>

        total +
        Number(expense.amount),

      0

    )

  const categoryTotals = {}

  expenses.forEach((expense) => {

    if (
      categoryTotals[
      expense.category
      ]
    ) {

      categoryTotals[
        expense.category
      ] += Number(expense.amount)

    }

    else {

      categoryTotals[
        expense.category
      ] =
        Number(expense.amount)

    }

  })

  const pieData = Object.keys(
    categoryTotals
  ).map((category) => ({

    name: category,

    value:
      categoryTotals[category]

  }))

  const COLORS = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#f43f5e", // Rose
    "#a855f7", // Purple
    "#06b6d4"  // Cyan
  ]

  // Color Mapping Helper for PieChart segments to align colors with category system
  const categoryColorMapping = {
    Food: "#6366f1",
    Travel: "#10b981",
    Shopping: "#f59e0b",
    Bills: "#f43f5e",
    Entertainment: "#a855f7"
  }

  useEffect(() => {
    localStorage.setItem("expense_tracker_dark_mode", JSON.stringify(darkMode));
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem("expense_tracker_active_tab", activeTab);
  }, [activeTab])

  useEffect(() => {
    localStorage.setItem("expense_tracker_sidebar_collapsed", sidebarCollapsed);
  }, [sidebarCollapsed])

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        (user) => {

          setCurrentUser(user)

          if (user) {

            setCurrentPage(
              "dashboard"
            )

            fetchExpenses(user.uid)

            fetchBudget(user.uid)

          }

          else {

            setCurrentPage(prev => {
              if (prev === "signup" || prev === "logout" || prev === "login") {
                return prev;
              }
              return "landing";
            })

          }

          setAuthLoading(false)

        }

      )

    return () => unsubscribe()

  }, [])

  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Verifying session...</p>
        </div>
      </div>
    )
  }

  return (

    <div className="app">

      {currentPage === "landing" && (
        <LandingPage
          onSignIn={() => setCurrentPage("login")}
          onSignUp={() => setCurrentPage("signup")}
        />
      )}

      {currentPage === "login" && (
        <div className="auth-split-container">
          {/* Left panel: Brand and Marketing info */}
          <div className="auth-marketing-side">
            <div className="auth-marketing-header" onClick={() => setCurrentPage("landing")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
                <path d="M12 2L2 22l10-4 10 4L12 2z" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="2 2"/>
                <path d="M12 18V9" stroke="var(--primary)" strokeWidth="2"/>
                <path d="M8 18v-4" stroke="var(--accent-blue)" strokeWidth="2"/>
                <path d="M16 18v-7" stroke="var(--accent-gold)" strokeWidth="2"/>
              </svg>
              <span className="auth-marketing-brand">TrackWise</span>
            </div>

            <div className="auth-marketing-body">
              <h1 className="auth-marketing-title">
                Track smarter.<br />Spend <span>wiser.</span>
              </h1>
              
              <div className="auth-marketing-features">
                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="auth-feature-text">
                    <h4>Add Expenses Quickly</h4>
                    <p>Record transactions in 5 seconds with category pills and smart pre-filled defaults.</p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="auth-feature-text">
                    <h4>Your Financial Overview</h4>
                    <p>Track available budget, monthly spending, and your overall transactions ledger.</p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="auth-feature-text">
                    <h4>Executive PDF Statements</h4>
                    <p>Export beautiful, detailed cover pages, financial charts, and transaction ledgers.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-marketing-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ color: '#94a3b8' }}>Secure authentication powered by Firebase</span>
            </div>
          </div>

          {/* Right panel: Login Form */}
          <div className="auth-form-side">
            <div className="auth-form-card">
              <h2>Welcome to TrackWise</h2>
              <p className="subtitle">Sign in to your financial overview</p>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button onClick={handleLogin}>
                Sign In
              </button>

              <p className="switch-text" style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--subtext)' }}>
                New to TrackWise?{' '}
                <span
                  style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setCurrentPage("signup")}
                >
                  Create an account
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {currentPage === "signup" && (
        <div className="auth-split-container">
          {/* Left panel: Brand and Marketing info */}
          <div className="auth-marketing-side">
            <div className="auth-marketing-header" onClick={() => setCurrentPage("landing")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
                <path d="M12 2L2 22l10-4 10 4L12 2z" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="2 2"/>
                <path d="M12 18V9" stroke="var(--primary)" strokeWidth="2"/>
                <path d="M8 18v-4" stroke="var(--accent-blue)" strokeWidth="2"/>
                <path d="M16 18v-7" stroke="var(--accent-gold)" strokeWidth="2"/>
              </svg>
              <span className="auth-marketing-brand">TrackWise</span>
            </div>

            <div className="auth-marketing-body">
              <h1 className="auth-marketing-title">
                Track smarter.<br />Spend <span>wiser.</span>
              </h1>
              
              <div className="auth-marketing-features">
                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="auth-feature-text">
                    <h4>Add Expenses Quickly</h4>
                    <p>Record transactions in 5 seconds with category pills and smart pre-filled defaults.</p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="auth-feature-text">
                    <h4>Your Financial Overview</h4>
                    <p>Track available budget, monthly spending, and your overall transactions ledger.</p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="auth-feature-text">
                    <h4>Executive PDF Statements</h4>
                    <p>Export beautiful, detailed cover pages, financial charts, and transaction ledgers.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-marketing-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ color: '#94a3b8' }}>Secure authentication powered by Firebase</span>
            </div>
          </div>

          {/* Right panel: Signup Form */}
          <div className="auth-form-side">
            <div className="auth-form-card">
              <h2>Create Account</h2>
              <p className="subtitle">Manage your wealth intelligently</p>

              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button onClick={handleSignup}>
                Create Account
              </button>

              <p className="switch-text" style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--subtext)' }}>
                Already have an account?{' '}
                <span
                  style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setCurrentPage("login")}
                >
                  Sign In
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {currentPage === "dashboard" && (

        <div className="dashboard-shell">

          {/* COLLAPSIBLE SIDEBAR */}
          <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>

            <div className="sidebar-header">

              <div className="logo-wrapper">

                <div className="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                    <path d="M12 2L2 22l10-4 10 4L12 2z" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="2 2"/>
                    <path d="M12 18V9" stroke="var(--primary)" strokeWidth="2"/>
                    <path d="M8 18v-4" stroke="var(--accent-blue)" strokeWidth="2"/>
                    <path d="M16 18v-7" stroke="var(--accent-gold)" strokeWidth="2"/>
                  </svg>
                </div>

                <span className="logo-text">TrackWise</span>

              </div>

              <button className="collapse-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {sidebarCollapsed ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                )}
              </button>

            </div>

            <nav className="sidebar-menu">

              <div className={`menu-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Overview</span>
              </div>

              <div className={`menu-item ${activeTab === "transactions" ? "active" : ""}`} onClick={() => setActiveTab("transactions")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>Transactions</span>
              </div>

              <div className={`menu-item ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Analytics</span>
              </div>

              <div className={`menu-item ${activeTab === "budget" ? "active" : ""}`} onClick={() => setActiveTab("budget")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4M4 6v12c0 1.1.9 2 2 2h14v-4" />
                  <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z" />
                </svg>
                <span>Budget Plan</span>
              </div>

            </nav>

            <div className="sidebar-footer">

              <div className="user-profile">

                <div className="user-avatar">
                  {currentUser?.email ? currentUser.email.slice(0, 2).toUpperCase() : "U"}
                </div>

                <div className="user-details">

                  <span className="user-name">Welcome Back</span>

                  <span className="user-email">{currentUser?.email || "User"}</span>

                </div>

              </div>

              <button className="logout-btn-sidebar" onClick={handleLogout} title="Logout account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span>Logout</span>
              </button>

            </div>

          </aside>

          {/* MOBILE BOTTOM NAVIGATION */}
          <nav className="mobile-nav">

            <div className={`mobile-nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
              </svg>
              <span>Overview</span>
            </div>

            <div className={`mobile-nav-item ${activeTab === "transactions" ? "active" : ""}`} onClick={() => setActiveTab("transactions")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Txns</span>
            </div>

            <div className={`mobile-nav-item ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Analytics</span>
            </div>

            <div className={`mobile-nav-item ${activeTab === "budget" ? "active" : ""}`} onClick={() => setActiveTab("budget")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4M4 6v12c0 1.1.9 2 2 2h14v-4" />
                <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z" />
              </svg>
              <span>Budget</span>
            </div>

            <div className="mobile-nav-item mobile-logout-item" onClick={handleLogout} style={{ color: "var(--danger)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Logout</span>
            </div>

          </nav>

          {/* MAIN CONTAINER PAGE */}
          <main className="main-content">

            {/* SHARED HEADER */}
            <header className="top-header">

              <div className="header-title-section">

                <h1>TrackWise</h1>

                <p>Track smarter. Spend wiser.</p>

              </div>

              <div className="header-actions">

                <button className="export-btn export-btn-full" onClick={exportPDF} title="Export PDF Report">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  <span>Export Report</span>
                </button>

                <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle Theme">
                  {darkMode ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>

              </div>

            </header>

            {/* TAB CONTENTS */}
            <div className="dashboard-viewport">

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <>

                  {/* HIGH-DENSITY COCKPIT DASHBOARD HERO */}
                  <div className="fintech-dashboard-hero">

                    {/* Metric 1: Available Budget */}
                    <div className="hero-metric-card">
                       <div className="metric-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span className="metric-label">{budgetLeft >= 0 ? "Available Budget" : "Budget Exceeded"}</span>
                         <svg viewBox="0 0 24 24" fill="none" stroke={budgetLeft >= 0 ? "var(--primary)" : "var(--danger)"} strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                           <rect x="2" y="4" width="20" height="16" rx="2" />
                           <line x1="12" y1="4" x2="12" y2="20" />
                         </svg>
                       </div>
                       <div className="metric-body">
                         <div className={`metric-value ${budgetLeft >= 0 ? "" : "danger"}`}>
                           {budgetLeft >= 0 ? `Rs${budgetLeft}` : `Overspent by Rs${Math.abs(budgetLeft)}`}
                         </div>
                         <div className="metric-subtext" style={{ marginTop: 4 }}>
                           Limit: Rs{budget || 0}
                         </div>
                       </div>
                       <div className="mini-progress-track">
                         <div
                           className={`mini-progress-bar ${(budget > 0 ? (totalSpent / budget) * 100 : 0) > 100 ? "danger" : ""}`}
                           style={{ width: `${Math.min(budget > 0 ? (totalSpent / budget) * 100 : 0, 100)}%` }}
                         ></div>
                       </div>
                     </div>

                    {/* Metric 2: Monthly Spending */}
                    <div className="hero-metric-card">
                      <div className="metric-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label">Monthly Spending</span>
                        {/* Micro sparkline */}
                        <svg viewBox="0 0 50 20" style={{ width: 42, height: 18 }}>
                          <path
                            d="M0 15 Q 10 5, 20 12 T 40 4 L 50 8"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-value spent-color">
                          Rs{monthlySpent}
                        </div>
                        <div className="metric-subtext" style={{ marginTop: 4 }}>
                          Outflow this month
                        </div>
                      </div>
                    </div>

                    {/* Metric 3: Total Outflow */}
                    <div className="hero-metric-card">
                      <div className="metric-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label">Total Outflow</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16, color: 'var(--subtext)' }}>
                          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-value">
                          Rs{totalSpent}
                        </div>
                        <div className="metric-subtext" style={{ marginTop: 4 }}>
                          All-time recorded expenses
                        </div>
                      </div>
                    </div>

                    {/* Metric 4: Total Transactions */}
                    <div className="hero-metric-card">
                      <div className="metric-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label">Total Transactions</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16, color: 'var(--subtext)' }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-value">
                          {expenses.length}
                        </div>
                        <div className="metric-subtext" style={{ marginTop: 4 }}>
                          Total processed entries
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* PREVIEW SPLIT GRID */}
                  <div className="dashboard-split-grid">

                    {/* Left: Quick Recent Transactions Preview */}
                    <div className="section-card">

                      <div className="section-header">

                        <h2 className="section-title">Recent Transactions Preview</h2>

                        <button className="secondary-btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => setActiveTab("transactions")}>
                          View All
                        </button>

                      </div>

                      <div className="expenses-section">

                        {expenses.length === 0 ? (

                          <div className="empty-card" style={{ padding: '30px' }}>
                            <p>No transactions added yet. Create one on the Transactions tab.</p>
                          </div>

                        ) : (

                          expenses.slice(0, 4).map((expense) => {
                            const cat = getCategoryDetails(expense.category);
                            return (
                              <div className="expense-card" key={expense.id}>
                                <div className="expense-left">
                                  {getMerchantAvatar(expense.title, expense.category)}
                                  <div className="expense-meta-info">
                                    <h3>{expense.title}</h3>
                                    <div className="expense-meta-tags">
                                      <span className="category-dot-badge">
                                        <span className="cat-dot" style={{ backgroundColor: cat.color }}></span>
                                        {expense.category || "Other"}
                                      </span>
                                      <span className="tag-separator">•</span>
                                      <small className="expense-date">{expense.date}</small>
                                    </div>
                                  </div>
                                </div>
                                <div className="expense-right">
                                  <span className="expense-amount">Rs{expense.amount}</span>
                                </div>
                              </div>
                            )
                          })

                        )}

                      </div>

                    </div>

                    {/* Right: Quick Budget Overview and Category Totals */}
                    <div className="section-card">

                      <div className="section-header">

                        <h2 className="section-title">Quick Settings & Categories</h2>

                        <button className="secondary-btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => setActiveTab("budget")}>
                          Configure
                        </button>

                      </div>

                      {/* Quick Budget Setting Box */}
                      <div className="budget-box">

                        <input
                          type="number"
                          placeholder="Budget amount"
                          value={budget}
                          onChange={(e) =>
                            setBudget(
                              e.target.value
                            )
                          }
                        />

                        <div 
                          className="custom-select-wrapper"
                          tabIndex={0}
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              setIsBudgetTypeDropdownOpen(false);
                            }
                          }}
                        >
                          <div 
                            className="custom-select-trigger"
                            onClick={() => setIsBudgetTypeDropdownOpen(!isBudgetTypeDropdownOpen)}
                          >
                            <span>{budgetType}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`select-chevron ${isBudgetTypeDropdownOpen ? "open" : ""}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                          {isBudgetTypeDropdownOpen && (
                            <div className="custom-select-options">
                              {["Weekly", "Monthly", "Yearly"].map((opt) => (
                                <div 
                                  key={opt}
                                  className={`custom-select-option ${budgetType === opt ? "selected" : ""}`}
                                  onClick={() => {
                                    setBudgetType(opt);
                                    setIsBudgetTypeDropdownOpen(false);
                                  }}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={saveBudget}
                        >
                          Save
                        </button>

                      </div>

                      {/* Category Breakdown Progress Listing */}
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtext)', marginBottom: 12 }}>
                        Category Distribution
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {Object.keys(categoryTotals).length === 0 ? (
                          <p style={{ fontSize: '0.9rem', color: 'var(--subtext)' }}>No categories recorded yet.</p>
                        ) : (
                          Object.keys(categoryTotals).map((category) => {
                            const val = categoryTotals[category];
                            const pct = totalSpent > 0 ? (val / totalSpent) * 100 : 0;
                            const cat = getCategoryDetails(category);
                            return (
                              <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexGrow: 1 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color }}></span>
                                    {category}
                                  </span>
                                  <span style={{ color: 'var(--subtext)' }}>Rs{val} ({Math.round(pct)}%)</span>
                                </div>
                                <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 100 }}>
                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cat.color, borderRadius: 100 }}></div>
                                </div>
                              </div>
                            )
                          })
                        )}

                      </div>

                    </div>

                  </div>

                </>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === "transactions" && (

                <div className="dashboard-split-grid">

                  {/* Left: In-line Transaction Creator */}
                  <div className="section-card">

                    <div className="section-header">

                      <h2 className="section-title">
                        {editingId ? "Modify Transaction" : "New Transaction"}
                      </h2>

                    </div>

                    <div className="expense-form-card">

                      <div className="input-group">

                        <label className="input-label">Expense Title</label>

                        <input
                          type="text"
                          placeholder="e.g. Netflix Subscription"
                          value={expenseTitle}
                          onChange={(e) =>
                            setExpenseTitle(
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="expense-form-row">

                        <div className="input-group">

                          <label className="input-label">Amount (Rs)</label>

                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={expenseAmount}
                            onChange={(e) =>
                              setExpenseAmount(
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <div className="input-group">
                          <label className="input-label">Date</label>
                          <div className="date-segmented-control">
                            <button
                              type="button"
                              className={`date-segment-btn ${dateMode === "today" ? "active" : ""}`}
                              onClick={() => {
                                setDateMode("today");
                                setExpenseDate(new Date().toISOString().slice(0, 10));
                              }}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              className={`date-segment-btn ${dateMode === "yesterday" ? "active" : ""}`}
                              onClick={() => {
                                setDateMode("yesterday");
                                const d = new Date();
                                d.setDate(d.getDate() - 1);
                                setExpenseDate(d.toISOString().slice(0, 10));
                              }}
                            >
                              Yesterday
                            </button>
                            <button
                              type="button"
                              className={`date-segment-btn ${dateMode === "custom" ? "active" : ""}`}
                              onClick={() => setDateMode("custom")}
                            >
                              Custom Date
                            </button>
                          </div>

                          {dateMode === "custom" && (
                            <div className="custom-date-picker-container" style={{ marginTop: 12 }}>
                              <input
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                onClick={(e) => {
                                  try {
                                    if (e.target.showPicker) e.target.showPicker();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                style={{ width: "100%" }}
                              />
                            </div>
                          )}
                        </div>

                      </div>

                      <div className="input-group">

                        <label className="input-label">Category</label>

                        <select
                          value={expenseCategory}
                          onChange={(e) =>
                            setExpenseCategory(
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            Select Category
                          </option>

                          <option>
                            Food
                          </option>

                          <option>
                            Travel
                          </option>

                          <option>
                            Shopping
                          </option>

                          <option>
                            Bills
                          </option>

                          <option>
                            Entertainment
                          </option>

                        </select>

                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>

                        <button
                          onClick={handleAddExpense}
                          style={{ flex: 1 }}
                        >
                          {
                            editingId
                              ? "Update Expense"
                              : "Add Expense"
                          }
                        </button>

                        {editingId && (
                          <button
                            className="secondary-btn"
                            onClick={() => {
                              setExpenseTitle("")
                              setExpenseAmount("")
                              setExpenseCategory("")
                              setExpenseDate(new Date().toISOString().slice(0, 10))
                              setDateMode("today")
                              setEditingId(null)
                            }}
                            style={{ width: 'auto' }}
                          >
                            Cancel
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* Right: Search, filter, and Transactions listing */}
                  <div className="section-card">

                    <div className="section-header">

                      <h2 className="section-title">Transactions History</h2>

                    </div>

                    <div className="filters-row" style={{ marginBottom: 24 }}>

                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) =>
                          setSearchTerm(
                            e.target.value
                          )
                        }
                      />

                      <select
                        value={filterCategory}
                        onChange={(e) =>
                          setFilterCategory(
                            e.target.value
                          )
                        }
                      >

                        <option>
                          All
                        </option>

                        <option>
                          Food
                        </option>

                        <option>
                          Travel
                        </option>

                        <option>
                          Shopping
                        </option>

                        <option>
                          Bills
                        </option>

                        <option>
                          Entertainment
                        </option>

                      </select>

                      <button
                        className="secondary-btn"
                        onClick={() =>
                          setShowChart(
                            !showChart
                          )
                        }
                        style={{ width: 'auto' }}
                        title="Toggle mini inline chart preview"
                      >
                        {
                          showChart
                            ? "Hide Chart"
                            : "Show Chart"
                        }
                      </button>

                    </div>

                    {showChart && (

                      <div className="chart-container" style={{ marginBottom: 24 }}>

                        <ResponsiveContainer
                          width="100%"
                          height={280}
                        >

                          <PieChart>

                            <Pie
                              data={pieData}
                              dataKey="value"
                              outerRadius={90}
                              label
                            >

                              {pieData.map(
                                (
                                  entry,
                                  index
                                ) => (

                                  <Cell
                                    key={index}
                                    fill={categoryColorMapping[entry.name] || COLORS[index % COLORS.length]}
                                  />

                                )
                              )}

                            </Pie>

                            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} labelStyle={{ color: 'var(--subtext)' }} />

                            <Legend />

                          </PieChart>

                        </ResponsiveContainer>

                      </div>

                    )}

                    <div className="expenses-section">

                      {filteredExpenses.length === 0 ? (

                        <div className="empty-card">
                          <svg className="empty-illustration" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007v.008H3.75V4.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 7.5h.007v.008H3.75V7.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 3h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                          <p>No transactions found. Add a transaction on the left to start charting your expenses.</p>
                        </div>

                      ) : (

                        filteredExpenses.map((expense) => {
                          const cat = getCategoryDetails(expense.category);
                          return (
                            <div className="expense-card" key={expense.id}>

                              <div className="expense-left">

                                {getMerchantAvatar(expense.title, expense.category)}

                                <div className="expense-meta-info">

                                  <h3>{expense.title}</h3>

                                  <div className="expense-meta-tags">
                                    <span className="category-dot-badge">
                                      <span className="cat-dot" style={{ backgroundColor: cat.color }}></span>
                                      {expense.category || "Other"}
                                    </span>
                                    <span className="tag-separator">•</span>
                                    <small className="expense-date">{expense.date}</small>
                                  </div>

                                </div>

                              </div>

                              <div className="expense-right">

                                <span className="expense-amount">Rs{expense.amount}</span>

                                <div className="expense-actions">

                                  <button className="edit-btn" onClick={() => handleEditExpense(expense)} title="Edit transaction">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                  </button>

                                  <button className="delete-btn" onClick={() => handleDeleteExpense(expense.id)} title="Delete transaction">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>

                                </div>

                              </div>

                            </div>
                          )
                        })

                      )}

                    </div>

                  </div>

                </div>

              )}

              {/* ANALYTICS TAB */}
              {activeTab === "analytics" && (

                <div className="dashboard-split-grid">

                  {/* Left: Large PieChart Panel */}
                  <div className="section-card">

                    <div className="section-header">

                      <h2 className="section-title">Visual Allocation Analysis</h2>

                    </div>

                    {pieData.length === 0 ? (

                      <div className="empty-card" style={{ padding: '60px' }}>
                        <svg className="empty-illustration" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                        </svg>
                        <p>No data available yet. Add transactions with categories to display the pie distribution chart.</p>
                      </div>

                    ) : (

                      <div className="chart-container">

                        <ResponsiveContainer
                          width="100%"
                          height={400}
                        >

                          <PieChart>

                            <Pie
                              data={pieData}
                              dataKey="value"
                              outerRadius={140}
                              label
                            >

                              {pieData.map(
                                (
                                  entry,
                                  index
                                ) => (

                                  <Cell
                                    key={index}
                                    fill={categoryColorMapping[entry.name] || COLORS[index % COLORS.length]}
                                  />

                                )
                              )}

                            </Pie>

                            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} labelStyle={{ color: 'var(--subtext)' }} />

                            <Legend />

                          </PieChart>

                        </ResponsiveContainer>

                      </div>

                    )}

                  </div>

                  {/* Right: Analysis & breakdowns */}
                  <div className="section-card">

                    <div className="section-header">

                      <h2 className="section-title">Breakdown Statistics</h2>

                    </div>

                    <p style={{ color: 'var(--subtext)', marginBottom: 24, fontSize: '0.9rem' }}>
                      Analyze how your money flows across categories to optimize monthly budgeting patterns.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      {pieData.length === 0 ? (
                        <p style={{ color: 'var(--subtext)' }}>No transaction details found to run breakdowns.</p>
                      ) : (
                        pieData.map((data, index) => {
                          const cat = getCategoryDetails(data.name);
                          const pct = totalSpent > 0 ? (data.value / totalSpent) * 100 : 0;
                          return (
                            <div key={data.name} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>

                              <div className="category-icon-bg" style={{ backgroundColor: cat.bg }}>
                                {cat.icon}
                              </div>

                              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700 }}>

                                  <span>{data.name}</span>

                                  <span style={{ color: cat.color }}>Rs{data.value}</span>

                                </div>

                                <div style={{ width: '100%', height: 6, backgroundColor: 'var(--border)', borderRadius: 100 }}>

                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cat.color, borderRadius: 100 }}></div>

                                </div>

                                <small style={{ fontSize: '0.75rem', color: 'var(--subtext)' }}>
                                  Consumes {Math.round(pct)}% of your overall monthly outgoings.
                                </small>

                              </div>

                            </div>
                          )
                        })
                      )}

                    </div>

                  </div>

                </div>

              )}

              {/* BUDGET TAB */}
              {activeTab === "budget" && (

                <div className="section-card" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>

                  <div className="section-header">

                    <h2 className="section-title">Configure Cycle Budget</h2>

                  </div>

                  <p style={{ color: 'var(--subtext)', marginBottom: 28, fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Define your expenditure threshold rules. Adjusting these levels alters color-coding systems on balances and cards inside your dashboard overview in real-time.
                  </p>

                  <div className="expense-form-card">

                    <div className="input-group">

                      <label className="input-label">Cycle Budget Limit (Rs)</label>

                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={budget}
                        onChange={(e) =>
                          setBudget(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label className="input-label">Budget Period Cycle</label>

                      <div 
                        className="custom-select-wrapper"
                        tabIndex={0}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setIsBudgetTypeDropdownOpenTab(false);
                          }
                        }}
                      >
                        <div 
                          className="custom-select-trigger"
                          onClick={() => setIsBudgetTypeDropdownOpenTab(!isBudgetTypeDropdownOpenTab)}
                        >
                          <span>{budgetType}</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`select-chevron ${isBudgetTypeDropdownOpenTab ? "open" : ""}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                        {isBudgetTypeDropdownOpenTab && (
                          <div className="custom-select-options">
                            {["Weekly", "Monthly", "Yearly"].map((opt) => (
                              <div 
                                key={opt}
                                className={`custom-select-option ${budgetType === opt ? "selected" : ""}`}
                                onClick={() => {
                                  setBudgetType(opt);
                                  setIsBudgetTypeDropdownOpenTab(false);
                                }}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    <button
                      onClick={saveBudget}
                      style={{ marginTop: 8 }}
                    >
                      Save Configuration
                    </button>

                  </div>

                </div>

              )}

            </div>

          </main>

          {/* FLOATING ACTION BUTTON (FAB) */}
          <button
            className="fab-btn"
            onClick={() => {
              setExpenseDate(new Date().toISOString().slice(0, 10));
              setExpenseCategory(getMostFrequentCategory());
              setExpenseTitle("");
              setExpenseAmount("");
              setShowQuickAdd(true);
            }}
            title="Quick Add Expense"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Quick Add</span>
          </button>

          {/* QUICK ADD OVERLAY MODAL */}
          {showQuickAdd && (
            <div className="quick-add-modal-overlay" onClick={() => setShowQuickAdd(false)}>
              <div className="quick-add-modal-card" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                  <h3>Quick Add Expense</h3>
                  <button className="modal-close-btn" onClick={() => setShowQuickAdd(false)}>&times;</button>
                </div>

                <div className="quick-add-form">
                  <div className="input-group">
                    <label className="input-label" style={{ textAlign: 'center' }}>Amount (Rs)</label>
                    <input
                      type="number"
                      className="amount-input-large"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Select Category</label>
                    <div className="category-pills-grid">
                      {["Food", "Travel", "Shopping", "Bills", "Entertainment"].map(catName => {
                        const details = getCategoryDetails(catName);
                        const isActive = expenseCategory === catName;
                        return (
                          <button
                            key={catName}
                            type="button"
                            className={`category-pill-btn ${isActive ? 'active' : ''}`}
                            style={isActive ? { '--cat-bg': details.bg, '--cat-color': details.color } : {}}
                            onClick={() => setExpenseCategory(catName)}
                          >
                            <span className="pill-dot" style={{ backgroundColor: details.color }}></span>
                            {catName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <div className="date-segmented-control">
                      <button
                        type="button"
                        className={`date-segment-btn ${dateMode === "today" ? "active" : ""}`}
                        onClick={() => {
                          setDateMode("today");
                          setExpenseDate(new Date().toISOString().slice(0, 10));
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className={`date-segment-btn ${dateMode === "yesterday" ? "active" : ""}`}
                        onClick={() => {
                          setDateMode("yesterday");
                          const d = new Date();
                          d.setDate(d.getDate() - 1);
                          setExpenseDate(d.toISOString().slice(0, 10));
                        }}
                      >
                        Yesterday
                      </button>
                      <button
                        type="button"
                        className={`date-segment-btn ${dateMode === "custom" ? "active" : ""}`}
                        onClick={() => setDateMode("custom")}
                      >
                        Custom Date
                      </button>
                    </div>

                    {dateMode === "custom" && (
                      <div className="custom-date-picker-container" style={{ marginTop: 12 }}>
                        <input
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              if (e.target.showPicker) e.target.showPicker();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{ width: "100%" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Collapsible toggle for advanced inputs */}
                  <div className="advanced-options-toggle">
                    <button
                      type="button"
                      className="toggle-collapse-btn"
                      onClick={() => setAdvancedQuickAdd(!advancedQuickAdd)}
                    >
                      {advancedQuickAdd ? "Hide Description" : "Add Description"}
                    </button>
                  </div>

                  {advancedQuickAdd && (
                    <div className="advanced-fields-box">
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Description / Title</label>
                        <input
                          type="text"
                          placeholder={`Defaults to "${expenseCategory || 'Category'} Expense"`}
                          value={expenseTitle}
                          onChange={(e) => setExpenseTitle(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleQuickAddSave}
                    style={{ marginTop: 8 }}
                  >
                    Save Transaction
                  </button>

                </div>

              </div>
            </div>
          )}

        </div>

      )}

      {currentPage === "logout" && (

        <div className="auth-page-wrapper">

          <div className="glass-card">

            <h1>Logged Out</h1>

            <p className="subtitle">
              You have been safely signed out.
            </p>

            <button
              onClick={() =>
                setCurrentPage(
                  "login"
                )
              }
            >
              Login Again
            </button>

          </div>

        </div>

      )}

    </div>

  )

}

export default App
