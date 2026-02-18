// ============================================================
// UROTRACK — Leadership Dashboard
// ============================================================

function LeadDashboard({ faculty, allMonths, baseSchedules, onLogout }) {
  const [yr, setYr] = useState(CURRENT_YEAR);
  const [mo, setMo] = useState(CURRENT_MONTH);
  const [filterDiv, setFilterDiv] = useState("");
  const [sortBy, setSortBy] = useState("variance");
  const [selId, setSelId] = useState(null);

  const monthKey = makeMonthKey(yr, mo);
  const activeSched = allMonths[monthKey] || {};

  const rows = useMemo(function() {
    return faculty.map(function(f) {
      var m = calculateMetrics(f, activeSched[f.id]);
      return Object.assign({}, f, { m: m });
    });
  }, [faculty, activeSched]);

  const filtered = rows
    .filter(function(f) { return !filterDiv || f.division === filterDiv; })
    .sort(function(a, b) {
      if (sortBy === "variance") return Math.abs(b.m.variance) - Math.abs(a.m.variance);
      if (sortBy === "timeAway") return b.m.awayPct - a.m.awayPct;
      if (sortBy === "utilization") return a.m.utilization - b.m.utilization;
      if (sortBy === "overrides") return b.m.overrides - a.m.overrides;
      return a.name.localeCompare(b.name);
    });

  const avgV = filtered.length ? filtered.reduce(function(s, f) { return s + f.m.variance; }, 0) / filtered.length : 0;
  const avgU = filtered.length ? filtered.reduce(function(s, f) { return s + f.m.utilization; }, 0) / filtered.length : 0;
  const avgA = filtered.length ? filtered.reduce(function(s, f) { return s + f.m.awayPct; }, 0) / filtered.length : 0;
  const onTgt = filtered.filter(function(f) { return Math.abs(f.m.variance) <= 5; }).length;
  const totOv = filtered.reduce(function(s, f) { return s + f.m.overrides; }, 0);
  const detail = selId ? rows.find(function(f) { return f.id === selId; }) : null;

  const kpis = [
    { l: "Faculty", v: filtered.length, c: "#FFCB05" },
    { l: "Avg Variance", v: (avgV >= 0 ? "+" : "") + avgV.toFixed(1) + "%", c: Math.abs(avgV) <= 5 ? "#2EBD8E" : "#F59E0B" },
    { l: "Utilization", v: avgU.toFixed(0) + "%", c: "#00B2A9" },
    { l: "Avg Away", v: avgA.toFixed(1) + "%", c: "#E5534B" },
    { l: "On Target", v: onTgt, c: "#2EBD8E", s: "±5%" },
    { l: "Overrides", v: totOv, c: "#FF8C42", s: "this month" },
  ];

  return (
    <div className="lead-wrap dark-theme">
      {/* Header */}
      <header className="lead-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="logo-mark lead">U</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFCB05" }}>
              UroTrack <span style={{ fontWeight: 400, color: "#8B9BB4", fontSize: "12px" }}>Leadership</span>
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
        {/* KPIs */}
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

        {/* Filters */}
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
          {/* Roster */}
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

          {/* Detail panel */}
          {detail && (
            <div className="detail-panel">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <div className="detail-name">{detail.name}</div>
                  <div className="detail-meta">{detail.title} · {detail.division}</div>
                </div>
                <button className="detail-close" onClick={function() { setSelId(null); }}>✕</button>
              </div>

              {/* Effort bars */}
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

              {/* Mini heatmap */}
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
                            <div key={w + d} className="heatmap-cell"
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
