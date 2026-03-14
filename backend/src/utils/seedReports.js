import connectDatabase from "../config/db.js";
import Report from "../models/Report.js";
import Prediction from "../models/Prediction.js";
import Location from "../models/Location.js";
import { predictRisk } from "../services/aiService.js";
import { recordPrediction } from "../services/predictionStoreService.js";

const sampleReports = [
  {
    reporterName: "Ayesha Rahman",
    reporterEmail: "ayesha@example.com",
    age: 27,
    symptoms: ["fever", "headache", "joint pain"],
    severity: "medium",
    locationName: "Dhanmondi",
    latitude: 23.7465,
    longitude: 90.376,
    weather: { temperature: 30, rainfall: 170, humidity: 76 }
  },
  {
    reporterName: "Nadim Hasan",
    reporterEmail: "nadim@example.com",
    age: 35,
    symptoms: ["high fever", "rash"],
    severity: "high",
    locationName: "Uttara",
    latitude: 23.8759,
    longitude: 90.3795,
    weather: { temperature: 31, rainfall: 210, humidity: 82 }
  },
  {
    reporterName: "Faria Karim",
    reporterEmail: "faria@example.com",
    age: 21,
    symptoms: ["body pain", "vomiting"],
    severity: "medium",
    locationName: "Mirpur",
    latitude: 23.8223,
    longitude: 90.3654,
    weather: { temperature: 29, rainfall: 165, humidity: 74 }
  },
  {
    reporterName: "Tariq Mahmood",
    reporterEmail: "tariq@example.com",
    age: 42,
    symptoms: ["fever", "nausea"],
    severity: "low",
    locationName: "Gulshan",
    latitude: 23.7925,
    longitude: 90.4078,
    weather: { temperature: 28, rainfall: 130, humidity: 68 }
  },
  {
    reporterName: "Rina Akter",
    reporterEmail: "rina@example.com",
    age: 31,
    symptoms: ["fever", "eye pain"],
    severity: "high",
    locationName: "Mohammadpur",
    latitude: 23.7605,
    longitude: 90.3584,
    weather: { temperature: 32, rainfall: 230, humidity: 84 }
  },
  {
    reporterName: "Aman Yadav",
    reporterEmail: "aman.yadav@example.com",
    age: 29,
    symptoms: ["fever", "joint pain", "fatigue"],
    severity: "high",
    locationName: "Gurgaon",
    latitude: 28.4595,
    longitude: 77.0266,
    weather: { temperature: 34, rainfall: 120, humidity: 71 }
  },
  {
    reporterName: "Priya Sharma",
    reporterEmail: "priya.sharma@example.com",
    age: 33,
    symptoms: ["headache", "rash"],
    severity: "medium",
    locationName: "New Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    weather: { temperature: 33, rainfall: 105, humidity: 66 }
  },
  {
    reporterName: "Rohit Kumar",
    reporterEmail: "rohit.kumar@example.com",
    age: 26,
    symptoms: ["fever", "nausea"],
    severity: "medium",
    locationName: "Ekma (Bihar)",
    latitude: 25.957,
    longitude: 84.548,
    weather: { temperature: 31, rainfall: 182, humidity: 79 }
  },
  {
    reporterName: "Neha Singh",
    reporterEmail: "neha.singh@example.com",
    age: 38,
    symptoms: ["body pain", "fever"],
    severity: "medium",
    locationName: "Patna",
    latitude: 25.5941,
    longitude: 85.1376,
    weather: { temperature: 32, rainfall: 165, humidity: 74 }
  },
  {
    reporterName: "Sakshi Verma",
    reporterEmail: "sakshi.verma@example.com",
    age: 30,
    symptoms: ["high fever", "headache"],
    severity: "medium",
    locationName: "Faridabad",
    latitude: 28.4089,
    longitude: 77.3178,
    weather: { temperature: 33, rainfall: 112, humidity: 69 }
  },
  {
    reporterName: "Vikas Chauhan",
    reporterEmail: "vikas.chauhan@example.com",
    age: 31,
    symptoms: ["fever", "headache", "weakness"],
    severity: "medium",
    locationName: "Noida",
    latitude: 28.5355,
    longitude: 77.391,
    weather: { temperature: 34, rainfall: 98, humidity: 64 }
  },
  {
    reporterName: "Aditi Jain",
    reporterEmail: "aditi.jain@example.com",
    age: 28,
    symptoms: ["headache", "rash"],
    severity: "medium",
    locationName: "Ghaziabad",
    latitude: 28.6692,
    longitude: 77.4538,
    weather: { temperature: 33, rainfall: 110, humidity: 68 }
  },
  {
    reporterName: "Manish Dalal",
    reporterEmail: "manish.dalal@example.com",
    age: 36,
    symptoms: ["fever", "body pain"],
    severity: "medium",
    locationName: "Sonipat",
    latitude: 28.9931,
    longitude: 77.0151,
    weather: { temperature: 33, rainfall: 108, humidity: 67 }
  },
  {
    reporterName: "Pooja Malik",
    reporterEmail: "pooja.malik@example.com",
    age: 40,
    symptoms: ["high fever", "joint pain"],
    severity: "medium",
    locationName: "Rohtak",
    latitude: 28.8955,
    longitude: 76.6066,
    weather: { temperature: 32, rainfall: 118, humidity: 69 }
  },
  {
    reporterName: "Shashank Raj",
    reporterEmail: "shashank.raj@example.com",
    age: 25,
    symptoms: ["fever", "nausea"],
    severity: "medium",
    locationName: "Chhapra",
    latitude: 25.7796,
    longitude: 84.7499,
    weather: { temperature: 31, rainfall: 176, humidity: 76 }
  },
  {
    reporterName: "Kiran Kumari",
    reporterEmail: "kiran.kumari@example.com",
    age: 32,
    symptoms: ["body pain", "fever", "rash"],
    severity: "medium",
    locationName: "Siwan",
    latitude: 26.2207,
    longitude: 84.3561,
    weather: { temperature: 31, rainfall: 162, humidity: 74 }
  }
];

