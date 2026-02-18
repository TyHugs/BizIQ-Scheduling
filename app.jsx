// ============================================================
// BizIQ Scheduling — All Components
// Single file to avoid Babel cross-script compilation issues
// ============================================================

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;
var Fragment = React.Fragment;

// ============================================================
// SHARED COMPONENTS
// ============================================================

function MonthNav(props) {
  var year = props.year;
  var month = props.month;
  var onChange = props.onChange;
  var theme = props.theme;

  var isLight = theme === "light";
  var isCurrent = year === CURRENT_YEAR && month === CURRENT_MONTH;
  var isPast = year < CURRENT_YEAR || (year === CURRENT_YEAR && month < CURRENT_MONTH);

  var goPrev = function() {
    var m = month - 1, y = year;
    if (m < 0) { m = 11; y--; }
    onChange(y, m);
  };
  var goNext = function() {
    var m = month + 1, y = year;
    if (m > 11) { m = 0; y++; }
    onChange(y, m);
  };

  var btnCls = "month-nav-btn" + (isLight ? "" : " dark");
  var dispCls = "month-nav-display" + (isLight ? "" : " dark");
  if (isCurrent) dispCls += " current";
  else if (isPast) dispCls += " past";
  else dispCls += " future";

  var subColor = isCurrent
    ? (isLight ? "#1A8754" : "#2EBD8E")
    : isPast
      ? (isLight ? "#8E99A8" : "#5A6B84")
      : (isLight ? "#3C7BD9" : "#00B2A9");

  return (
    <div className="month-nav">
      <button className={btnCls} onClick={goPrev}>‹</button>
      <div className={dispCls}>
        <div className={"month-nav-label" + (isLight ? "" : " dark")}>{MONTH_NAMES[month]} {year}</div>
        <div className="month-nav-sub" style={{ color: subColor }}>
          {isCurrent ? "Current Month" : isPast ? "Past" : "Future"}
        </div>
      </div>
      <button className={btnCls} onClick={goNext}>›</button>
      {!isCurrent && (
        <button
          className={"month-nav-today" + (isLight ? "" : " dark")}
          onClick={function() { onChange(CURRENT_YEAR, CURRENT_MONTH); }}>
          Today
        </button>
      )}
    </div>
  );
}

function Toast(props) {
  if (!props.message) return null;
  return <div className="toast">{props.message}</div>;
}

// ============================================================
// ADMIN GRID — schedule editing table
// ============================================================

