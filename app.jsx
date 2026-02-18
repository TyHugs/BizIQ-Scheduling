// ============================================================
// BizIQ Scheduling — All Components
// Single-page app with top nav: Schedule Management + Dashboard
// No login gate
// ============================================================

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;
var Fragment = React.Fragment;

// ---- SHARED COMPONENTS ----

function MonthNav(props) {
  var year = props.year, month = props.month, onChange = props.onChange, theme = props.theme;
  var isLight = theme === "light";
  var isCurrent = year === CURRENT_YEAR && month === CURRENT_MONTH;
  var isPast = year < CURRENT_YEAR || (year === CURRENT_YEAR && month < CURRENT_MONTH);
  var goPrev = function() { var m = month - 1, y = year; if (m < 0) { m = 11; y--; } onChange(y, m); };
  var goNext = function() { var m = month + 1, y = year; if (m > 11) { m = 0; y++; } onChange(y, m); };
  var btnCls = "month-nav-btn" + (isLight ? "" : " dark");
  var dispCls = "month-nav-display" + (isLight ? "" : " dark");
  if (isCurrent) dispCls += " current"; else if (isPast) dispCls += " past"; else dispCls += " future";
  var subColor = isCurrent ? (isLight ? "#1A8754" : "#2EBD8E") : isPast ? (isLight ? "#8E99A8" : "#5A6B84") : (isLight ? "#3C7BD9" : "#00B2A9");
  return (
    <div className="month-nav">
      <button className={btnCls} onClick={goPrev}>‹</button>
      <div className={dispCls}>
        <div className={"month-nav-label" + (isLight ? "" : " dark")}>{MONTH_NAMES[month]} {year}</div>
        <div className="month-nav-sub" style={{ color: subColor }}>{isCurrent ? "Current Month" : isPast ? "Past" : "Future"}</div>
      </div>
      <button className={btnCls} onClick={goNext}>›</button>
      {!isCurrent && <button className={"month-nav-today" + (isLight ? "" : " dark")} onClick={function() { onChange(CURRENT_YEAR, CURRENT_MONTH); }}>Today</button>}
    </div>
  );
}

function Toast(props) { if (!props.message) return null; return <div className="toast">{props.message}</div>; }

// ---- ADMIN GRID ----