const seedReports = async () => {
  await connectDatabase();

  if (process.argv.includes("--reset")) {
    await Promise.all([Report.deleteMany({}), Prediction.deleteMany({}), Location.deleteMany({})]);
    console.log("Existing reports, predictions, and locations removed.");
  }

  for (const item of sampleReports) {
    const prediction = await predictRisk({
      latitude: item.latitude,
      longitude: item.longitude,
      temperature: item.weather.temperature,
      rainfall: item.weather.rainfall,
      humidity: item.weather.humidity,
      pastCases: 4
    });

    const report = await Report.create({
      reporterName: item.reporterName,
      reporterEmail: item.reporterEmail,
      age: item.age,
      symptoms: item.symptoms,
      severity: item.severity,
      locationName: item.locationName,
      location: {
        type: "Point",
        coordinates: [item.longitude, item.latitude]
      },
      weather: item.weather,
      aiRiskScore: prediction.risk_score,
      aiRiskLevel: prediction.risk_level,
      aiPredictionSource: prediction.source || "ai-engine",
      aiExplainability: {
        topFactors: prediction.explainability?.top_factors || []
      }
    });

    await recordPrediction({
      locationName: item.locationName,
      latitude: item.latitude,
      longitude: item.longitude,
      temperature: item.weather.temperature,
      rainfall: item.weather.rainfall,
      humidity: item.weather.humidity,
      pastCases: 4,
      prediction,
      requestedBy: "report-submission",
      relatedReport: report._id,
      incrementLocationReportCount: true,
      reportDate: report.createdAt
    });
  }

  console.log(`${sampleReports.length} sample reports seeded successfully.`);
  process.exit(0);
};

seedReports().catch((error) => {
  console.error("Report seed failed:", error.message);
  process.exit(1);
});
