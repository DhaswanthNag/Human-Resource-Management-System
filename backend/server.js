// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 🔹 Import Routes
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payslipRoutes from "./routes/payslipRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import offerletterRoutes from "./routes/offerletterRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import workReports from "./routes/workReportRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import profilRoutes from "./routes/profileRoutes.js";
import user from "./routes/userRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve saved offer letter PDFs
const pdfDirectory = path.resolve(__dirname, "uploads", "offer-letters");
app.use("/uploads/offer-letters", express.static(pdfDirectory));

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/offer-letters", offerletterRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/payslips", payslipRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/work-reports", workReports);
app.use("/api/holidays", holidayRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/profiles", profilRoutes);
app.use("/api/users", user);
app.use("/api/attendance", attendanceRoutes);

// 🔹 Health Check
app.get("/", (req, res) => {
  res.send("✅ HRMS API is running...");
});

// 🔹 Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
