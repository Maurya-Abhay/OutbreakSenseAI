const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const mockDashboardSummary = {
  stats: {
    totalReports: 785,
    highRiskReports: 214,
    mediumRiskReports: 349,
    activeAlerts: 24,
    reportsThisWeek: 121
  },
  areaBreakdown: [
    { locationName: "Dhaka Center", totalReports: 84, avgRiskScore: 0.73 },
    { locationName: "Uttara", totalReports: 67, avgRiskScore: 0.66 },
    { locationName: "Gulshan", totalReports: 51, avgRiskScore: 0.54 },
    { locationName: "Mirpur", totalReports: 74, avgRiskScore: 0.61 },
    { locationName: "Dhanmondi", totalReports: 46, avgRiskScore: 0.48 },
    { locationName: "Gurgaon", totalReports: 63, avgRiskScore: 0.69 },
    { locationName: "New Delhi", totalReports: 58, avgRiskScore: 0.64 },
    { locationName: "Faridabad", totalReports: 37, avgRiskScore: 0.57 },
    { locationName: "Ekma (Bihar)", totalReports: 29, avgRiskScore: 0.62 },
    { locationName: "Patna", totalReports: 49, avgRiskScore: 0.59 },
    { locationName: "Noida", totalReports: 54, avgRiskScore: 0.61 },
    { locationName: "Ghaziabad", totalReports: 45, avgRiskScore: 0.58 },
    { locationName: "Sonipat", totalReports: 33, avgRiskScore: 0.55 },
    { locationName: "Rohtak", totalReports: 41, avgRiskScore: 0.57 },
    { locationName: "Chhapra", totalReports: 28, avgRiskScore: 0.6 },
    { locationName: "Siwan", totalReports: 26, avgRiskScore: 0.56 }
  ],
  recentReports: [
    { id: "rep-r-1", locationName: "Dhaka Center", riskLevel: "High", riskScore: 0.79, createdAt: daysAgo(0) },
    { id: "rep-r-2", locationName: "Uttara", riskLevel: "Medium", riskScore: 0.58, createdAt: daysAgo(1) },
    { id: "rep-r-3", locationName: "Mirpur", riskLevel: "High", riskScore: 0.75, createdAt: daysAgo(1) }
  ]
};