function AdminGrid(props) {
  var facultyId = props.facultyId, base = props.base, sched = props.sched, setSched = props.setSched;
  var isBase = props.isBase, showToast = props.showToast, monthLabel = props.monthLabel;
  var isPast = props.isPast, isFuture = props.isFuture;
  var s1 = useState(null); var editCell = s1[0]; var setEditCell = s1[1];
  var s2 = useState(false); var bulk = s2[0]; var setBulk = s2[1];
  var s3 = useState(new Set()); var bulkSel = s3[0]; var setBulkSel = s3[1];
  var s4 = useState(""); var bulkAct = s4[0]; var setBulkAct = s4[1];
  var s5 = useState("UH/Taubman"); var bulkLoc = s5[0]; var setBulkLoc = s5[1];
  var s6 = useState("Vacation"); var bulkRsn = s6[0]; var setBulkRsn = s6[1];
  var baseData = (base && base[facultyId]) || {};
  var curData = (sched && sched[facultyId]) || {};
  var ck = function(w, d) { return w + "|" + d; };

  var update = function(w, d, field, val) {
    setSched(function(prev) {
      var fd = Object.assign({}, prev[facultyId]); if (!fd[w]) fd[w] = {};
      var up = Object.assign({}, fd[w][d] || {}); up[field] = val;
      if (!isBase) { var be = baseData[w] && baseData[w][d]; up.isOverride = !!(be && (up.activity !== be.activity || up.location !== be.location)); }
      fd[w][d] = up; var r = Object.assign({}, prev); r[facultyId] = fd; return r;
    });
  };
  var resetToBase = function(w, d) {
    var be = baseData[w] && baseData[w][d]; if (!be) return;
    setSched(function(prev) { var fd = Object.assign({}, prev[facultyId]); if (!fd[w]) fd[w] = {}; fd[w][d] = Object.assign({}, be, { isOverride: false }); var r = Object.assign({}, prev); r[facultyId] = fd; return r; });
    setEditCell(null); showToast("Reset to base schedule");
  };
  var applyBulk = function() {
    if (!bulkAct || bulkSel.size === 0) return;
    setSched(function(prev) {
      var fd = Object.assign({}, prev[facultyId]);
      bulkSel.forEach(function(k) { var p = k.split("|"); var wk = Number(p[0]); var dy = p[1]; if (!fd[wk]) fd[wk] = {};
        var loc = bulkAct === "TIME_AWAY" ? "N/A" : bulkLoc; var be = baseData[wk] && baseData[wk][dy];
        var isOv = !isBase && !!(be && (be.activity !== bulkAct || be.location !== loc));
        var e = { activity: bulkAct, location: loc, period: "Full Day", notes: "", isOverride: isBase ? false : isOv };
        if (bulkAct === "TIME_AWAY") e.reason = bulkRsn; fd[wk][dy] = e;
      });
      var r = Object.assign({}, prev); r[facultyId] = fd; return r;
    });
    showToast("Applied " + getActivity(bulkAct).label + " to " + bulkSel.size + " cells");
    setBulkSel(new Set()); setBulk(false); setBulkAct("");
  };

  var ovCount = 0;
  if (!isBase) { WEEKS.forEach(function(w) { DAYS.forEach(function(d) { if (curData[w] && curData[w][d] && curData[w][d].isOverride) ovCount++; }); }); }
  var mbc = "mode-bar"; if (isBase) mbc += " base"; else if (isPast) mbc += " past"; else if (isFuture) mbc += " future"; else mbc += " current";

  return (
    <div>
      <div className={mbc}>
        <span className="mode-label">{isBase ? "📐 Base Template" : "📅 " + monthLabel}</span>
        {isPast && !isBase && <span className="mode-badge past">Past Month</span>}
        {isFuture && !isBase && <span className="mode-badge future">Future Month</span>}
        {!isBase && ovCount > 0 && <span style={{ fontSize: "11px", color: "#D96C2C", fontWeight: 500 }}>{ovCount} change{ovCount > 1 ? "s" : ""} from base</span>}
        <div style={{ marginLeft: "auto" }}><button className={"bulk-toggle" + (bulk ? " active" : "")} onClick={function() { setBulk(!bulk); setBulkSel(new Set()); }}>{bulk ? "✓ Selecting" : "Multi-Select"}</button></div>
      </div>
      {bulk && bulkSel.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{bulkSel.size} selected</span>
          <select className="bulk-select" value={bulkAct} onChange={function(e) { setBulkAct(e.target.value); }}><option value="">Choose activity...</option>
            {ACTIVITY_TYPES.filter(function(a) { return a.id !== "NONE"; }).map(function(a) { return <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>; })}</select>
          {bulkAct && bulkAct !== "TIME_AWAY" && <select className="bulk-select" value={bulkLoc} onChange={function(e) { setBulkLoc(e.target.value); }}>{LOCATIONS.filter(function(l) { return l !== "N/A"; }).map(function(l) { return <option key={l} value={l}>{l}</option>; })}</select>}
          {bulkAct === "TIME_AWAY" && <select className="bulk-select" value={bulkRsn} onChange={function(e) { setBulkRsn(e.target.value); }}>{AWAY_REASONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}</select>}
          <button className="bulk-apply" disabled={!bulkAct} onClick={applyBulk}>Apply</button>
          <button className="bulk-cancel" onClick={function() { setBulkSel(new Set()); setBulk(false); }}>Cancel</button>
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="schedule-grid"><thead><tr><th>Wk</th>{DAYS.map(function(d, i) { return <th key={d}>{DAY_SHORT[i]}</th>; })}</tr></thead>
          <tbody>{WEEKS.map(function(week) { return (
            <tr key={week}><td className="wk-label">{week}</td>
              {DAYS.map(function(day) {
                var entry = (curData[week] && curData[week][day]) || { activity: "NONE", location: "N/A", period: "Full Day", isOverride: false };
                var baseE = baseData[week] && baseData[week][day]; var act = getActivity(entry.activity);
                var baseAct = baseE ? getActivity(baseE.activity) : null;
                var editing = editCell && editCell.w === week && editCell.d === day;
                var isOv = !isBase && entry.isOverride; var isBulkS = bulkSel.has(ck(week, day));
                var bgCls = getCellBgClass(entry.activity, isOv, isBulkS);
                var bdrCls = getCellBorderClass(editing, isBulkS, isOv);
                return (
                  <td key={day} className={"cell " + bgCls + " " + bdrCls} onClick={function() {
                    if (bulk) { var k = ck(week, day); setBulkSel(function(p) { var n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; }); return; }
                    setEditCell(editing ? null : { w: week, d: day });
                  }}>
                    {isOv && !editing && <div className="cell-override-dot" />}
                    {bulk && <div className={"cell-bulk-check" + (isBulkS ? " checked" : "")}>{isBulkS && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>✓</span>}</div>}
                    {editing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }} onClick={function(e) { e.stopPropagation(); }}>
                        <select className="cell-edit-select" value={entry.activity} onChange={function(e) { update(week, day, "activity", e.target.value); }}>{ACTIVITY_TYPES.map(function(a) { return <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>; })}</select>
                        {entry.activity !== "TIME_AWAY" && entry.activity !== "NONE" && <select className="cell-edit-select" value={entry.location} onChange={function(e) { update(week, day, "location", e.target.value); }}>{LOCATIONS.map(function(l) { return <option key={l} value={l}>{l}</option>; })}</select>}
                        {entry.activity === "TIME_AWAY" && <select className="cell-edit-select" value={entry.reason || ""} onChange={function(e) { update(week, day, "reason", e.target.value); }}><option value="">Reason...</option>{AWAY_REASONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}</select>}
                        <select className="cell-edit-select" value={entry.period} onChange={function(e) { update(week, day, "period", e.target.value); }}>{["Full Day","AM","PM"].map(function(p) { return <option key={p} value={p}>{p}</option>; })}</select>
                        <input className="cell-edit-input" type="text" value={entry.notes || ""} placeholder="Notes (optional)" onChange={function(e) { update(week, day, "notes", e.target.value); }} />
                        {!isBase && isOv && <button className="cell-reset-btn" onClick={function() { resetToBase(week, day); }}>↺ Reset to Base</button>}
                      </div>
                    ) : (
                      <div style={{ paddingLeft: bulk ? "16px" : "0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}><span className="cell-emoji">{act.emoji}</span><span className="cell-activity" style={{ color: act.color }}>{act.label}</span></div>
                        {entry.location && entry.location !== "N/A" && <div className="cell-location">{entry.location}</div>}
                        {entry.activity === "TIME_AWAY" && entry.reason && <div className="cell-reason">{entry.reason}</div>}
                        {entry.period !== "Full Day" && <span className="cell-period">{entry.period}</span>}
                        {isOv && baseAct && <div className="cell-base-ref">Base: {baseAct.emoji} {baseAct.label}</div>}
                        {entry.notes && <div className="cell-notes">{entry.notes}</div>}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>); })}</tbody>
        </table>
      </div>
      <div className="legend">
        {ACTIVITY_TYPES.filter(function(a) { return a.id !== "NONE"; }).map(function(a) { return <div key={a.id} className="legend-item"><span className="legend-emoji">{a.emoji}</span><span className="legend-label">{a.label}</span></div>; })}
        {!isBase && <div className="legend-item" style={{ marginLeft: "6px" }}><div className="legend-override-dot" /><span style={{ fontSize: "10px", color: "#D96C2C" }}>Changed from base</span></div>}
      </div>
      <div className="instructions"><strong>How to use:</strong> Click any cell to edit. Use <em>Multi-Select</em> to change several at once.{isBase ? " Changes here update the permanent template — all future months inherit from this." : " Use the arrows to navigate months. Past months can be corrected. Future months can be pre-populated with known time away."}</div>
    </div>
  );
}

// ---- SCHEDULE MANAGEMENT SECTION ----

function ScheduleSection(props) {
  var faculty = props.faculty, baseSchedules = props.baseSchedules, setBaseSchedules = props.setBaseSchedules;
  var allMonths = props.allMonths, setAllMonths = props.setAllMonths;
  var s1 = useState(null); var selId = s1[0]; var setSelId = s1[1];
  var s2 = useState("active"); var viewMode = s2[0]; var setViewMode = s2[1];
  var s3 = useState(CURRENT_YEAR); var yr = s3[0]; var setYr = s3[1];
  var s4 = useState(CURRENT_MONTH); var mo = s4[0]; var setMo = s4[1];
  var s5 = useState(""); var search = s5[0]; var setSearch = s5[1];
  var s6 = useState(null); var toast = s6[0]; var setToast = s6[1];
  var showToast = function(msg) { setToast(msg); setTimeout(function() { setToast(null); }, 2500); };
  var monthKey = makeMonthKey(yr, mo);

  useEffect(function() {
    if (!allMonths[monthKey]) { setAllMonths(function(prev) { var n = Object.assign({}, prev); n[monthKey] = generateMonthFromBase(baseSchedules, faculty, true, monthKey); return n; }); }
  }, [monthKey]);

  var activeSched = allMonths[monthKey] || {};
  var setActiveSched = function(updater) { setAllMonths(function(prev) { var cur = prev[monthKey] || {}; var next = typeof updater === "function" ? updater(cur) : updater; var r = Object.assign({}, prev); r[monthKey] = next; return r; }); };
  var filtered = faculty.filter(function(f) { return f.name.toLowerCase().indexOf(search.toLowerCase()) !== -1; });
  var selFac = faculty.find(function(f) { return f.id === selId; });
  var ovCounts = useMemo(function() { var c = {}; faculty.forEach(function(f) { var n = 0; WEEKS.forEach(function(w) { DAYS.forEach(function(d) { if (activeSched[f.id] && activeSched[f.id][w] && activeSched[f.id][w][d] && activeSched[f.id][w][d].isOverride) n++; }); }); c[f.id] = n; }); return c; }, [faculty, activeSched]);
  var isPast = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && mo < CURRENT_MONTH);
  var isFuture = yr > CURRENT_YEAR || (yr === CURRENT_YEAR && mo > CURRENT_MONTH);

  return (
    <div className="section-wrap light">
      <Toast message={toast} />
      <div className="section-body">
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Faculty</div>
            <input className="sidebar-search" type="text" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search..." />
          </div>
          <div className="sidebar-list">
            {filtered.map(function(f) { var active = selId === f.id; var oc = ovCounts[f.id] || 0; return (
              <div key={f.id} className={"sidebar-item" + (active ? " active" : "")} onClick={function() { setSelId(f.id); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div className="sidebar-item-name">{f.name}</div><div className="sidebar-item-meta">{f.division} · {f.fte} FTE</div></div>
                  {oc > 0 && <span className="sidebar-badge">{oc}Δ</span>}
                </div>
              </div>); })}
          </div>
        </div>
        <div className="main-content">
          {!selFac ? (
            <div className="empty-state"><div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📋</div><div style={{ fontSize: "18px", fontWeight: 600, color: "#5A6A7E" }}>Select a faculty member</div><div style={{ fontSize: "13px", marginTop: "6px" }}>Choose someone from the sidebar to view and edit their schedule</div></div>
          ) : (
            <div key={selFac.id + "-" + monthKey} className="main-content-inner">
              <div className="fac-header">
                <div>
                  <div className="fac-name">{selFac.name}</div>
                  <div className="fac-meta">{selFac.title} · {selFac.division} · <span style={{ fontFamily: "var(--mono)", fontWeight: 500 }}>{selFac.fte} FTE</span></div>
                  <div className="fac-pills">
                    {[{ l: "Clinical", p: selFac.clinicalPct, c: "#3C7BD9" },{ l: "Research", p: selFac.researchPct, c: "#1A8754" },{ l: "Education", p: selFac.educationPct, c: "#B45309" },{ l: "Admin", p: selFac.adminPct, c: "#6B7785" }].map(function(item) {
                      return <span key={item.l} className="fac-pill" style={{ color: item.c, background: item.c + "12" }}>{item.l} {item.p}%</span>; })}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <MonthNav year={yr} month={mo} onChange={function(y, m) { setYr(y); setMo(m); }} theme="light" />
                  <div className="view-toggle">
                    <button className={"view-toggle-btn" + (viewMode === "active" ? " active" : "")} onClick={function() { setViewMode("active"); }}>Monthly Schedule</button>
                    <button className={"view-toggle-btn" + (viewMode === "base" ? " active" : "")} onClick={function() { setViewMode("base"); }}>Base Template</button>
                  </div>
                </div>
              </div>
              {viewMode === "active" ? (
                <AdminGrid facultyId={selFac.id} base={baseSchedules} sched={activeSched} setSched={setActiveSched} isBase={false} showToast={showToast} monthLabel={MONTH_NAMES[mo] + " " + yr} isPast={isPast} isFuture={isFuture} />
              ) : (
                <AdminGrid facultyId={selFac.id} base={baseSchedules} sched={baseSchedules} setSched={setBaseSchedules} isBase={true} showToast={showToast} monthLabel="Base Template" isPast={false} isFuture={false} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- DASHBOARD SECTION ----

function DashboardSection(props) {
  var faculty = props.faculty, allMonths = props.allMonths;
  var s1 = useState(CURRENT_YEAR); var yr = s1[0]; var setYr = s1[1];
  var s2 = useState(CURRENT_MONTH); var mo = s2[0]; var setMo = s2[1];
  var s3 = useState(""); var filterDiv = s3[0]; var setFilterDiv = s3[1];
  var s4 = useState("variance"); var sortBy = s4[0]; var setSortBy = s4[1];
  var s5 = useState(null); var selId = s5[0]; var setSelId = s5[1];
  var monthKey = makeMonthKey(yr, mo);
  var activeSched = allMonths[monthKey] || {};

  var rows = useMemo(function() { return faculty.map(function(f) { return Object.assign({}, f, { m: calculateMetrics(f, activeSched[f.id]) }); }); }, [faculty, activeSched]);
  var filtered = rows.filter(function(f) { return !filterDiv || f.division === filterDiv; }).sort(function(a, b) {
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
    <div className="section-wrap dark dark-theme">
      <div className="dash-toolbar">
        <MonthNav year={yr} month={mo} onChange={function(y, m) { setYr(y); setMo(m); }} theme="dark" />
        <div className="lead-filters" style={{ marginBottom: 0 }}>
          <select className="lead-select" value={filterDiv} onChange={function(e) { setFilterDiv(e.target.value); }}><option value="">All Divisions</option>{DIVISIONS.map(function(d) { return <option key={d} value={d}>{d}</option>; })}</select>
          <select className="lead-select" value={sortBy} onChange={function(e) { setSortBy(e.target.value); }}>
            {[{ v: "variance", l: "Variance" },{ v: "timeAway", l: "Time Away" },{ v: "utilization", l: "Utilization" },{ v: "overrides", l: "Overrides" },{ v: "name", l: "Name" }].map(function(o) { return <option key={o.v} value={o.v}>Sort: {o.l}</option>; })}</select>
        </div>
      </div>
      <div className="dash-content">
        <div className="kpi-grid">{kpis.map(function(k, i) { return (<div key={i} className="kpi-card"><div className="kpi-value" style={{ color: k.c }}>{k.v}</div><div className="kpi-label">{k.l}</div>{k.s && <div className="kpi-sub">{k.s}</div>}</div>); })}</div>
        <div className={"lead-grid" + (detail ? " with-detail" : "")}>
          <div>
            <div className="roster-header"><div>Faculty</div><div style={{ textAlign: "center" }}>Clinical</div><div style={{ textAlign: "center" }}>Variance</div><div style={{ textAlign: "center" }}>Util</div><div style={{ textAlign: "center" }}>Away</div><div style={{ textAlign: "center" }}>Δ</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {filtered.map(function(f) { var vc = Math.abs(f.m.variance) <= 5 ? "#2EBD8E" : f.m.variance > 0 ? "#F59E0B" : "#E5534B"; return (
                <div key={f.id} className={"roster-row" + (selId === f.id ? " selected" : "")} onClick={function() { setSelId(selId === f.id ? null : f.id); }}>
                  <div><div className="roster-name">{f.name}</div><div className="roster-meta">{f.division} · {f.fte} FTE</div></div>
                  <div className="roster-val" style={{ color: "#00B2A9" }}>{f.m.actualPct.toFixed(0)}%</div>
                  <div className="roster-val" style={{ color: vc }}>{f.m.variance >= 0 ? "+" : ""}{f.m.variance.toFixed(1)}%</div>
                  <div className="roster-val" style={{ color: "#E8ECF1" }}>{f.m.utilization.toFixed(0)}%</div>
                  <div className="roster-val" style={{ color: f.m.away > 2 ? "#E5534B" : "#8B9BB4" }}>{f.m.away}d</div>
                  <div style={{ textAlign: "center" }}>{f.m.overrides > 0 ? <span className="ov-badge">{f.m.overrides}</span> : <span style={{ color: "#5A6B84" }}>—</span>}</div>
                </div>); })}
            </div>
          </div>
          {detail && (
            <div className="detail-panel">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><div><div className="detail-name">{detail.name}</div><div className="detail-meta">{detail.title} · {detail.division}</div></div><button className="detail-close" onClick={function() { setSelId(null); }}>✕</button></div>
              {[{ l: "Clinical", e: detail.clinicalPct, a: detail.m.actualPct, c: "#4A90D9" },{ l: "Research", e: detail.researchPct, a: detail.m.active > 0 ? (detail.m.counts.RESEARCH / detail.m.active) * 100 : 0, c: "#2EBD8E" },{ l: "Education", e: detail.educationPct, a: detail.m.active > 0 ? (detail.m.counts.EDUCATION / detail.m.active) * 100 : 0, c: "#E5A832" },{ l: "Admin", e: detail.adminPct, a: detail.m.active > 0 ? (detail.m.counts.ADMIN / detail.m.active) * 100 : 0, c: "#6E7C91" }].map(function(item) { return (
                <div key={item.l} style={{ marginBottom: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}><span className="effort-label" style={{ color: item.c }}>{item.l}</span><span className="effort-val">{item.a.toFixed(0)}% / {item.e}%</span></div>
                  <div className="effort-bg"><div className="effort-expected" style={{ width: Math.min(item.e, 100) + "%", background: item.c }} /><div className="effort-actual" style={{ width: Math.min(item.a, 100) + "%", background: item.c }} /></div>
                </div>); })}
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "9px", color: "#5A6B84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Schedule</div>
                <div className="heatmap"><div />{DAY_SHORT.map(function(d) { return <div key={d} className="heatmap-label">{d[0]}</div>; })}
                  {WEEKS.map(function(w) { return (<Fragment key={w}><div className="heatmap-label" style={{ lineHeight: "13px" }}>{w}</div>
                    {DAYS.map(function(d) { var e = activeSched[detail.id] && activeSched[detail.id][w] && activeSched[detail.id][w][d]; var a = getActivity(e ? e.activity : "NONE"); var bc = (e && e.isOverride) ? "rgba(255,140,66,0.33)" : a.colorDark + "22"; return <div key={w + "-" + d} className="heatmap-cell" style={{ background: a.colorDark + "44", border: "1px solid " + bc }} title={"W" + w + " " + d + ": " + a.label} />; })}</Fragment>); })}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- APP ROOT ----

function App() {
  var initState = useState(function() { return initializeAppState(); }); var appInit = initState[0];
  var s1 = useState("schedules"); var tab = s1[0]; var setTab = s1[1];
  var s2 = useState(SEED_FACULTY); var faculty = s2[0];
  var s3 = useState(appInit.base); var baseSchedules = s3[0]; var setBaseSchedules = s3[1];
  var s4 = useState(appInit.months); var allMonths = s4[0]; var setAllMonths = s4[1];
  var isDash = tab === "dashboard";

  return (
    <div className={"app-root" + (isDash ? " dark-mode" : "")}>
      <header className={"top-nav" + (isDash ? " dark" : "")}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className={"logo-mark" + (isDash ? " lead" : " admin")}>BIQ</div>
          <div>
            <div className={"top-nav-title" + (isDash ? " dark" : "")}>BizIQ <span className={"top-nav-accent" + (isDash ? " dark" : "")}>Scheduling</span></div>
            <div className={"top-nav-sub" + (isDash ? " dark" : "")}>Department of Urology · University of Michigan Health</div>
          </div>
        </div>
        <div className="top-nav-tabs">
          <button className={"top-nav-tab" + (tab === "schedules" ? " active" : "") + (isDash ? " dark" : "")} onClick={function() { setTab("schedules"); }}>📋 Schedule Management</button>
          <button className={"top-nav-tab" + (tab === "dashboard" ? " active" : "") + (isDash ? " dark" : "")} onClick={function() { setTab("dashboard"); }}>📊 Dashboard</button>
        </div>
        <div><span className={"top-nav-meta" + (isDash ? " dark" : "")}>{faculty.length} faculty</span></div>
      </header>
      {tab === "schedules" ? (
        <ScheduleSection faculty={faculty} baseSchedules={baseSchedules} setBaseSchedules={setBaseSchedules} allMonths={allMonths} setAllMonths={setAllMonths} />
      ) : (
        <DashboardSection faculty={faculty} allMonths={allMonths} baseSchedules={baseSchedules} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
