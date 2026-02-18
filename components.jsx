// ============================================================
// UROTRACK — Shared Components
// ============================================================

const { useState, useEffect, useMemo, Fragment } = React;

function MonthNav({ year, month, onChange, theme }) {
  const isLight = theme === "light";
  const isCurrent = year === CURRENT_YEAR && month === CURRENT_MONTH;
  const isPast = year < CURRENT_YEAR || (year === CURRENT_YEAR && month < CURRENT_MONTH);

  const prev = () => {
    let m = month - 1, y = year;
    if (m < 0) { m = 11; y--; }
    onChange(y, m);
  };
  const next = () => {
    let m = month + 1, y = year;
    if (m > 11) { m = 0; y++; }
    onChange(y, m);
  };

  const btnCls = "month-nav-btn" + (isLight ? "" : " dark");
  let dispCls = "month-nav-display" + (isLight ? "" : " dark");
  if (isCurrent) dispCls += " current";
  else if (isPast) dispCls += " past";
  else dispCls += " future";

  const subColor = isCurrent
    ? (isLight ? "#1A8754" : "#2EBD8E")
    : isPast
      ? (isLight ? "#8E99A8" : "#5A6B84")
      : (isLight ? "#3C7BD9" : "#00B2A9");

  return (
    <div className="month-nav">
      <button className={btnCls} onClick={prev}>‹</button>
      <div className={dispCls}>
        <div className={"month-nav-label" + (isLight ? "" : " dark")}>{MONTH_NAMES[month]} {year}</div>
        <div className="month-nav-sub" style={{ color: subColor }}>
          {isCurrent ? "Current Month" : isPast ? "Past" : "Future"}
        </div>
      </div>
      <button className={btnCls} onClick={next}>›</button>
      {!isCurrent && (
        <button className={"month-nav-today" + (isLight ? "" : " dark")} onClick={() => onChange(CURRENT_YEAR, CURRENT_MONTH)}>
          Today
        </button>
      )}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