export const mockHeatPoints = [
  {
    locationName: "Dhaka Center",
    latitude: 23.8103,
    longitude: 90.4125,
    averageRisk: 0.79,
    riskLevel: "High",
    totalReports: 84,
    intensity: 79,
    predictionTrend: "+12%"
  },
  {
    locationName: "Uttara",
    latitude: 23.8759,
    longitude: 90.3795,
    averageRisk: 0.63,
    riskLevel: "Medium",
    totalReports: 67,
    intensity: 63,
    predictionTrend: "+7%"
  },
  {
    locationName: "Gulshan",
    latitude: 23.7925,
    longitude: 90.4078,
    averageRisk: 0.52,
    riskLevel: "Medium",
    totalReports: 51,
    intensity: 52,
    predictionTrend: "+3%"
  },
  {
    locationName: "Dhanmondi",
    latitude: 23.7465,
    longitude: 90.376,
    averageRisk: 0.41,
    riskLevel: "Medium",
    totalReports: 46,
    intensity: 41,
    predictionTrend: "-2%"
  },
  {
    locationName: "Mohammadpur",
    latitude: 23.7605,
    longitude: 90.3584,
    averageRisk: 0.74,
    riskLevel: "High",
    totalReports: 59,
    intensity: 74,
    predictionTrend: "+11%"
  },
  {
    locationName: "Savar Belt",
    latitude: 23.8583,
    longitude: 90.2667,
    averageRisk: 0.32,
    riskLevel: "Low",
    totalReports: 23,
    intensity: 32,
    predictionTrend: "-6%"
  },
  {
    locationName: "Gurgaon",
    latitude: 28.4595,
    longitude: 77.0266,
    averageRisk: 0.69,
    riskLevel: "Medium",
    totalReports: 63,
    intensity: 69,
    predictionTrend: "+9%"
  },
  {
    locationName: "New Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    averageRisk: 0.64,
    riskLevel: "Medium",
    totalReports: 58,
    intensity: 64,
    predictionTrend: "+6%"
  },
  {
    locationName: "Faridabad",
    latitude: 28.4089,
    longitude: 77.3178,
    averageRisk: 0.57,
    riskLevel: "Medium",
    totalReports: 37,
    intensity: 57,
    predictionTrend: "+4%"
  },
  {
    locationName: "Ekma (Bihar)",
    latitude: 25.957,
    longitude: 84.548,
    averageRisk: 0.62,
    riskLevel: "Medium",
    totalReports: 29,
    intensity: 62,
    predictionTrend: "+8%"
  },
  {
    locationName: "Patna",
    latitude: 25.5941,
    longitude: 85.1376,
    averageRisk: 0.59,
    riskLevel: "Medium",
    totalReports: 49,
    intensity: 59,
    predictionTrend: "+5%"
  },
  {
    locationName: "Noida",
    latitude: 28.5355,
    longitude: 77.391,
    averageRisk: 0.61,
    riskLevel: "Medium",
    totalReports: 54,
    intensity: 61,
    predictionTrend: "+7%"
  },
  {
    locationName: "Ghaziabad",
    latitude: 28.6692,
    longitude: 77.4538,
    averageRisk: 0.58,
    riskLevel: "Medium",
    totalReports: 45,
    intensity: 58,
    predictionTrend: "+5%"
  },
  {
    locationName: "Sonipat",
    latitude: 28.9931,
    longitude: 77.0151,
    averageRisk: 0.55,
    riskLevel: "Medium",
    totalReports: 33,
    intensity: 55,
    predictionTrend: "+4%"
  },
  {
    locationName: "Rohtak",
    latitude: 28.8955,
    longitude: 76.6066,
    averageRisk: 0.57,
    riskLevel: "Medium",
    totalReports: 41,
    intensity: 57,
    predictionTrend: "+4%"
  },
  {
    locationName: "Chhapra",
    latitude: 25.7796,
    longitude: 84.7499,
    averageRisk: 0.6,
    riskLevel: "Medium",
    totalReports: 28,
    intensity: 60,
    predictionTrend: "+6%"
  },
  {
    locationName: "Siwan",
    latitude: 26.2207,
    longitude: 84.3561,
    averageRisk: 0.56,
    riskLevel: "Medium",
    totalReports: 26,
    intensity: 56,
    predictionTrend: "+4%"
  }
];

export const mockTrendsWeekly = [
  { label: "W01", averageRisk: 0.38, reportCount: 42, highRiskCount: 7 },
  { label: "W02", averageRisk: 0.42, reportCount: 47, highRiskCount: 9 },
  { label: "W03", averageRisk: 0.49, reportCount: 54, highRiskCount: 11 },
  { label: "W04", averageRisk: 0.56, reportCount: 61, highRiskCount: 14 },
  { label: "W05", averageRisk: 0.63, reportCount: 68, highRiskCount: 18 },
  { label: "W06", averageRisk: 0.59, reportCount: 64, highRiskCount: 15 }
];

export const mockTrendsMonthly = [
  { label: "Jan", averageRisk: 0.36, reportCount: 162, highRiskCount: 19 },
  { label: "Feb", averageRisk: 0.44, reportCount: 188, highRiskCount: 27 },
  { label: "Mar", averageRisk: 0.52, reportCount: 214, highRiskCount: 36 },
  { label: "Apr", averageRisk: 0.61, reportCount: 243, highRiskCount: 48 },
  { label: "May", averageRisk: 0.69, reportCount: 266, highRiskCount: 63 },
  { label: "Jun", averageRisk: 0.64, reportCount: 231, highRiskCount: 54 }
];

