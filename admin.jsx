// ============================================================
// UROTRACK — Admin Portal
// ============================================================

function AdminGrid({ facultyId, base, sched, setSched, isBase, showToast, monthLabel, isPast, isFuture }) {
  const [editCell, setEditCell] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [bulkSel, setBulkSel] = useState(new Set());
  const [bulkAct, setBulkAct] = useState("");
  const [bulkLoc, setBulkLoc] = useState("UH/Taubman");
  const [bulkRsn, setBulkRsn] = useState("Vacation");

  const baseData = (base && base[facultyId]) || {};
  const curData = (sched && sched[facultyId]) || {};
  const ck = (w, d) => w + "|" + d;

  const update = (w, d, field, val) => {
    setSched(function(prev) {
      const facData = Object.assign({}, prev[facultyId]);
      if (!facData[w]) facData[w] = {};
      const old = facData[w][d] || {};
      const up = Object.assign({}, old);
      up[field] = val;
      if (!isBase) {
        const be = baseData[w] && baseData[w][d];
        up.isOverride = be && (up.activity !== be.activity || up.location !== be.location);
      }
      facData[w][d] = up;
      const result = Object.assign({}, prev);
      result[facultyId] = facData;
      return result;
    });
  };

  const resetToBase = (w, d) => {
    const be = baseData[w] && baseData[w][d];
    if (!be) return;
    setSched(function(prev) {
      const facData = Object.assign({}, prev[facultyId]);
      if (!facData[w]) facData[w] = {};
      facData[w][d] = Object.assign({}, be, { isOverride: false });
      const result = Object.assign({}, prev);
      result[facultyId] = facData;
      return result;
    });
    setEditCell(null);
    showToast("Reset to base schedule");
  };

  const applyBulk = () => {
    if (!bulkAct || bulkSel.size === 0) return;
    setSched(function(prev) {
      const facData = Object.assign({}, prev[facultyId]);
      bulkSel.forEach(function(k) {
        const parts = k.split("|");
        const wk = Number(parts[0]);
        const dy = parts[1];
        if (!facData[wk]) facData[wk] = {};
        const loc = bulkAct === "TIME_AWAY" ? "N/A" : bulkLoc;
        const be = baseData[wk] && baseData[wk][dy];
        const isOv = !isBase && be && (be.activity !== bulkAct || be.location !== loc);
        const entry = { activity: bulkAct, location: loc, period: "Full Day", notes: "", isOverride: isBase ? false : isOv };
        if (bulkAct === "TIME_AWAY") entry.reason = bulkRsn;
        facData[wk][dy] = entry;
      });
      const result = Object.assign({}, prev);
      result[facultyId] = facData;
      return result;
    });
    showToast("Applied " + getActivity(bulkAct).label + " to " + bulkSel.size + " cells");
    setBulkSel(new Set());
    setBulk(false);
    setBulkAct("");
  };

  let ovCount = 0;
  if (!isBase) {
    WEEKS.forEach(function(w) { DAYS.forEach(function(d) {
      if (curData[w] && curData[w][d] && curData[w][d].isOverride) ovCount++;
    }); });
  }

  // Mode bar class
  let modeBarCls = "mode-bar";
  if (isBase) modeBarCls += " base";
  else if (isPast) modeBarCls += " past";
  else if (isFuture) modeBarCls += " future";
  else modeBarCls += " current";

  return (
    <div>
      {/* Mode bar */}
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
          <button className={"bulk-toggle" + (bulk ? " active" : "")} onClick={() => { setBulk(!bulk); setBulkSel(new Set()); }}>
            {bulk ? "✓ Selecting" : "Multi-Select"}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
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

      {/* Grid */}
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
                    const entry = (curData[week] && curData[week][day]) || { activity: "NONE", location: "N/A", period: "Full Day", isOverride: false };
                    const baseE = baseData[week] && baseData[week][day];
                    const act = getActivity(entry.activity);
                    const baseAct = baseE ? getActivity(baseE.activity) : null;
                    const editing = editCell && editCell.w === week && editCell.d === day;
                    const isOv = !isBase && entry.isOverride;
                    const isBulkS = bulkSel.has(ck(week, day));

                    const bgCls = getCellBgClass(entry.activity, isOv, isBulkS);
                    const bdrCls = getCellBorderClass(editing, isBulkS, isOv);

                    return (
                      <td key={day}
                        className={"cell " + bgCls + " " + bdrCls}
                        onClick={function() {
                          if (bulk) {
                            const k = ck(week, day);
                            setBulkSel(function(prev) {
                              const n = new Set(prev);
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
                            <select className="cell-edit-select" value={entry.activity} onChange={function(e) { update(week, day, "activity", e.target.value); }}>
                              {ACTIVITY_TYPES.map(function(a) { return <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>; })}
                            </select>
                            {entry.activity !== "TIME_AWAY" && entry.activity !== "NONE" && (
                              <select className="cell-edit-select" value={entry.location} onChange={function(e) { update(week, day, "location", e.target.value); }}>
                                {LOCATIONS.map(function(l) { return <option key={l} value={l}>{l}</option>; })}
                              </select>
                            )}
                            {entry.activity === "TIME_AWAY" && (
                              <select className="cell-edit-select" value={entry.reason || ""} onChange={function(e) { update(week, day, "reason", e.target.value); }}>
                                <option value="">Reason...</option>
                                {AWAY_REASONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
                              </select>
                            )}
                            <select className="cell-edit-select" value={entry.period} onChange={function(e) { update(week, day, "period", e.target.value); }}>
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

      {/* Legend */}
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

      {/* Instructions */}
      <div className="instructions">
        <strong>How to use:</strong> Click any cell to edit. Use <em>Multi-Select</em> to change several at once.
        {isBase
          ? " Changes here update the permanent template — all future months inherit from this."
          : " Use the arrows to navigate months. Past months can be corrected. Future months can be pre-populated with known time away."}
      </div>
    </div>
  );
}

function AdminPortal({ faculty, baseSchedules, setBaseSchedules, allMonths, setAllMonths, onLogout }) {
  const [selId, setSelId] = useState(null);
  const [viewMode, setViewMode] = useState("active");
  const [yr, setYr] = useState(CURRENT_YEAR);
  const [mo, setMo] = useState(CURRENT_MONTH);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = function(msg) { setToast(msg); setTimeout(function() { setToast(null); }, 2500); };
  const monthKey = makeMonthKey(yr, mo);

  useEffect(function() {
    if (!allMonths[monthKey]) {
      setAllMonths(function(prev) {
        const n = Object.assign({}, prev);
        n[monthKey] = generateMonthFromBase(baseSchedules, faculty, false);
        return n;
      });
    }
  }, [monthKey]);

  const activeSched = allMonths[monthKey] || {};
  const setActiveSched = function(updater) {
    setAllMonths(function(prev) {
      const cur = prev[monthKey] || {};
      const next = typeof updater === "function" ? updater(cur) : updater;
      const result = Object.assign({}, prev);
      result[monthKey] = next;
      return result;
    });
  };

  const filtered = faculty.filter(function(f) { return f.name.toLowerCase().includes(search.toLowerCase()); });
  const selFac = faculty.find(function(f) { return f.id === selId; });

  const ovCounts = useMemo(function() {
    const c = {};
    faculty.forEach(function(f) {
      var n = 0;
      WEEKS.forEach(function(w) { DAYS.forEach(function(d) {
        if (activeSched[f.id] && activeSched[f.id][w] && activeSched[f.id][w][d] && activeSched[f.id][w][d].isOverride) n++;
      }); });
      c[f.id] = n;
    });
    return c;
  }, [faculty, activeSched]);

  const isPast = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && mo < CURRENT_MONTH);
  const isFuture = yr > CURRENT_YEAR || (yr === CURRENT_YEAR && mo > CURRENT_MONTH);

  return (
    <div className="admin-wrap">
      {/* Header */}
      <header className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="logo-mark admin">U</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#00274C" }}>
              UroTrack <span style={{ fontWeight: 400, color: "#5A6A7E", fontSize: "12px" }}>Admin Portal</span>
            </div>
            <div style={{ fontSize: "10px", color: "#8E99A8" }}>Department of Urology · Schedule Management</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#8E99A8" }}>{faculty.length} faculty</span>
          <button className="btn-signout" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <Toast message={toast} />

      <div className="admin-body">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Your Faculty</div>
            <input className="sidebar-search" type="text" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search..." />
          </div>
          <div className="sidebar-list">
            {filtered.map(function(f) {
              const active = selId === f.id;
              const oc = ovCounts[f.id] || 0;
              return (
                <div key={f.id} className={"sidebar-item" + (active ? " active" : "")} onClick={function() { setSelId(f.id); }}>
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

        {/* Main content */}
        <div className="main-content">
          {!selFac ? (
            <div className="empty-state">
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#5A6A7E" }}>Select a faculty member</div>
              <div style={{ fontSize: "13px", marginTop: "6px" }}>Choose someone from the sidebar to view and edit their schedule</div>
            </div>
          ) : (
            <div key={selFac.id + "-" + monthKey} className="main-content-inner">
              {/* Faculty header */}
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
                    <button className={"view-toggle-btn" + (viewMode === "active" ? " active" : "")} onClick={function() { setViewMode("active"); }}>Monthly Schedule</button>
                    <button className={"view-toggle-btn" + (viewMode === "base" ? " active" : "")} onClick={function() { setViewMode("base"); }}>Base Template</button>
                  </div>
                </div>
              </div>

              {/* Grid */}
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
