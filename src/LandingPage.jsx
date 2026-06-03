import { useState } from 'react'
import './LandingPage.css'

export default function LandingPage({ onSignIn, onSignUp }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="landing-page-container">
      {/* HEADER SECTION */}
      <header className="landing-header">
        <div className="landing-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
            <path d="M12 2L2 22l10-4 10 4L12 2z" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="2 2"/>
            <path d="M12 18V9" stroke="var(--primary)" strokeWidth="2"/>
            <path d="M8 18v-4" stroke="var(--accent-blue)" strokeWidth="2"/>
            <path d="M16 18v-7" stroke="var(--accent-gold)" strokeWidth="2"/>
          </svg>
          <span className="logo-text">TrackWise</span>
        </div>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#why-us">Why TrackWise</a>
        </nav>
        <div className="landing-auth-buttons">
          <button className="btn-ghost" onClick={onSignIn}>Sign In</button>
          <button className="btn-primary-glow" onClick={onSignUp}>Get Started</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="badge-tag">Track smarter. Spend wiser.</div>
          <h1 className="hero-title">
            Take control of <br />
            every rupee.
          </h1>
          <p className="hero-subtitle">
            Track expenses, understand spending habits, and generate professional financial reports from a single intelligent dashboard.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary-large" onClick={onSignUp}>Get Started</button>
            <a href="#simulator" className="btn-secondary-large">Explore Features</a>
          </div>
        </div>

        {/* HERO INTERACTIVE MOCKUP */}
        <div id="simulator" className="hero-simulator-container">
          <div className="simulator-header">
            <h3>Interactive Dashboard Preview</h3>
            <div className="simulator-tabs">
              <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>Analytics</button>
              <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Reports</button>
              <button className={activeTab === 'budgeting' ? 'active' : ''} onClick={() => setActiveTab('budgeting')}>Budgeting</button>
            </div>
          </div>

          <div className="simulator-viewport">
            {/* OVERVIEW PREVIEW */}
            {activeTab === 'overview' && (
              <div className="preview-screen fade-in">
                <div className="mock-overview-header">
                  <div className="mock-balance-block">
                    <span className="mock-label">Monthly Net Balance</span>
                    <h2 className="mock-value positive">Rs4,580</h2>
                  </div>
                  <span className="mock-badge">Active Cycle</span>
                </div>
                <div className="mock-progress-wrapper">
                  <div className="mock-progress-info">
                    <span>Spent: <strong>Rs5,420</strong></span>
                    <span>Limit: <strong>Rs10,000</strong></span>
                  </div>
                  <div className="mock-progress-track">
                    <div className="mock-progress-bar" style={{ width: '54%' }}></div>
                  </div>
                </div>
                <div className="mock-recent-txns">
                  <h4>Recent Ledger Activity</h4>
                  <div className="mock-txn-row">
                    <span className="mock-category-dot food">●</span>
                    <span className="mock-txn-title">Netflix Subscription</span>
                    <span className="mock-txn-amount">- Rs799</span>
                  </div>
                  <div className="mock-txn-row">
                    <span className="mock-category-dot travel">●</span>
                    <span className="mock-txn-title">Uber Ride</span>
                    <span className="mock-txn-amount">- Rs450</span>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS PREVIEW */}
            {activeTab === 'analytics' && (
              <div className="preview-screen fade-in">
                <div className="mock-analytics-grid">
                  <div className="mock-pie-box">
                    <svg viewBox="0 0 100 100" className="mock-pie-svg">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="12" strokeDasharray="90 161" strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="60 191" strokeDashoffset="-90" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="12" strokeDasharray="50 201" strokeDashoffset="-150" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f43f5e" strokeWidth="12" strokeDasharray="51 200" strokeDashoffset="-200" />
                    </svg>
                    <div className="pie-legend-center">
                      <span className="pie-pct">Rs5,420</span>
                      <span className="pie-label">Total Outflow</span>
                    </div>
                  </div>
                  <div className="mock-analytics-list">
                    <h4>Outflow Distribution</h4>
                    <div className="mock-bar-row">
                      <div className="mock-bar-label">
                        <span>Food</span>
                        <span>Rs2,100 (39%)</span>
                      </div>
                      <div className="mock-bar-track"><div className="mock-bar-fill food" style={{ width: '39%' }}></div></div>
                    </div>
                    <div className="mock-bar-row">
                      <div className="mock-bar-label">
                        <span>Travel</span>
                        <span>Rs1,450 (27%)</span>
                      </div>
                      <div className="mock-bar-track"><div className="mock-bar-fill travel" style={{ width: '27%' }}></div></div>
                    </div>
                    <div className="mock-bar-row">
                      <div className="mock-bar-label">
                        <span>Bills</span>
                        <span>Rs1,100 (20%)</span>
                      </div>
                      <div className="mock-bar-track"><div className="mock-bar-fill bills" style={{ width: '20%' }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS PREVIEW */}
            {activeTab === 'reports' && (
              <div className="preview-screen fade-in">
                <div className="mock-pdf-cover">
                  <div className="mock-pdf-stripe"></div>
                  <div className="mock-pdf-content">
                    <div className="mock-pdf-logo">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 32, height: 32 }}>
                        <path d="M12 2L2 22l10-4 10 4L12 2z" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="2 2"/>
                        <path d="M12 18V9" stroke="var(--primary)" strokeWidth="2"/>
                        <path d="M8 18v-4" stroke="var(--accent-blue)" strokeWidth="2"/>
                        <path d="M16 18v-7" stroke="var(--accent-gold)" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3>PERSONAL FINANCIAL REPORT</h3>
                    <p className="pdf-sub">TrackWise Statement Summary</p>
                    <div className="pdf-divider"></div>
                    <div className="pdf-meta-grid">
                      <div>
                        <span className="pdf-meta-label">PREPARED FOR:</span>
                        <span className="pdf-meta-value">client@trackwise.com</span>
                      </div>
                      <div>
                        <span className="pdf-meta-label">REPORT PERIOD:</span>
                        <span className="pdf-meta-value">Monthly Budget Cycle</span>
                      </div>
                      <div>
                        <span className="pdf-meta-label">GENERATED:</span>
                        <span className="pdf-meta-value">June 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BUDGETING PREVIEW */}
            {activeTab === 'budgeting' && (
              <div className="preview-screen fade-in">
                <div className="mock-budget-content">
                  <div className="mock-budget-header">
                    <h4>Flexible Cycle Budgeting</h4>
                    <p className="mock-subtext">Set your cycle threshold and see details adjust in real-time.</p>
                  </div>
                  <div className="mock-budget-slider-box">
                    <div className="slider-label-row">
                      <span>Threshold limit</span>
                      <strong className="glow-accent">Rs10,000</strong>
                    </div>
                    <div className="slider-track-demo">
                      <div className="slider-track-fill" style={{ width: '70%' }}></div>
                      <div className="slider-thumb-demo" style={{ left: '70%' }}></div>
                    </div>
                  </div>
                  <div className="mock-budget-kpis">
                    <div className="mock-mini-kpi">
                      <span>Utilization</span>
                      <strong className="positive">54%</strong>
                    </div>
                    <div className="mock-mini-kpi">
                      <span>Status</span>
                      <strong className="positive">Optimized Flow</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="landing-features">
        <h2 className="section-title text-center">Engineered for Modern Wealth</h2>
        <p className="section-subtitle text-center">Every tool you need to track, optimize, and report on your finances.</p>

        <div className="features-grid-tw">
          <div className="feature-grid-card">
            <div className="fg-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3>Expense Tracking</h3>
            <p>Quickly add, edit, or remove expenses as you make them. Keep a clean digital ledger of all your transactions in one place.</p>
          </div>

          <div className="feature-grid-card">
            <div className="fg-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>Budget Management</h3>
            <p>Set weekly, monthly, or yearly spending limits. Keep your spending in check and get clear warnings before you go over budget.</p>
          </div>

          <div className="feature-grid-card">
            <div className="fg-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3>Financial Analytics</h3>
            <p>See exactly where your money goes with automatically generated charts. Spot trends and find ways to save without the manual math.</p>
          </div>

          <div className="feature-grid-card">
            <div className="fg-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3>Professional PDF Reports</h3>
            <p>Export clean, easy-to-read PDF summaries of your finances. Perfect for sharing with accountants, business partners, or family.</p>
          </div>

          <div className="feature-grid-card">
            <div className="fg-icon cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>Secure Cloud Sync</h3>
            <p>Your data is private, secured, and synced automatically across your devices so you never lose your records.</p>
          </div>
        </div>
      </section>

      {/* WHY TRACKWISE SECTION */}
      <section id="why-us" className="landing-why">
        <h2 className="section-title text-center">Why TrackWise?</h2>
        <p className="section-subtitle text-center">Frictionless manual budgeting designed to guide smart financial decisions.</p>

        <div className="why-grid">
          <div className="why-column">
            <h4>01 / Simplicity</h4>
            <p>No complex bank integrations that break randomly. Enter your transactions manually in seconds and maintain clean, absolute control over your ledger.</p>
          </div>

          <div className="why-column">
            <h4>02 / Financial Clarity</h4>
            <p>Understand your financial overview immediately. Balance summaries and progress gauges shift colors dynamically (Emerald → Amber → Red) based on utilization.</p>
          </div>

          <div className="why-column">
            <h4>03 / Better Decisions</h4>
            <p>With real-time category concentration tracking and structured statements, you get full visibility into outflow patterns, helping you save more.</p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="landing-cta">
        <div className="cta-box">
          <h2>Start tracking smarter today.</h2>
          <p>Join professionals, freelancers, and students managing their wealth with maximum detail. Set up your ledger in seconds.</p>
          <button className="btn-primary-large glow-gold" onClick={onSignUp}>Get Started For Free</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-simple-content">
          <div className="footer-brand">TrackWise</div>
          <div className="footer-tagline">Track smarter. Spend wiser.</div>
          <div className="footer-links">
            <a href="mailto:adarsh.loka@gmail.com">Contact</a>
            <span className="dot-separator">|</span>
            <span 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              style={{ cursor: 'pointer' }}
            >
              Back to Top
            </span>
          </div>
          <div className="footer-copy">&copy; 2026 TrackWise</div>
          <div className="footer-author">Built by A.</div>
        </div>
      </footer>
    </div>
  )
}