export const mockReports = [
  {
    id: "rep-001",
    reporterName: "Ayesha Rahman",
    reporterEmail: "ayesha@example.com",
    age: 27,
    symptoms: ["fever", "joint pain"],
    notes: "Persistent fever for 3 days.",
    severity: "high",
    locationName: "Dhaka Center",
    latitude: 23.8104,
    longitude: 90.4123,
    weather: { temperature: 32, rainfall: 210, humidity: 83 },
    aiRiskScore: 0.81,
    aiRiskLevel: "High",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.43 },
        { factor: "past_cases", contribution: 0.35 },
        { factor: "humidity", contribution: 0.22 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(1),
    verifiedBy: { id: "admin-1", name: "OutbreakSense Administrator", email: "admin@outbreaksense.ai" },
    createdAt: daysAgo(1)
  },
  {
    id: "rep-002",
    reporterName: "Nadim Hasan",
    reporterEmail: "nadim@example.com",
    age: 34,
    symptoms: ["headache", "rash"],
    notes: "Two family members sick in same area.",
    severity: "medium",
    locationName: "Uttara",
    latitude: 23.8756,
    longitude: 90.3798,
    weather: { temperature: 31, rainfall: 180, humidity: 76 },
    aiRiskScore: 0.66,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "past_cases", contribution: 0.39 },
        { factor: "rainfall", contribution: 0.34 },
        { factor: "temperature", contribution: 0.27 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(2)
  },
  {
    id: "rep-003",
    reporterName: "Farhana Karim",
    reporterEmail: "farhana@example.com",
    age: 22,
    symptoms: ["fever", "nausea"],
    notes: "Symptoms started after heavy rain.",
    severity: "medium",
    locationName: "Mirpur",
    latitude: 23.8224,
    longitude: 90.3655,
    weather: { temperature: 30, rainfall: 170, humidity: 74 },
    aiRiskScore: 0.58,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.41 },
        { factor: "past_cases", contribution: 0.33 },
        { factor: "humidity", contribution: 0.26 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(3)
  },
  {
    id: "rep-004",
    reporterName: "Tariq Mahmood",
    reporterEmail: "tariq@example.com",
    age: 42,
    symptoms: ["body pain", "fatigue"],
    notes: "Area has stagnant water near school.",
    severity: "high",
    locationName: "Mohammadpur",
    latitude: 23.7603,
    longitude: 90.3583,
    weather: { temperature: 32, rainfall: 240, humidity: 84 },
    aiRiskScore: 0.76,
    aiRiskLevel: "High",
    aiPredictionSource: "fallback",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.48 },
        { factor: "past_cases", contribution: 0.31 },
        { factor: "temperature", contribution: 0.21 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(4),
    verifiedBy: { id: "admin-1", name: "OutbreakSense Administrator", email: "admin@outbreaksense.ai" },
    createdAt: daysAgo(4)
  },
  {
    id: "rep-005",
    reporterName: "Aman Yadav",
    reporterEmail: "aman.yadav@example.com",
    age: 29,
    symptoms: ["fever", "joint pain", "fatigue"],
    notes: "Cluster of fever cases near Sector 14.",
    severity: "high",
    locationName: "Gurgaon",
    latitude: 28.4595,
    longitude: 77.0266,
    weather: { temperature: 34, rainfall: 120, humidity: 71 },
    aiRiskScore: 0.72,
    aiRiskLevel: "High",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "past_cases", contribution: 0.4 },
        { factor: "temperature", contribution: 0.33 },
        { factor: "rainfall", contribution: 0.27 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(0)
  },
  {
    id: "rep-006",
    reporterName: "Priya Sharma",
    reporterEmail: "priya.sharma@example.com",
    age: 33,
    symptoms: ["headache", "rash"],
    notes: "Multiple suspected mosquito breeding spots in neighborhood.",
    severity: "medium",
    locationName: "New Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    weather: { temperature: 33, rainfall: 105, humidity: 66 },
    aiRiskScore: 0.64,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "past_cases", contribution: 0.45 },
        { factor: "humidity", contribution: 0.29 },
        { factor: "rainfall", contribution: 0.26 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(1),
    verifiedBy: { id: "admin-2", name: "Regional Analyst", email: "analyst@outbreaksense.ai" },
    createdAt: daysAgo(1)
  },
  {
    id: "rep-007",
    reporterName: "Rohit Kumar",
    reporterEmail: "rohit.kumar@example.com",
    age: 26,
    symptoms: ["fever", "nausea"],
    notes: "Case reported from Ekma block after rainfall.",
    severity: "medium",
    locationName: "Ekma (Bihar)",
    latitude: 25.957,
    longitude: 84.548,
    weather: { temperature: 31, rainfall: 182, humidity: 79 },
    aiRiskScore: 0.62,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.42 },
        { factor: "humidity", contribution: 0.3 },
        { factor: "past_cases", contribution: 0.28 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(2)
  },
  {
    id: "rep-008",
    reporterName: "Neha Singh",
    reporterEmail: "neha.singh@example.com",
    age: 38,
    symptoms: ["body pain", "fever"],
    notes: "Ward-level concentration increasing in Patna urban cluster.",
    severity: "medium",
    locationName: "Patna",
    latitude: 25.5941,
    longitude: 85.1376,
    weather: { temperature: 32, rainfall: 165, humidity: 74 },
    aiRiskScore: 0.59,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "past_cases", contribution: 0.36 },
        { factor: "rainfall", contribution: 0.34 },
        { factor: "temperature", contribution: 0.3 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(3),
    verifiedBy: { id: "admin-2", name: "Regional Analyst", email: "analyst@outbreaksense.ai" },
    createdAt: daysAgo(3)
  },
  {
    id: "rep-009",
    reporterName: "Vikas Chauhan",
    reporterEmail: "vikas.chauhan@example.com",
    age: 31,
    symptoms: ["fever", "headache", "weakness"],
    notes: "Sector 62 offices reporting multiple fever cases.",
    severity: "medium",
    locationName: "Noida",
    latitude: 28.5355,
    longitude: 77.391,
    weather: { temperature: 34, rainfall: 98, humidity: 64 },
    aiRiskScore: 0.61,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "past_cases", contribution: 0.39 },
        { factor: "temperature", contribution: 0.34 },
        { factor: "rainfall", contribution: 0.27 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(0)
  },
  {
    id: "rep-010",
    reporterName: "Aditi Jain",
    reporterEmail: "aditi.jain@example.com",
    age: 28,
    symptoms: ["headache", "rash"],
    notes: "Apartment cluster in Raj Nagar Extension flagged for monitoring.",
    severity: "medium",
    locationName: "Ghaziabad",
    latitude: 28.6692,
    longitude: 77.4538,
    weather: { temperature: 33, rainfall: 110, humidity: 68 },
    aiRiskScore: 0.58,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.38 },
        { factor: "past_cases", contribution: 0.34 },
        { factor: "humidity", contribution: 0.28 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(1),
    verifiedBy: { id: "admin-3", name: "Field Lead", email: "field@outbreaksense.ai" },
    createdAt: daysAgo(1)
  },
  {
    id: "rep-011",
    reporterName: "Manish Dalal",
    reporterEmail: "manish.dalal@example.com",
    age: 36,
    symptoms: ["fever", "body pain"],
    notes: "Village edge pooled-water pockets after rainfall.",
    severity: "medium",
    locationName: "Sonipat",
    latitude: 28.9931,
    longitude: 77.0151,
    weather: { temperature: 33, rainfall: 108, humidity: 67 },
    aiRiskScore: 0.55,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "past_cases", contribution: 0.35 },
        { factor: "rainfall", contribution: 0.34 },
        { factor: "temperature", contribution: 0.31 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(2)
  },
  {
    id: "rep-012",
    reporterName: "Pooja Malik",
    reporterEmail: "pooja.malik@example.com",
    age: 40,
    symptoms: ["high fever", "joint pain"],
    notes: "Urban block with recurring mosquito breeding complaints.",
    severity: "medium",
    locationName: "Rohtak",
    latitude: 28.8955,
    longitude: 76.6066,
    weather: { temperature: 32, rainfall: 118, humidity: 69 },
    aiRiskScore: 0.57,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.37 },
        { factor: "past_cases", contribution: 0.33 },
        { factor: "humidity", contribution: 0.3 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(2),
    verifiedBy: { id: "admin-3", name: "Field Lead", email: "field@outbreaksense.ai" },
    createdAt: daysAgo(2)
  },
  {
    id: "rep-013",
    reporterName: "Shashank Raj",
    reporterEmail: "shashank.raj@example.com",
    age: 25,
    symptoms: ["fever", "nausea"],
    notes: "Chhapra municipal area showing steady rise in fever complaints.",
    severity: "medium",
    locationName: "Chhapra",
    latitude: 25.7796,
    longitude: 84.7499,
    weather: { temperature: 31, rainfall: 176, humidity: 76 },
    aiRiskScore: 0.6,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.41 },
        { factor: "humidity", contribution: 0.31 },
        { factor: "past_cases", contribution: 0.28 }
      ]
    },
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: daysAgo(3)
  },
  {
    id: "rep-014",
    reporterName: "Kiran Kumari",
    reporterEmail: "kiran.kumari@example.com",
    age: 32,
    symptoms: ["body pain", "fever", "rash"],
    notes: "Siwan peri-urban belt reporting suspected vector growth.",
    severity: "medium",
    locationName: "Siwan",
    latitude: 26.2207,
    longitude: 84.3561,
    weather: { temperature: 31, rainfall: 162, humidity: 74 },
    aiRiskScore: 0.56,
    aiRiskLevel: "Medium",
    aiPredictionSource: "ai-engine",
    aiExplainability: {
      topFactors: [
        { factor: "rainfall", contribution: 0.37 },
        { factor: "past_cases", contribution: 0.34 },
        { factor: "temperature", contribution: 0.29 }
      ]
    },
    isVerified: true,
    verifiedAt: daysAgo(4),
    verifiedBy: { id: "admin-3", name: "Field Lead", email: "field@outbreaksense.ai" },
    createdAt: daysAgo(4)
  }
];

