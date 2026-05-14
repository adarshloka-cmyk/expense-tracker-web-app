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

function App() {

  const [currentPage, setCurrentPage] = useState("login")

  const [darkMode, setDarkMode] = useState(true)

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

  async function fetchExpenses() {

    const q = query(

      collection(db, "expenses"),

      where(
        "uid",
        "==",
        auth.currentUser.uid
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

    await setDoc(

      doc(
        db,
        "budgets",
        auth.currentUser.uid
      ),

      {

        amount: budget,

        type: budgetType

      }

    )

    alert("Budget Saved")

  }

  async function fetchBudget() {

    const budgetRef = doc(

      db,
      "budgets",
      auth.currentUser.uid

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

          uid: auth.currentUser.uid

        }

      )

    }

    setExpenseTitle("")
    setExpenseAmount("")
    setExpenseCategory("")
    setExpenseDate("")

    fetchExpenses()

  }

  async function handleDeleteExpense(id) {

    await deleteDoc(
      doc(db, "expenses", id)
    )

    fetchExpenses()

  }

  function handleEditExpense(expense) {

    setExpenseTitle(expense.title)

    setExpenseAmount(expense.amount)

    setExpenseCategory(expense.category)

    setExpenseDate(expense.date)

    setEditingId(expense.id)

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
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4"
  ]

  useEffect(() => {

    document.body.className =
      darkMode
      ? "dark"
      : "light"

  }, [darkMode])

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        (user) => {

          if (user) {

            setCurrentPage(
              "dashboard"
            )

            fetchExpenses()

            fetchBudget()

          }

          else {

            setCurrentPage(
              "login"
            )

          }

        }

      )

    return () => unsubscribe()

  }, [])

  return (

    <div className="app">

      {currentPage === "login" && (

        <div className="glass-card">

          <h1>Expense Tracker</h1>

          <p className="subtitle">
            Smart Finance Manager
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button
            onClick={handleLogin}
          >
            Login
          </button>

          <p className="switch-text">

            No account?

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

      )}

      {currentPage === "signup" && (

        <div className="glass-card">

          <h1>Create Account</h1>

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button
            onClick={handleSignup}
          >
            Create Account
          </button>

        </div>

      )}

      {currentPage === "dashboard" && (

        <div className="dashboard-container">

          <div className="top-bar">

            <div>

              <h1>
                Expense Tracker 👋
              </h1>

              <p className="subtitle">
                Track Your Spending
              </p>

            </div>

            <div className="top-buttons">

              <button
                onClick={() =>
                  setDarkMode(
                    !darkMode
                  )
                }
              >
                {
                  darkMode
                  ? "Light Mode"
                  : "Dark Mode"
                }
              </button>

              <button
                onClick={exportPDF}
              >
                Export PDF
              </button>

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          </div>

          <div className="budget-box">

            <input
              type="number"
              placeholder="Set Budget"
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

            <button
              onClick={saveBudget}
            >
              Save Budget
            </button>

          </div>

          <div className="stats-grid">

            <div className="stat-card">

              <h2>
                Rs{totalSpent}
              </h2>

              <p>Total Expenses</p>

            </div>

            <div className="stat-card">

              <h2>
                Rs{budgetLeft}
              </h2>

              <p>Budget Left</p>

            </div>

            <div className="stat-card">

              <h2>
                Rs{monthlySpent}
              </h2>

              <p>This Month</p>

            </div>

            <div className="stat-card">

              <h2>
                {latestExpense}
              </h2>

              <p>Latest Expense</p>

            </div>

          </div>

          <div className="expense-form">

            <input
              type="text"
              placeholder="Expense Title"
              value={expenseTitle}
              onChange={(e) =>
                setExpenseTitle(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) =>
                setExpenseAmount(
                  e.target.value
                )
              }
            />

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

            <input
              type="date"
              value={expenseDate}
              onChange={(e) =>
                setExpenseDate(
                  e.target.value
                )
              }
            />

            <button
              onClick={
                handleAddExpense
              }
            >

              {
                editingId
                ? "Update Expense"
                : "Add Expense"
              }

            </button>

          </div>

          <div className="filters-row">

            <input
              type="text"
              placeholder="Search Expenses"
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
              onClick={() =>
                setShowChart(
                  !showChart
                )
              }
            >

              {
                showChart
                ? "Hide Chart"
                : "Show Chart"
              }

            </button>

          </div>

          {showChart && (

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
                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

          <div className="expenses-section">

            <h2 className="expense-heading">
              Recent Expenses
            </h2>

            {

              filteredExpenses.map(
                (expense) => (

                  <div
                    className="expense-card"
                    key={expense.id}
                  >

                    <div>

                      <h3>
                        {
                          expense.title
                        }
                      </h3>

                      <p>
                        {
                          expense.category
                        }
                      </p>

                      <small>
                        {
                          expense.date
                        }
                      </small>

                    </div>

                    <div className="expense-right">

                      <h2>
                        Rs
                    
                        {
                          expense.amount
                        }
                      </h2>

                      <div className="expense-actions">

                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEditExpense(
                              expense
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDeleteExpense(
                              expense.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )

            }

          </div>

        </div>

      )}

      {currentPage === "logout" && (

        <div className="glass-card">

          <h1>
            Logged Out
          </h1>

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

      )}

    </div>

  )

}

export default App

