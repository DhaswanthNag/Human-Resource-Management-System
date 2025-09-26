// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 🔹 Import Routes
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payslipRoutes from "./routes/payslipRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import offerletterRoutes from "./routes/offerletterRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import employees from "./routes/employees.js";
import documents from "./routes/employees.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import workReports from "./routes/workReportRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import profilRoutes from "./routes/profileRoutes.js"
import user from './routes/userRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:3000"
}));


app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/offer-letters", offerletterRoutes); 
app.use("/api/meetings", meetingRoutes);
app.use("/api/employees", employees);
app.use("/api/payslips", payslipRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/documents',documents);
app.use('/api/candidates',candidateRoutes);
app.use("/api/work-reports",workReports);
app.use('/api/leaves', leaveRoutes);
app.use("/api/roles",roleRoutes);
app.use("/api/profiles",profilRoutes);
app.use('/api/users', user);


// 🔹 Health Check
app.get("/", (req, res) => {
  res.send("✅ HRMS API is running...");
});

// 🔹 Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