export const mockAlerts = [
  {
    _id: "alert-001",
    id: "alert-001",
    title: "High Disease Risk Detected",
    message: "High risk predicted for Dhaka Center. Deploy field response teams.",
    locationName: "Dhaka Center",
    severity: "high",
    riskScore: 0.81,
    isActive: true,
    createdAt: daysAgo(0)
  },
  {
    _id: "alert-002",
    id: "alert-002",
    title: "Risk Escalation",
    message: "Mohammadpur has a rising 7-day risk trend and increased case volume.",
    locationName: "Mohammadpur",
    severity: "high",
    riskScore: 0.76,
    isActive: true,
    createdAt: daysAgo(1)
  },
  {
    _id: "alert-003",
    id: "alert-003",
    title: "Preventive Action Recommended",
    message: "Uttara is near high-risk threshold. Intensify awareness broadcasts.",
    locationName: "Uttara",
    severity: "medium",
    riskScore: 0.66,
    isActive: true,
    createdAt: daysAgo(2)
  },
  {
    _id: "alert-004",
    id: "alert-004",
    title: "Regional Watch: Gurgaon",
    message: "Gurgaon risk trend is rising. Begin targeted fumigation in dense sectors.",
    locationName: "Gurgaon",
    severity: "high",
    riskScore: 0.72,
    isActive: true,
    createdAt: daysAgo(0)
  },
  {
    _id: "alert-005",
    id: "alert-005",
    title: "Advisory: Ekma Cluster",
    message: "Ekma (Bihar) has medium-risk growth. Community awareness campaign recommended.",
    locationName: "Ekma (Bihar)",
    severity: "medium",
    riskScore: 0.62,
    isActive: true,
    createdAt: daysAgo(1)
  },
  {
    _id: "alert-006",
    id: "alert-006",
    title: "NCR Watch: Noida-Ghaziabad Belt",
    message: "Noida and Ghaziabad are showing sustained medium-risk movement this week.",
    locationName: "Noida",
    severity: "medium",
    riskScore: 0.61,
    isActive: true,
    createdAt: daysAgo(0)
  },
  {
    _id: "alert-007",
    id: "alert-007",
    title: "Haryana Corridor Advisory",
    message: "Sonipat and Rohtak require preventive spray and breeding-source checks.",
    locationName: "Sonipat",
    severity: "medium",
    riskScore: 0.57,
    isActive: true,
    createdAt: daysAgo(1)
  },
  {
    _id: "alert-008",
    id: "alert-008",
    title: "Bihar Sentinel Update",
    message: "Chhapra-Siwan belt added to active surveillance with rising trend signals.",
    locationName: "Chhapra",
    severity: "medium",
    riskScore: 0.6,
    isActive: true,
    createdAt: daysAgo(2)
  }
];

