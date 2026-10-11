const db = require('../config/db');





const nodemailer = require('nodemailer');
const createPayslip = async (req, res) => {
  console.log(" Creating payslip with data:", req.body);
  const {
    userId,
    employeeName, employeeRole,
    bankName, bankAccount, ifscCode, pan,
    employeeEPF, employeeESI, specialAllowancePercent,
    workingDays, paidDays, lopDays, baseSalary,
    hraPercent, incomeTaxPercent, pfPercent,
    companyName, companyAddress, payPeriod,
    netTakeHome, totalDeductions, totalCTC
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO payslips (
        user_id, employee_name, employee_role,
        bank_name, bank_account, ifsc_code, pan,
        employee_epf, employee_esi, special_allowance_percent,
        working_days, paid_days, lop_days, base_salary,
        hra_percent, income_tax_percent, pf_percent,
        company_name, company_address, pay_period,
        net_take_home, total_deductions, total_ctc
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23
      ) RETURNING *`,
      [
        userId, employeeName, employeeRole,
        bankName, bankAccount, ifscCode, pan,
        employeeEPF, employeeESI, specialAllowancePercent,
        workingDays, paidDays, lopDays, baseSalary,
        hraPercent, incomeTaxPercent, pfPercent,
        companyName, companyAddress, payPeriod,
        netTakeHome, totalDeductions, totalCTC
      ]
    );

    res.status(201).json({
      message: "Payslip saved by HR!",
      payslip: result.rows[0] //  Return inserted record for confirmation

    });
  } catch (error) {
    console.error("❌Error saving payslip:", error);
    res.status(500).json({ error: "Failed to save payslip" });
  }
};





//  Fetch payslip by userId or userId + employeeName
const getPayslipByIdAndName = async (req, res) => {
  console.log(" Entered getPayslipByIdAndName function");

  try {
    const { userId, employeeName } = req.params;
    console.log(" Incoming Request Params:", req.params);
    console.log(`Extracted userId: ${userId}, employeeName: ${employeeName}`);

    // Validate input
    if (!userId || !employeeName) {
      console.warn("⚠ Missing userId or employeeName");
      return res.status(400).json({ message: "userId and employeeName are required" });
    }

    const query = 'SELECT * FROM payslips WHERE user_id = $1 AND employee_name = $2';
    console.log("Preparing SQL Query:", query);
    console.log(" Query Parameters:", [userId, employeeName]);

    // Run the query
    const result = await db.query(query, [userId, employeeName]);
    console.log(" Raw Query Result:", result);
    console.log(" Query Result Rows:", result.rows);

    // Check if no data returned
    if (result.rows.length === 0) {
      console.warn(`No payslip found for userId: ${userId}, employeeName: ${employeeName}`);
      return res.status(404).json({ message: "Payslip not found" });
    }

    console.log(" Final Data to Send:", result.rows[0]);

    res.json({
      message: "Payslip fetched successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(" Error fetching payslip:", error);
    console.error(" Error Stack Trace:", error.stack);

    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack // REMOVE in production
    });
  }
};




/**
 *  Email helper - sends payslip attachment
 */
const sendPayslipToEmail = async (email, pdfBuffer, name) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: `"HRMS System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Payslip for ${name}`,
    text: `Hi ${name},\n\nPlease find attached your payslip.\n\nBest regards,\nHRMS Team`,
    attachments: [
      {
        filename: "payslip.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
  await transporter.sendMail(mailOptions);
};
const sendPayslip = async (req, res) => {
  try {
    const { email, name, pdfBase64 } = req.body;
    if (!email || !name || !pdfBase64) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    await sendPayslipToEmail(email, pdfBuffer, name);
    res.status(200).json({ message: "Payslip sent to email successfully!" });
  } catch (error) {
    console.error("❌ Error sending payslip email:", error);
    res.status(500).json({ error: "Failed to send payslip email" });
  }
};
// controllers/payslipRequestController.js

// This function handles the payslip request logic
const handlePayslipRequest = async (req, res) => {
  try {
    const userId = req.body.userId ? req.body.userId.trim() : "";
    const employeeName = req.body.employeeName ? req.body.employeeName.trim() : "";
    const payPeriod = req.body.payPeriod ? req.body.payPeriod.trim() : "";
    const requestType = req.body.requestType ? req.body.requestType.trim() : "";

    if (!userId || !employeeName || !payPeriod || requestType !== "payslip_request") {
      console.warn("⚠ Invalid payslip request data:", req.body);
      return res.status(400).json({ message: "Invalid request data." });
    }

    const query = `
      INSERT INTO payslip_requests (user_id, employee_name, pay_period, request_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, requested_at
    `;

    const values = [userId, employeeName, payPeriod, requestType];

    const result = await db.query(query, values);

    console.log(`Payslip request saved with id ${result.rows[0].id} at ${result.rows[0].requested_at}`);

    return res.status(200).json({ message: "Payslip request saved successfully", requestId: result.rows[0].id });
  } catch (error) {
    console.error("❌ Error saving payslip request:", error);
    return res.status(500).json({ message: "Failed to save payslip request" });
  }
};
const getPayslipRequests = async (req, res) => {
  try {
    const query = `
      SELECT id, user_id, employee_name, pay_period, request_type, requested_at
      FROM payslip_requests
      ORDER BY requested_at DESC
    `;
    const result = await db.query(query);
    res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error("❌ Error fetching payslip requests:", error);
    res.status(500).json({ message: "Failed to fetch payslip requests" });
  }
};
// Approve
const approvePayslipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateQuery = `
      UPDATE payslip_requests SET status = 'approved' WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json({ message: "Request approved", request: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Error approving payslip request" });
  }
};
// Deny
const denyPayslipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateQuery = `
      UPDATE payslip_requests SET status = 'denied' WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json({ message: "Request denied", request: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Error denying payslip request" });
  }
};



module.exports = {
  createPayslip,
  getPayslipByIdAndName,
  sendPayslip,
  handlePayslipRequest,
  getPayslipRequests,
  approvePayslipRequest,
  denyPayslipRequest
};