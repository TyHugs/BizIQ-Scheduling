// ============================================================
// BizIQ Scheduling — Data Layer
// ============================================================

var ACTIVITY_TYPES = [
  {id:"CLINIC",  label:"Clinic",      short:"CL", color:"#3C7BD9", colorDark:"#4A90D9", emoji:"🏥"},
  {id:"OR",      label:"OR / Surgery",short:"OR", color:"#7C4DBC", colorDark:"#9B6FCF", emoji:"🔬"},
  {id:"ADMIN",   label:"Admin",       short:"AD", color:"#6B7785", colorDark:"#6E7C91", emoji:"📋"},
  {id:"RESEARCH",label:"Research",    short:"RE", color:"#1A8754", colorDark:"#2EBD8E", emoji:"🧪"},
  {id:"EDUCATION",label:"Education",  short:"ED", color:"#B45309", colorDark:"#E5A832", emoji:"📚"},
  {id:"CALL",    label:"On-Call",     short:"CA", color:"#B83D7A", colorDark:"#D964A8", emoji:"📞"},
  {id:"TIME_AWAY",label:"Time Away",  short:"TA", color:"#C53030", colorDark:"#E5534B", emoji:"✈️"},
  {id:"NONE",    label:"Not Scheduled",short:"—", color:"#C8CDD5", colorDark:"#2A3444", emoji:"—"},
];

var LOCATIONS = ["UH/Taubman","TC","NHC","Brighton","Chelsea","VA","West Shore","BCSC","Off-site","N/A"];
var AWAY_REASONS = ["Vacation","CME / Conference","Sick","Personal","FMLA","Sabbatical","Holiday","Admin Leave","Other"];
var DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
var DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri"];
var WEEKS = [1,2,3,4,5];
var DIVISIONS = ["Endourology","Men's Health & Reconstruction","Oncology","Pediatric Urology","Women's Urology","General / Unassigned"];
var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var CURRENT_YEAR = 2026;
var CURRENT_MONTH = 1; // 0-indexed: February

var SEED_FACULTY = [
  {id:1,name:"Dr. Sarah Mitchell",division:"Endourology",fte:1.0,clinicalPct:60,researchPct:20,educationPct:10,adminPct:10,title:"Associate Professor"},
  {id:2,name:"Dr. James Park",division:"Oncology",fte:0.8,clinicalPct:70,researchPct:10,educationPct:10,adminPct:10,title:"Professor"},
  {id:3,name:"Dr. Rachel Torres",division:"Women's Urology",fte:1.0,clinicalPct:50,researchPct:30,educationPct:10,adminPct:10,title:"Assistant Professor"},
  {id:4,name:"Dr. Michael Chen",division:"Pediatric Urology",fte:0.65,clinicalPct:65,researchPct:15,educationPct:10,adminPct:10,title:"Clinical Assoc Professor"},
  {id:5,name:"Dr. Anika Patel",division:"Men's Health & Reconstruction",fte:1.0,clinicalPct:55,researchPct:25,educationPct:10,adminPct:10,title:"Associate Professor"},
  {id:6,name:"Dr. David Okonkwo",division:"Endourology",fte:1.0,clinicalPct:75,researchPct:5,educationPct:10,adminPct:10,title:"Clinical Professor"},
  {id:7,name:"Dr. Lisa Wang",division:"Oncology",fte:0.9,clinicalPct:60,researchPct:20,educationPct:10,adminPct:10,title:"Professor"},
  {id:8,name:"Dr. Kevin O'Brien",division:"General / Unassigned",fte:1.0,clinicalPct:50,researchPct:30,educationPct:10,adminPct:10,title:"Assistant Professor"},
];