export const mockNotifications = [
  {
    id: "notif-1",
    title: "Report verified",
    message: "Ayesha Rahman report in Dhaka Center was marked verified.",
    createdAt: daysAgo(0),
    type: "success"
  },
  {
    id: "notif-2",
    title: "High-risk zone update",
    message: "Mohammadpur crossed the high-risk confidence threshold.",
    createdAt: daysAgo(1),
    type: "danger"
  },
  {
    id: "notif-3",
    title: "Export ready",
    message: "Weekly outbreak PDF export completed successfully.",
    createdAt: daysAgo(2),
    type: "info"
  },
  {
    id: "notif-4",
    title: "Delhi NCR watch",
    message: "New Delhi and Gurgaon added to active monitoring band.",
    createdAt: daysAgo(0),
    type: "danger"
  },
  {
    id: "notif-5",
    title: "Micro-zone expansion",
    message: "Noida, Ghaziabad, Sonipat, Rohtak, Chhapra and Siwan datasets synced for testing.",
    createdAt: daysAgo(0),
    type: "info"
  }
];

const includesText = (value, text) => String(value || "").toLowerCase().includes(text.toLowerCase());

const severityMatches = (reportSeverity, filterSeverity) => {
  if (!filterSeverity) return true;
  return String(reportSeverity || "").toLowerCase() === String(filterSeverity).toLowerCase();
};

