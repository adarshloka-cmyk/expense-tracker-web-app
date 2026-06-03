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
  getDoc
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

function App() {

  const [currentPage, setCurrentPage] = useState("login")

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("expense_tracker_dark_mode");
    return saved !== null ? JSON.parse(saved) : true;
  })

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const [budget, setBudget] = useState("")
  const [budgetType, setBudgetType] = useState("Monthly")

  const [expenseTitle, setExpenseTitle] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("")
  const [expenseDate, setExpenseDate] = useState("")

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

          uid: activeUid

        }

      )

    }

    setExpenseTitle("")
    setExpenseAmount("")
    setExpenseCategory("")
    setExpenseDate("")

    fetchExpenses(activeUid)

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

    setEditingId(expense.id)

    // Automatically transition to Transactions Tab for editing
    setActiveTab("transactions")

  }

  function exportPDF() {

    const pdf = new jsPDF()

    pdf.setFont("helvetica")

    pdf.setFontSize(24)

    pdf.text(
      "Expense Tracker Report",
      20,
      20
    )

    pdf.setFontSize(14)

    pdf.text(
      `Budget: Rs${budget}`,
      20,
      40
    )

    pdf.text(
      `Total Spent: Rs${totalSpent}`,
      20,
      50
    )

    pdf.text(
      `Remaining Budget: Rs${budgetLeft}`,
      20,
      60
    )

    pdf.text(
      `Budget Type: ${budgetType}`,
      20,
      70
    )

    pdf.setFontSize(18)

    pdf.text(
      "Expense Details",
      20,
      90
    )

    let y = 105

    filteredExpenses.forEach(
      (expense, index) => {

        pdf.setFontSize(13)

        pdf.text(

          `${index + 1}. ${expense.title}`,

          20,

          y

        )

        pdf.text(

          `Category: ${expense.category}`,

          80,

          y

        )

        pdf.text(

          `Rs${expense.amount}`,

          150,

          y

        )

        y += 10

        pdf.text(

          `Date: ${expense.date}`,

          25,

          y

        )

        y += 15

        if (y > 270) {

          pdf.addPage()

          y = 20

        }

      }
    )

    pdf.save(
      "Expense_Report.pdf"
    )

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
              if (prev === "signup" || prev === "logout") {
                return prev;
              }
              return "login";
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

      {currentPage === "login" && (

        <div className="auth-page-wrapper">

          <div className="glass-card">

            <h1>Expense Tracker</h1>

            <p className="subtitle">
              Smart Finance Manager
            </p>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              onClick={handleLogin}
            >
              Sign In
            </button>

            <p className="switch-text">

              New here?

              <span
                onClick={() =>
                  setCurrentPage(
                    "signup"
                  )
                }
              >
                Sign Up
              </span>

            </p>

          </div>

        </div>

      )}

      {currentPage === "signup" && (

        <div className="auth-page-wrapper">

          <div className="glass-card">

            <h1>Create Account</h1>

            <p className="subtitle">
              Manage your wealth intelligently
            </p>

            <div className="input-group">
              <label className="input-label">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              onClick={handleSignup}
            >
              Create Account
            </button>

            <p className="switch-text">

              Already have an account?

              <span
                onClick={() =>
                  setCurrentPage(
                    "login"
                  )
                }
              >
                Sign In
              </span>

            </p>

          </div>

        </div>

      )}

      {currentPage === "dashboard" && (

        <div className="dashboard-shell">

          {/* COLLAPSIBLE SIDEBAR */}
          <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>

            <div className="sidebar-header">

              <div className="logo-wrapper">

                <div className="logo-icon">E</div>

                <span className="logo-text">Expense Tracker</span>

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

          </nav>

          {/* MAIN CONTAINER PAGE */}
          <main className="main-content">

            {/* SHARED HEADER */}
            <header className="top-header">

              <div className="header-title-section">

                <h1>Expense Tracker 👋</h1>

                <p>Keep track of your transactions and budget</p>

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

                  {/* PREMIUM HERO SECTION */}
                  <div className="premium-hero-card">

                    <div className="hero-left">

                      <p className="hero-subtitle">{budgetType} Balance Status</p>

                      <h2 className="hero-title">Rs{budgetLeft}</h2>

                      <div className="hero-budget-progress">

                        <div className="progress-info">

                          <span>Spent: Rs{totalSpent}</span>

                          <span>Limit: Rs{budget || 0}</span>

                        </div>

                        <div className="progress-track">

                          <div
                            className={`progress-bar ${
                              (budget > 0 ? (totalSpent / budget) * 100 : 0) > 100
                                ? "danger"
                                : (budget > 0 ? (totalSpent / budget) * 100 : 0) > 80
                                  ? "warning"
                                  : ""
                            }`}
                            style={{ width: `${Math.min(budget > 0 ? (totalSpent / budget) * 100 : 0, 100)}%` }}
                          ></div>

                        </div>

                      </div>

                    </div>

                    <div className="hero-right">

                      <span className="budget-pill">{budgetType} Cycle Active</span>

                    </div>

                  </div>

                  {/* MODERN KPI CARDS */}
                  <div className="stats-grid">

                    <div className="stat-card">

                      <div className="stat-card-header">

                        <span className="stat-trend negative">Total Debit</span>

                        <div className="stat-card-icon red">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </div>

                      </div>

                      <p>Total Expenses</p>

                      <h2>Rs{totalSpent}</h2>

                    </div>

                    <div className="stat-card">

                      <div className="stat-card-header">

                        <span className={`stat-trend ${budgetLeft >= 0 ? "positive" : "negative"}`}>
                          {budgetLeft >= 0 ? "Within Budget" : "Over Budget"}
                        </span>

                        <div className={`stat-card-icon ${budgetLeft >= 0 ? "green" : "red"}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                          </svg>
                        </div>

                      </div>

                      <p>Budget Left</p>

                      <h2>Rs{budgetLeft}</h2>

                    </div>

                    <div className="stat-card">

                      <div className="stat-card-header">

                        <span className="stat-trend positive">Monthly Span</span>

                        <div className="stat-card-icon blue">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>

                      </div>

                      <p>This Month</p>

                      <h2>Rs{monthlySpent}</h2>

                    </div>

                    <div className="stat-card">

                      <div className="stat-card-header">

                        <span className="stat-trend positive">Latest activity</span>

                        <div className="stat-card-icon purple">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20V10M18 20V4M6 20v-4" />
                          </svg>
                        </div>

                      </div>

                      <p>Latest Expense</p>

                      <h2 style={{ fontSize: latestExpense.length > 12 ? "1.45rem" : "1.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {latestExpense}
                      </h2>

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
                                  <div className="category-icon-bg" style={{ backgroundColor: cat.bg }}>
                                    {cat.icon}
                                  </div>
                                  <div className="expense-meta-info">
                                    <h3>{expense.title}</h3>
                                    <div className="expense-meta-tags">
                                      <span className="category-badge" style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                                        {expense.category || "Other"}
                                      </span>
                                      <small>{expense.date}</small>
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
                      <div className="budget-box" style={{ marginBottom: 24, padding: 16, background: 'var(--input)', borderRadius: 16 }}>

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

                        <select
                          value={budgetType}
                          onChange={(e) =>
                            setBudgetType(
                              e.target.value
                            )
                          }
                        >
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>Yearly</option>
                        </select>

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
                                <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem', fontWeight: 600 }}>
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

                          <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) =>
                              setExpenseDate(
                                e.target.value
                              )
                            }
                          />

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
                              setExpenseDate("")
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

                            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />

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

                                <div className="category-icon-bg" style={{ backgroundColor: cat.bg }}>
                                  {cat.icon}
                                </div>

                                <div className="expense-meta-info">

                                  <h3>{expense.title}</h3>

                                  <div className="expense-meta-tags">
                                    <span className="category-badge" style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                                      {expense.category || "Other"}
                                    </span>
                                    <small>{expense.date}</small>
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

                            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />

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

                                <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.95rem', fontWeight: 700 }}>

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

                      <select
                        value={budgetType}
                        onChange={(e) =>
                          setBudgetType(
                            e.target.value
                          )
                        }
                      >

                        <option>
                          Weekly
                        </option>

                        <option>
                          Monthly
                        </option>

                        <option>
                          Yearly
                        </option>

                      </select>

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
