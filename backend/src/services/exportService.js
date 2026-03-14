import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

export const buildReportsCsv = (reports) => {
  const rows = reports.map((report) => ({
    id: report._id.toString(),
    reporterName: report.reporterName,
    diseaseType: report.diseaseType || "Unknown",
    age: report.age,
    symptoms: report.symptoms.join(" | "),
    severity: report.severity,
    locationName: report.locationName,
    latitude: report.location.coordinates[1],
    longitude: report.location.coordinates[0],
    aiRiskScore: report.aiRiskScore,
    aiRiskLevel: report.aiRiskLevel,
    aiPredictionSource: report.aiPredictionSource,
    isVerified: report.isVerified,
    verifiedAt: report.verifiedAt,
    createdAt: report.createdAt
  }));

  const parser = new Parser();
  return parser.parse(rows);
};

export const buildReportsPdf = (reports) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 32, size: "A4" });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (error) => reject(error));

    doc.fontSize(18).text("OutbreakSense AI - Disease Reports", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(`Generated at: ${new Date().toLocaleString()}`);
    doc.moveDown();

    reports.slice(0, 200).forEach((report, index) => {
      doc
        .fontSize(10)
        .text(`${index + 1}. ${report.locationName} | ${report.aiRiskLevel} (${report.aiRiskScore})`)
        .text(`Disease: ${report.diseaseType || "Unknown"}`)
        .text(`Reporter: ${report.reporterName}, Age: ${report.age}, Severity: ${report.severity}`)
        .text(`Verified: ${report.isVerified ? "Yes" : "No"} | Prediction Source: ${report.aiPredictionSource}`)
        .text(`Symptoms: ${report.symptoms.join(", ")}`)
        .text(`Date: ${new Date(report.createdAt).toLocaleString()}`)
        .moveDown(0.5);
    });

    doc.end();
  });
