// ============================================================
// BizIQ Scheduling — Utilities
// ============================================================

var getActivity = function(id) {
  return ACTIVITY_TYPES.find(function(a) { return a.id === id; }) || ACTIVITY_TYPES[7];
};

var makeMonthKey = function(year, month) {
  return year + "-" + String(month + 1).padStart(2, "0");
};

var generateBaseSchedules = function(faculty) {
  var bases = {};
  var clinicalTypes = ["CLINIC", "OR"];
  var locPool = ["UH/Taubman", "TC", "NHC", "Brighton", "Chelsea"];
  faculty.forEach(function(f) {
    bases[f.id] = {};
    WEEKS.forEach(function(w) {
      bases[f.id][w] = {};
      DAYS.forEach(function(d, i) {
        var act, loc;
        if (i <= 2) {
          act = clinicalTypes[Math.floor(Math.random() * 2)];
          loc = locPool[Math.floor(Math.random() * 3)];
        } else if (i === 3) {
          act = Math.random() < 0.4 ? "RESEARCH" : "ADMIN";
          loc = "UH/Taubman";
        } else {
          act = Math.random() < 0.3 ? "EDUCATION" : "ADMIN";
          loc = "UH/Taubman";
        }
        bases[f.id][w][d] = { activity: act, location: loc, period: "Full Day" };
      });
    });
  });
  return bases;
};

var generateMonthFromBase = function(base, faculty, withOverrides) {
  var month = {};
  faculty.forEach(function(f) {
    month[f.id] = {};
    WEEKS.forEach(function(w) {
      month[f.id][w] = {};
      DAYS.forEach(function(d) {
        var be = base[f.id] && base[f.id][w] && base[f.id][w][d];
        if (!be) return;
        if (withOverrides) {
          var r = Math.random();
          if (r < 0.06) {
            month[f.id][w][d] = {
              activity: "TIME_AWAY", location: "N/A", period: "Full Day",
              reason: AWAY_REASONS[Math.floor(Math.random() * 3)],
              notes: "", isOverride: true
            };
            return;
          }
          if (r < 0.1) {
            var sw = ["CLINIC","OR","ADMIN"][Math.floor(Math.random() * 3)];
            month[f.id][w][d] = Object.assign({}, be, { activity: sw, notes: "Coverage swap", isOverride: true });
            return;
          }
        }
        month[f.id][w][d] = Object.assign({}, be, { isOverride: false });
      });
    });
  });
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

// Generate initial app state with shared base
var initializeAppState = function() {
  var base = generateBaseSchedules(SEED_FACULTY);
  var curKey = makeMonthKey(CURRENT_YEAR, CURRENT_MONTH);
  var prevM = CURRENT_MONTH - 1 < 0 ? 11 : CURRENT_MONTH - 1;
  var prevY = CURRENT_MONTH - 1 < 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
  var prevKey = makeMonthKey(prevY, prevM);
  var months = {};
  months[curKey] = generateMonthFromBase(base, SEED_FACULTY, true);
  months[prevKey] = generateMonthFromBase(base, SEED_FACULTY, true);
  return { base: base, months: months };
};