function AdminGrid(props) {
  var facultyId = props.facultyId;
  var base = props.base;
  var sched = props.sched;
  var setSched = props.setSched;
  var isBase = props.isBase;
  var showToast = props.showToast;
  var monthLabel = props.monthLabel;
  var isPast = props.isPast;
  var isFuture = props.isFuture;

  var editCellState = useState(null);
  var editCell = editCellState[0];
  var setEditCell = editCellState[1];

  var bulkState = useState(false);
  var bulk = bulkState[0];
  var setBulk = bulkState[1];

  var bulkSelState = useState(new Set());
  var bulkSel = bulkSelState[0];
  var setBulkSel = bulkSelState[1];

  var bulkActState = useState("");
  var bulkAct = bulkActState[0];
  var setBulkAct = bulkActState[1];

  var bulkLocState = useState("UH/Taubman");
  var bulkLoc = bulkLocState[0];
  var setBulkLoc = bulkLocState[1];

  var bulkRsnState = useState("Vacation");
  var bulkRsn = bulkRsnState[0];
  var setBulkRsn = bulkRsnState[1];

  var baseData = (base && base[facultyId]) || {};
  var curData = (sched && sched[facultyId]) || {};

  var ck = function(w, d) { return w + "|" + d; };

  var update = function(w, d, field, val) {
    setSched(function(prev) {
      var facData = Object.assign({}, prev[facultyId]);
      if (!facData[w]) facData[w] = {};
      var old = facData[w][d] || {};
      var up = Object.assign({}, old);
      up[field] = val;
      if (!isBase) {
        var be = baseData[w] && baseData[w][d];
        up.isOverride = !!(be && (up.activity !== be.activity || up.location !== be.location));
      }
      facData[w][d] = up;
      var result = Object.assign({}, prev);
      result[facultyId] = facData;
      return result;
    });
  };

  var resetToBase = function(w, d) {
    var be = baseData[w] && baseData[w][d];
    if (!be) return;
    setSched(function(prev) {
      var facData = Object.assign({}, prev[facultyId]);
      if (!facData[w]) facData[w] = {};
      facData[w][d] = Object.assign({}, be, { isOverride: false });
      var result = Object.assign({}, prev);
      result[facultyId] = facData;
      return result;
    });
    setEditCell(null);
    showToast("Reset to base schedule");
  };

  var applyBulk = function() {
    if (!bulkAct || bulkSel.size === 0) return;
    setSched(function(prev) {
      var facData = Object.assign({}, prev[facultyId]);
      bulkSel.forEach(function(k) {
        var parts = k.split("|");
        var wk = Number(parts[0]);
        var dy = parts[1];
        if (!facData[wk]) facData[wk] = {};
        var loc = bulkAct === "TIME_AWAY" ? "N/A" : bulkLoc;
        var be = baseData[wk] && baseData[wk][dy];
        var isOv = !isBase && !!(be && (be.activity !== bulkAct || be.location !== loc));
        var entry = { activity: bulkAct, location: loc, period: "Full Day", notes: "", isOverride: isBase ? false : isOv };
        if (bulkAct === "TIME_AWAY") entry.reason = bulkRsn;
        facData[wk][dy] = entry;
      });
      var result = Object.assign({}, prev);
      result[facultyId] = facData;
      return result;
    });
    showToast("Applied " + getActivity(bulkAct).label + " to " + bulkSel.size + " cells");
    setBulkSel(new Set());
    setBulk(false);
    setBulkAct("");
  };

  var ovCount = 0;
  if (!isBase) {
    WEEKS.forEach(function(w) { DAYS.forEach(function(d) {
      if (curData[w] && curData[w][d] && curData[w][d].isOverride) ovCount++;
    }); });
  }

  var modeBarCls = "mode-bar";
  if (isBase) modeBarCls += " base";
  else if (isPast) modeBarCls += " past";
  else if (isFuture) modeBarCls += " future";
  else modeBarCls += " current";

  return (
    <div>
      <div className={modeBarCls}>
        <span className="mode-label">
          {isBase ? "📐 Base Template" : "📅 " + monthLabel}
        </span>
        {isPast && !isBase && <span className="mode-badge past">Past Month</span>}
        {isFuture && !isBase && <span className="mode-badge future">Future Month</span>}
        {!isBase && ovCount > 0 && (
          <span style={{ fontSize: "11px", color: "#D96C2C", fontWeight: 500 }}>
            {ovCount} change{ovCount > 1 ? "s" : ""} from base
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <button className={"bulk-toggle" + (bulk ? " active" : "")}
            onClick={function() { setBulk(!bulk); setBulkSel(new Set()); }}>
            {bulk ? "✓ Selecting" : "Multi-Select"}
          </button>
        </div>
      </div>

      {bulk && bulkSel.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{bulkSel.size} selected</span>
          <select className="bulk-select" value={bulkAct} onChange={function(e) { setBulkAct(e.target.value); }}>
            <option value="">Choose activity...</option>
            {ACTIVITY_TYPES.filter(function(a) { return a.id !== "NONE"; }).map(function(a) {
              return <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>;
            })}
          </select>
          {bulkAct && bulkAct !== "TIME_AWAY" && (
            <select className="bulk-select" value={bulkLoc} onChange={function(e) { setBulkLoc(e.target.value); }}>
              {LOCATIONS.filter(function(l) { return l !== "N/A"; }).map(function(l) {
                return <option key={l} value={l}>{l}</option>;
              })}
            </select>
          )}
          {bulkAct === "TIME_AWAY" && (
            <select className="bulk-select" value={bulkRsn} onChange={function(e) { setBulkRsn(e.target.value); }}>
              {AWAY_REASONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
            </select>
          )}
          <button className="bulk-apply" disabled={!bulkAct} onClick={applyBulk}>Apply</button>
          <button className="bulk-cancel" onClick={function() { setBulkSel(new Set()); setBulk(false); }}>Cancel</button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="schedule-grid">
          <thead>
            <tr>
              <th>Wk</th>
              {DAYS.map(function(d, i) { return <th key={d}>{DAY_SHORT[i]}</th>; })}
            </tr>
          </thead>
          <tbody>
            {WEEKS.map(function(week) {
              return (
                <tr key={week}>
                  <td className="wk-label">{week}</td>
                  {DAYS.map(function(day) {
                    var entry = (curData[week] && curData[week][day]) || { activity: "NONE", location: "N/A", period: "Full Day", isOverride: false };
                    var baseE = baseData[week] && baseData[week][day];
                    var act = getActivity(entry.activity);
                    var baseAct = baseE ? getActivity(baseE.activity) : null;
                    var editing = editCell && editCell.w === week && editCell.d === day;
                    var isOv = !isBase && entry.isOverride;
                    var isBulkS = bulkSel.has(ck(week, day));
                    var bgCls = getCellBgClass(entry.activity, isOv, isBulkS);
                    var bdrCls = getCellBorderClass(editing, isBulkS, isOv);

                    return (
                      <td key={day}
                        className={"cell " + bgCls + " " + bdrCls}
                        onClick={function() {
                          if (bulk) {
                            var k = ck(week, day);
                            setBulkSel(function(prev) {
                              var n = new Set(prev);
                              if (n.has(k)) n.delete(k); else n.add(k);
                              return n;
                            });
                            return;
                          }
                          setEditCell(editing ? null : { w: week, d: day });
                        }}>
                        {isOv && !editing && <div className="cell-override-dot" />}
                        {bulk && (
                          <div className={"cell-bulk-check" + (isBulkS ? " checked" : "")}>
                            {isBulkS && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                          </div>
                        )}

                        {editing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }} onClick={function(e) { e.stopPropagation(); }}>
                            <select className="cell-edit-select" value={entry.activity}
                              onChange={function(e) { update(week, day, "activity", e.target.value); }}>
                              {ACTIVITY_TYPES.map(function(a) { return <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>; })}
                            </select>
                            {entry.activity !== "TIME_AWAY" && entry.activity !== "NONE" && (
                              <select className="cell-edit-select" value={entry.location}
                                onChange={function(e) { update(week, day, "location", e.target.value); }}>
                                {LOCATIONS.map(function(l) { return <option key={l} value={l}>{l}</option>; })}
                              </select>
                            )}
                            {entry.activity === "TIME_AWAY" && (
                              <select className="cell-edit-select" value={entry.reason || ""}
                                onChange={function(e) { update(week, day, "reason", e.target.value); }}>
                                <option value="">Reason...</option>
                                {AWAY_REASONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
                              </select>
                            )}
                            <select className="cell-edit-select" value={entry.period}
                              onChange={function(e) { update(week, day, "period", e.target.value); }}>
                              {["Full Day","AM","PM"].map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                            </select>
                            <input className="cell-edit-input" type="text" value={entry.notes || ""} placeholder="Notes (optional)"
                              onChange={function(e) { update(week, day, "notes", e.target.value); }} />
                            {!isBase && isOv && (
                              <button className="cell-reset-btn" onClick={function() { resetToBase(week, day); }}>↺ Reset to Base</button>
                            )}
                          </div>
                        ) : (
                          <div style={{ paddingLeft: bulk ? "16px" : "0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                              <span className="cell-emoji">{act.emoji}</span>
                              <span className="cell-activity" style={{ color: act.color }}>{act.label}</span>
                            </div>
                            {entry.location && entry.location !== "N/A" && <div className="cell-location">{entry.location}</div>}
                            {entry.activity === "TIME_AWAY" && entry.reason && <div className="cell-reason">{entry.reason}</div>}
                            {entry.period !== "Full Day" && <span className="cell-period">{entry.period}</span>}
                            {isOv && baseAct && (
                              <div className="cell-base-ref">Base: {baseAct.emoji} {baseAct.label}</div>
                            )}
                            {entry.notes && <div className="cell-notes">{entry.notes}</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="legend">
        {ACTIVITY_TYPES.filter(function(a) { return a.id !== "NONE"; }).map(function(a) {
          return (
            <div key={a.id} className="legend-item">
              <span className="legend-emoji">{a.emoji}</span>
              <span className="legend-label">{a.label}</span>
            </div>
          );
        })}
        {!isBase && (
          <div className="legend-item" style={{ marginLeft: "6px" }}>
            <div className="legend-override-dot" />
            <span style={{ fontSize: "10px", color: "#D96C2C" }}>Changed from base</span>
          </div>
        )}
      </div>

      <div className="instructions">
        <strong>How to use:</strong> Click any cell to edit. Use <em>Multi-Select</em> to change several at once.
        {isBase
          ? " Changes here update the permanent template — all future months inherit from this."
          : " Use the arrows to navigate months. Past months can be corrected. Future months can be pre-populated with known time away."}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PORTAL
// ============================================================

function AdminPortal(props) {
  var faculty = props.faculty;
  var baseSchedules = props.baseSchedules;
  var setBaseSchedules = props.setBaseSchedules;
  var allMonths = props.allMonths;
  var setAllMonths = props.setAllMonths;
  var onLogout = props.onLogout;

  var selIdState = useState(null);
  var selId = selIdState[0];
  var setSelId = selIdState[1];

  var viewModeState = useState("active");
  var viewMode = viewModeState[0];
  var setViewMode = viewModeState[1];

  var yrState = useState(CURRENT_YEAR);
  var yr = yrState[0];
  var setYr = yrState[1];

  var moState = useState(CURRENT_MONTH);
  var mo = moState[0];
  var setMo = moState[1];

  var searchState = useState("");
  var search = searchState[0];
  var setSearch = searchState[1];

  var toastState = useState(null);
  var toast = toastState[0];
  var setToast = toastState[1];

  var showToast = function(msg) { setToast(msg); setTimeout(function() { setToast(null); }, 2500); };
  var monthKey = makeMonthKey(yr, mo);

  useEffect(function() {
    if (!allMonths[monthKey]) {
      setAllMonths(function(prev) {
        var n = Object.assign({}, prev);
        n[monthKey] = generateMonthFromBase(baseSchedules, faculty, false);
        return n;
      });
    }
  }, [monthKey]);

  var activeSched = allMonths[monthKey] || {};
  var setActiveSched = function(updater) {
    setAllMonths(function(prev) {
      var cur = prev[monthKey] || {};
      var next = typeof updater === "function" ? updater(cur) : updater;
      var result = Object.assign({}, prev);
      result[monthKey] = next;
      return result;
    });
  };

  var filtered = faculty.filter(function(f) { return f.name.toLowerCase().indexOf(search.toLowerCase()) !== -1; });
  var selFac = faculty.find(function(f) { return f.id === selId; });

  var ovCounts = useMemo(function() {
    var c = {};
    faculty.forEach(function(f) {
      var n = 0;
      WEEKS.forEach(function(w) { DAYS.forEach(function(d) {
        if (activeSched[f.id] && activeSched[f.id][w] && activeSched[f.id][w][d] && activeSched[f.id][w][d].isOverride) n++;
      }); });
      c[f.id] = n;
    });
    return c;
  }, [faculty, activeSched]);

  var isPast = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && mo < CURRENT_MONTH);
  var isFuture = yr > CURRENT_YEAR || (yr === CURRENT_YEAR && mo > CURRENT_MONTH);

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="logo-mark admin">BIQ</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#00274C" }}>
              BizIQ <span style={{ color: "#3C7BD9" }}>Scheduling</span>
              <span style={{ fontWeight: 400, color: "#5A6A7E", fontSize: "12px", marginLeft: "8px" }}>Admin Portal</span>
            </div>
            <div style={{ fontSize: "10px", color: "#8E99A8" }}>Department of Urology · University of Michigan Health</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#8E99A8" }}>{faculty.length} faculty</span>
          <button className="btn-signout" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <Toast message={toast} />

      <div className="admin-body">
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Your Faculty</div>
            <input className="sidebar-search" type="text" value={search}
              onChange={function(e) { setSearch(e.target.value); }} placeholder="Search..." />
          </div>
          <div className="sidebar-list">
            {filtered.map(function(f) {
              var active = selId === f.id;
              var oc = ovCounts[f.id] || 0;
              return (
                <div key={f.id} className={"sidebar-item" + (active ? " active" : "")}
                  onClick={function() { setSelId(f.id); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="sidebar-item-name">{f.name}</div>
                      <div className="sidebar-item-meta">{f.division} · {f.fte} FTE</div>
                    </div>
                    {oc > 0 && <span className="sidebar-badge">{oc}Δ</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="main-content">
          {!selFac ? (
            <div className="empty-state">
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#5A6A7E" }}>Select a faculty member</div>
              <div style={{ fontSize: "13px", marginTop: "6px" }}>Choose someone from the sidebar to view and edit their schedule</div>
            </div>
          ) : (
            <div key={selFac.id + "-" + monthKey} className="main-content-inner">
              <div className="fac-header">
                <div>
                  <div className="fac-name">{selFac.name}</div>
                  <div className="fac-meta">
                    {selFac.title} · {selFac.division} · <span style={{ fontFamily: "var(--mono)", fontWeight: 500 }}>{selFac.fte} FTE</span>
                  </div>
                  <div className="fac-pills">
                    {[
                      { l: "Clinical", p: selFac.clinicalPct, c: "#3C7BD9" },
                      { l: "Research", p: selFac.researchPct, c: "#1A8754" },
                      { l: "Education", p: selFac.educationPct, c: "#B45309" },
                      { l: "Admin", p: selFac.adminPct, c: "#6B7785" },
                    ].map(function(item) {
                      return <span key={item.l} className="fac-pill" style={{ color: item.c, background: item.c + "12" }}>{item.l} {item.p}%</span>;
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <MonthNav year={yr} month={mo} onChange={function(y, m) { setYr(y); setMo(m); }} theme="light" />
                  <div className="view-toggle">
                    <button className={"view-toggle-btn" + (viewMode === "active" ? " active" : "")}
                      onClick={function() { setViewMode("active"); }}>Monthly Schedule</button>
                    <button className={"view-toggle-btn" + (viewMode === "base" ? " active" : "")}
                      onClick={function() { setViewMode("base"); }}>Base Template</button>
                  </div>
                </div>
              </div>

              {viewMode === "active" ? (
                <AdminGrid
                  facultyId={selFac.id} base={baseSchedules} sched={activeSched}
                  setSched={setActiveSched} isBase={false} showToast={showToast}
                  monthLabel={MONTH_NAMES[mo] + " " + yr} isPast={isPast} isFuture={isFuture}
                />
              ) : (
                <AdminGrid
                  facultyId={selFac.id} base={baseSchedules} sched={baseSchedules}
                  setSched={setBaseSchedules} isBase={true} showToast={showToast}
                  monthLabel="Base Template" isPast={false} isFuture={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LEADERSHIP DASHBOARD
// ============================================================

function LeadDashboard(props) {
  var faculty = props.faculty;
  var allMonths = props.allMonths;
  var baseSchedules = props.baseSchedules;
  var onLogout = props.onLogout;

  var yrState = useState(CURRENT_YEAR);
  var yr = yrState[0];
  var setYr = yrState[1];

  var moState = useState(CURRENT_MONTH);
  var mo = moState[0];
  var setMo = moState[1];

  var filterDivState = useState("");
  var filterDiv = filterDivState[0];
  var setFilterDiv = filterDivState[1];

  var sortByState = useState("variance");
  var sortBy = sortByState[0];
  var setSortBy = sortByState[1];

  var selIdState = useState(null);
  var selId = selIdState[0];
  var setSelId = selIdState[1];

  var monthKey = makeMonthKey(yr, mo);
  var activeSched = allMonths[monthKey] || {};

  var rows = useMemo(function() {
    return faculty.map(function(f) {
      var m = calculateMetrics(f, activeSched[f.id]);
      return Object.assign({}, f, { m: m });
    });
  }, [faculty, activeSched]);

  var filtered = rows
    .filter(function(f) { return !filterDiv || f.division === filterDiv; })
    .sort(function(a, b) {
      if (sortBy === "variance") return Math.abs(b.m.variance) - Math.abs(a.m.variance);
      if (sortBy === "timeAway") return b.m.awayPct - a.m.awayPct;
      if (sortBy === "utilization") return a.m.utilization - b.m.utilization;
      if (sortBy === "overrides") return b.m.overrides - a.m.overrides;
      return a.name.localeCompare(b.name);
    });

  var avgV = filtered.length ? filtered.reduce(function(s, f) { return s + f.m.variance; }, 0) / filtered.length : 0;
  var avgU = filtered.length ? filtered.reduce(function(s, f) { return s + f.m.utilization; }, 0) / filtered.length : 0;
  var avgA = filtered.length ? filtered.reduce(function(s, f) { return s + f.m.awayPct; }, 0) / filtered.length : 0;
  var onTgt = filtered.filter(function(f) { return Math.abs(f.m.variance) <= 5; }).length;
  var totOv = filtered.reduce(function(s, f) { return s + f.m.overrides; }, 0);
  var detail = selId ? rows.find(function(f) { return f.id === selId; }) : null;

  var kpis = [
    { l: "Faculty", v: filtered.length, c: "#FFCB05" },
    { l: "Avg Variance", v: (avgV >= 0 ? "+" : "") + avgV.toFixed(1) + "%", c: Math.abs(avgV) <= 5 ? "#2EBD8E" : "#F59E0B" },
    { l: "Utilization", v: avgU.toFixed(0) + "%", c: "#00B2A9" },
    { l: "Avg Away", v: avgA.toFixed(1) + "%", c: "#E5534B" },
    { l: "On Target", v: onTgt, c: "#2EBD8E", s: "±5%" },
    { l: "Overrides", v: totOv, c: "#FF8C42", s: "this month" },
  ];

  return (
    <div className="lead-wrap dark-theme">
      <header className="lead-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="logo-mark lead">BIQ</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFCB05" }}>
              BizIQ <span style={{ color: "#00B2A9" }}>Scheduling</span>
              <span style={{ fontWeight: 400, color: "#8B9BB4", fontSize: "12px", marginLeft: "8px" }}>Leadership</span>
            </div>
            <div style={{ fontSize: "10px", color: "#5A6B84" }}>Faculty Effort Intelligence · Dept of Urology</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <MonthNav year={yr} month={mo} onChange={function(y, m) { setYr(y); setMo(m); }} theme="dark" />
          <button className="btn-signout dark" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <main className="lead-main">
        <div className="kpi-grid">
          {kpis.map(function(k, i) {
            return (
              <div key={i} className="kpi-card">
                <div className="kpi-value" style={{ color: k.c }}>{k.v}</div>
                <div className="kpi-label">{k.l}</div>
                {k.s && <div className="kpi-sub">{k.s}</div>}
              </div>
            );
          })}
        </div>

        <div className="lead-filters">
          <select className="lead-select" value={filterDiv} onChange={function(e) { setFilterDiv(e.target.value); }}>
            <option value="">All Divisions</option>
            {DIVISIONS.map(function(d) { return <option key={d} value={d}>{d}</option>; })}
          </select>
          <select className="lead-select" value={sortBy} onChange={function(e) { setSortBy(e.target.value); }}>
            {[
              { v: "variance", l: "Variance" }, { v: "timeAway", l: "Time Away" },
              { v: "utilization", l: "Utilization" }, { v: "overrides", l: "Overrides" }, { v: "name", l: "Name" },
            ].map(function(o) { return <option key={o.v} value={o.v}>Sort: {o.l}</option>; })}
          </select>
        </div>

        <div className={"lead-grid" + (detail ? " with-detail" : "")}>
          <div>
            <div className="roster-header">
              <div>Faculty</div>
              <div style={{ textAlign: "center" }}>Clinical</div>
              <div style={{ textAlign: "center" }}>Variance</div>
              <div style={{ textAlign: "center" }}>Util</div>
              <div style={{ textAlign: "center" }}>Away</div>
              <div style={{ textAlign: "center" }}>Δ</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {filtered.map(function(f) {
                var vc = Math.abs(f.m.variance) <= 5 ? "#2EBD8E" : f.m.variance > 0 ? "#F59E0B" : "#E5534B";
                return (
                  <div key={f.id}
                    className={"roster-row" + (selId === f.id ? " selected" : "")}
                    onClick={function() { setSelId(selId === f.id ? null : f.id); }}>
                    <div>
                      <div className="roster-name">{f.name}</div>
                      <div className="roster-meta">{f.division} · {f.fte} FTE</div>
                    </div>
                    <div className="roster-val" style={{ color: "#00B2A9" }}>{f.m.actualPct.toFixed(0)}%</div>
                    <div className="roster-val" style={{ color: vc }}>{f.m.variance >= 0 ? "+" : ""}{f.m.variance.toFixed(1)}%</div>
                    <div className="roster-val" style={{ color: "#E8ECF1" }}>{f.m.utilization.toFixed(0)}%</div>
                    <div className="roster-val" style={{ color: f.m.away > 2 ? "#E5534B" : "#8B9BB4" }}>{f.m.away}d</div>
                    <div style={{ textAlign: "center" }}>
                      {f.m.overrides > 0
                        ? <span className="ov-badge">{f.m.overrides}</span>
                        : <span style={{ color: "#5A6B84" }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {detail && (
            <div className="detail-panel">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <div className="detail-name">{detail.name}</div>
                  <div className="detail-meta">{detail.title} · {detail.division}</div>
                </div>
                <button className="detail-close" onClick={function() { setSelId(null); }}>✕</button>
              </div>

              {[
                { l: "Clinical", e: detail.clinicalPct, a: detail.m.actualPct, c: "#4A90D9" },
                { l: "Research", e: detail.researchPct, a: detail.m.active > 0 ? (detail.m.counts.RESEARCH / detail.m.active) * 100 : 0, c: "#2EBD8E" },
                { l: "Education", e: detail.educationPct, a: detail.m.active > 0 ? (detail.m.counts.EDUCATION / detail.m.active) * 100 : 0, c: "#E5A832" },
                { l: "Admin", e: detail.adminPct, a: detail.m.active > 0 ? (detail.m.counts.ADMIN / detail.m.active) * 100 : 0, c: "#6E7C91" },
              ].map(function(item) {
                return (
                  <div key={item.l} style={{ marginBottom: "7px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                      <span className="effort-label" style={{ color: item.c }}>{item.l}</span>
                      <span className="effort-val">{item.a.toFixed(0)}% / {item.e}%</span>
                    </div>
                    <div className="effort-bg">
                      <div className="effort-expected" style={{ width: Math.min(item.e, 100) + "%", background: item.c }} />
                      <div className="effort-actual" style={{ width: Math.min(item.a, 100) + "%", background: item.c }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "9px", color: "#5A6B84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Schedule</div>
                <div className="heatmap">
                  <div />
                  {DAY_SHORT.map(function(d) { return <div key={d} className="heatmap-label">{d[0]}</div>; })}
                  {WEEKS.map(function(w) {
                    return (
                      <Fragment key={w}>
                        <div className="heatmap-label" style={{ lineHeight: "13px" }}>{w}</div>
                        {DAYS.map(function(d) {
                          var e = activeSched[detail.id] && activeSched[detail.id][w] && activeSched[detail.id][w][d];
                          var a = getActivity(e ? e.activity : "NONE");
                          var borderCol = (e && e.isOverride) ? "rgba(255,140,66,0.33)" : a.colorDark + "22";
                          return (
                            <div key={w + "-" + d} className="heatmap-cell"
                              style={{ background: a.colorDark + "44", border: "1px solid " + borderCol }}
                              title={"W" + w + " " + d + ": " + a.label} />
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================

function LoginScreen(props) {
  var onAuth = props.onAuth;

  var codeState = useState("");
  var code = codeState[0];
  var setCode = codeState[1];

  var errState = useState(false);
  var err = errState[0];
  var setErr = errState[1];

  var go = function() {
    if (code === "admin") onAuth("admin");
    else if (code === "lead" || code === "2026") onAuth("lead");
    else { setErr(true); setTimeout(function() { setErr(false); }, 2000); }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">BIQ</div>
        <div className="login-title">BizIQ Scheduling</div>
        <div className="login-sub">Faculty Effort & Activity Intelligence · University of Michigan</div>
        <div className="login-card">
          <div style={{ fontSize: "12px", color: "#8BA4C4", marginBottom: "12px", textAlign: "left", fontWeight: 500 }}>
            Access Code
          </div>
          <input
            className={"login-input" + (err ? " error" : "")}
            type="password" value={code} placeholder="Enter your code"
            onChange={function(e) { setCode(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") go(); }}
            autoFocus={true}
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

// ============================================================
// APP ROOT
// ============================================================

function App() {
  // Use shared initializer so base and months reference the same data
  var initState = useState(function() { return initializeAppState(); });
  var appInit = initState[0];

  var roleState = useState(null);
  var role = roleState[0];
  var setRole = roleState[1];

  var facultyState = useState(SEED_FACULTY);
  var faculty = facultyState[0];

  var baseState = useState(appInit.base);
  var baseSchedules = baseState[0];
  var setBaseSchedules = baseState[1];

  var monthsState = useState(appInit.months);
  var allMonths = monthsState[0];
  var setAllMonths = monthsState[1];

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

// Mount the app
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