const withinDateRange = (createdAt, dateFrom, dateTo) => {
  const sourceDate = new Date(createdAt).getTime();
  if (Number.isNaN(sourceDate)) return false;

  if (dateFrom) {
    const from = new Date(dateFrom).setHours(0, 0, 0, 0);
    if (sourceDate < from) return false;
  }

  if (dateTo) {
    const to = new Date(dateTo).setHours(23, 59, 59, 999);
    if (sourceDate > to) return false;
  }

  return true;
};

export const getMockDashboardBundle = ({ filters, period }) => {
  const activeFilters = filters || {};

  const filteredReports = mockReports.filter(
    (report) =>
      (!activeFilters.location || includesText(report.locationName, activeFilters.location)) &&
      severityMatches(report.severity, activeFilters.severity) &&
      withinDateRange(report.createdAt, activeFilters.dateFrom, activeFilters.dateTo)
  );

  const activeAlerts = mockAlerts.filter((alert) =>
    !activeFilters.location || includesText(alert.locationName, activeFilters.location)
  );

  return {
    stats: {
      totalReports: filteredReports.length || mockDashboardSummary.stats.totalReports,
      highRiskReports:
        filteredReports.filter((item) => item.aiRiskLevel === "High").length ||
        mockDashboardSummary.stats.highRiskReports,
      mediumRiskReports:
        filteredReports.filter((item) => item.aiRiskLevel === "Medium").length ||
        mockDashboardSummary.stats.mediumRiskReports,
      activeAlerts: activeAlerts.length,
      reportsThisWeek:
        filteredReports.filter((item) => {
          const createdAt = new Date(item.createdAt).getTime();
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return createdAt >= cutoff;
        }).length || mockDashboardSummary.stats.reportsThisWeek
    },
    reports: filteredReports,
    alerts: activeAlerts,
    heatPoints: mockHeatPoints,
    trendsCurrent: period === "monthly" ? mockTrendsMonthly : mockTrendsWeekly,
    trendsWeekly: mockTrendsWeekly,
    trendsMonthly: mockTrendsMonthly,
    locationBreakdown: mockDashboardSummary.areaBreakdown,
    notifications: mockNotifications,
    dataSource: "demo-mock"
  };
};
