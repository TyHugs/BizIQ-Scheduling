// ============================================================
// UROTRACK — App Root
// ============================================================

function App() {
  const [role, setRole] = useState(null); // null | "admin" | "lead"
  const [faculty] = useState(SEED_FACULTY);
  const [baseSchedules, setBaseSchedules] = useState(function() { return generateBaseSchedules(SEED_FACULTY); });
  const [allMonths, setAllMonths] = useState(function() {
    var base = generateBaseSchedules(SEED_FACULTY);
    var cur = makeMonthKey(CURRENT_YEAR, CURRENT_MONTH);
    var prevM = CURRENT_MONTH - 1 < 0 ? 11 : CURRENT_MONTH - 1;
    var prevY = CURRENT_MONTH - 1 < 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
    var prev = makeMonthKey(prevY, prevM);
    var result = {};
    result[cur] = generateMonthFromBase(base, SEED_FACULTY, true);
    result[prev] = generateMonthFromBase(base, SEED_FACULTY, true);
    return result;
  });

  // Login screen
  if (!role) {
    return <LoginScreen onAuth={setRole} />;
  }

  if (role === "admin") {
    return (
      <AdminPortal
        faculty={faculty}
        baseSchedules={baseSchedules}
        setBaseSchedules={setBaseSchedules}
        allMonths={allMonths}
        setAllMonths={setAllMonths}
        onLogout={function() { setRole(null); }}
      />
    );
  }

  return (
    <LeadDashboard
      faculty={faculty}
      allMonths={allMonths}
      baseSchedules={baseSchedules}
      onLogout={function() { setRole(null); }}
    />
  );
}

function LoginScreen({ onAuth }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  const go = function() {
    if (code === "admin") onAuth("admin");
    else if (code === "lead" || code === "2026") onAuth("lead");
    else { setErr(true); setTimeout(function() { setErr(false); }, 2000); }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">U</div>
        <div className="login-title">UroTrack</div>
        <div className="login-sub">Faculty Effort & Activity Intelligence</div>
        <div className="login-card">
          <div style={{ fontSize: "12px", color: "#8BA4C4", marginBottom: "12px", textAlign: "left", fontWeight: 500 }}>
            Access Code
          </div>
          <input
            className={"login-input" + (err ? " error" : "")}
            type="password" value={code} placeholder="Enter your code"
            onChange={function(e) { setCode(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") go(); }}
            autoFocus
          />
          {err && <div style={{ fontSize: "12px", color: "#F87171", marginTop: "8px" }}>Invalid code</div>}
          <button className="login-btn" onClick={go}>Sign In</button>
        </div>
        <div className="login-hint">
          <code>admin</code> → Admin Portal&nbsp;&nbsp;·&nbsp;&nbsp;
          <code>lead</code> → Leadership Dashboard
        </div>
      </div>
    </div>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
