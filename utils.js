// ============================================================
// BizIQ Scheduling — Utilities
// Updated: Loads QGenda data from SEED_BASE_SCHEDULES + SEED_MONTH_OVERRIDES
// All function signatures preserved for app.jsx compatibility
// ============================================================

var getActivity = function(id) {
  return ACTIVITY_TYPES.find(function(a) { return a.id === id; }) || ACTIVITY_TYPES[7];
};

var makeMonthKey = function(year, month) {
  return year + "-" + String(month + 1).padStart(2, "0");
};

// Generate base schedules from SEED data (replaces random generation)
var generateBaseSchedules = function(faculty) {
  var bases = {};
  faculty.forEach(function(f) {
    if (SEED_BASE_SCHEDULES && SEED_BASE_SCHEDULES[f.id]) {
      // Deep clone from QGenda Work Patterns
      bases[f.id] = JSON.parse(JSON.stringify(SEED_BASE_SCHEDULES[f.id]));
    } else {
      // Empty base for providers without work patterns
      bases[f.id] = {};
      WEEKS.forEach(function(w) {
        bases[f.id][w] = {};
        DAYS.forEach(function(d) {
          bases[f.id][w][d] = { activity: "NONE", location: "N/A", period: "Full Day", isOverride: false };
        });
      });
    }
  });
  return bases;
};

// Generate month from base, optionally applying QGenda overrides
var generateMonthFromBase = function(base, faculty, withOverrides, monthKey) {
  var month = {};
  faculty.forEach(function(f) {
    month[f.id] = {};
    WEEKS.forEach(function(w) {
      month[f.id][w] = {};
      DAYS.forEach(function(d) {
        var be = base[f.id] && base[f.id][w] && base[f.id][w][d];
        if (!be) {
          month[f.id][w][d] = { activity: "NONE", location: "N/A", period: "Full Day", isOverride: false };
          return;
        }
        month[f.id][w][d] = Object.assign({}, be, { isOverride: false });
      });
    });
  });

  // Apply QGenda overrides for this month if available
  if (monthKey && SEED_MONTH_OVERRIDES && SEED_MONTH_OVERRIDES[monthKey]) {
    var overrides = SEED_MONTH_OVERRIDES[monthKey];
    Object.keys(overrides).forEach(function(staffId) {
      if (!month[staffId]) return;
      var staffOv = overrides[staffId];
      Object.keys(staffOv).forEach(function(wk) {
        var wkNum = Number(wk);
        if (!month[staffId][wkNum]) return;
        Object.keys(staffOv[wk]).forEach(function(day) {
          month[staffId][wkNum][day] = Object.assign({}, staffOv[wk][day]);
        });
      });
    });
  }

  return month;
};

var calculateMetrics = function(faculty, schedule) {
  var total = WEEKS.length * DAYS.length;
  var counts = {};
  ACTIVITY_TYPES.forEach(function(a) { counts[a.id] = 0; });
  var away = 0, overrides = 0;
  if (schedule) {
    WEEKS.forEach(function(w) {
      DAYS.forEach(function(d) {
        var e = schedule[w] && schedule[w][d];
        if (e) {
          counts[e.activity] = (counts[e.activity] || 0) + 1;
          if (e.activity === "TIME_AWAY") away++;
          if (e.isOverride) overrides++;
        }
      });
    });
  }
  var active = total - away;
  var clinical = (counts.CLINIC || 0) + (counts.OR || 0) + (counts.CALL || 0);
  var actualPct = active > 0 ? (clinical / active) * 100 : 0;
  return {
    total: total, active: active, counts: counts, clinical: clinical,
    actualPct: actualPct, expected: faculty.clinicalPct,
    variance: actualPct - faculty.clinicalPct,
    away: away, awayPct: (away / total) * 100,
    utilization: (active / total) * 100, overrides: overrides
  };
};

var getCellBgClass = function(activity, isOverride, isBulkSelected) {
  if (isBulkSelected) return "bg-selected";
  if (isOverride && activity !== "TIME_AWAY") return "bg-override";
  switch (activity) {
    case "CLINIC": case "OR": return "bg-clinic";
    case "RESEARCH": return "bg-research";
    case "EDUCATION": return "bg-education";
    case "TIME_AWAY": return "bg-away";
    case "CALL": return "bg-call";
    case "ADMIN": return "bg-admin";
    default: return "bg-none";
  }
};

var getCellBorderClass = function(isEditing, isBulkSelected, isOverride) {
  if (isBulkSelected) return "border-bulk";
  if (isEditing) return "border-editing";
  if (isOverride) return "border-override";
  return "border-default";
};

// Initialize app state from QGenda data
var initializeAppState = function() {
  var base = generateBaseSchedules(SEED_FACULTY);
  var months = {};

  // Pre-populate all months that have QGenda data
  if (typeof QGENDA_MONTHS !== "undefined") {
    QGENDA_MONTHS.forEach(function(mk) {
      var parts = mk.split("-");
      var y = parseInt(parts[0]);
      var m = parseInt(parts[1]) - 1; // convert to 0-indexed
      var key = makeMonthKey(y, m);
      months[key] = generateMonthFromBase(base, SEED_FACULTY, true, key);
    });
  }

  // Ensure current month exists
  var curKey = makeMonthKey(CURRENT_YEAR, CURRENT_MONTH);
  if (!months[curKey]) {
    months[curKey] = generateMonthFromBase(base, SEED_FACULTY, false, curKey);
  }

  return { base: base, months: months };
};
