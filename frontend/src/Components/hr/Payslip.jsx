import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";
import { toWords } from "number-to-words";
import axios from "axios";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Home as HomeIcon,
  History as HistoryIcon,
  RestartAlt as ResetIcon,
  Receipt as PayslipIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  CreditCard,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";

const HRPayslip = () => {
  const [formData, setFormData] = useState({
    employeeName: "",
    userId: "",
    employeeRole: "",
    baseSalary: "",
    hraPercent: "",
    incomeTaxPercent: "",
    pfPercent: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    pan: "",
    employeeEPF: "",
    specialAllowancePercent: "",
    payPeriod: "August 2025",
    payDate: "2025-08-01",
    paidDays: 0,
    lopDays: "",
    workingDays: "",
    earnings: [],
    deductions: [],
    employeeEmail: "",
  });

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [generatedPayslips, setGeneratedPayslips] = useState([]);
  const [showGeneratedPayslipsTable, setShowGeneratedPayslipsTable] = useState(
    false
  );
  const [showRequestedPayslipsTable, setShowRequestedPayslipsTable] = useState(
    false
  );
  const [requestedPayslips, setRequestedPayslips] = useState([]);

  const pdfDocRef = useRef(null);

  useEffect(() => {
    const storedPayslips = localStorage.getItem("generatedPayslips");
    if (storedPayslips) {
      setGeneratedPayslips(JSON.parse(storedPayslips));
    }
  }, []);

  // New useEffect to fetch payslip requests when the tab is active
  useEffect(() => {
  if (showRequestedPayslipsTable) {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/payslips/requested-payslips');
        // Adjust field names to match backend fields
        const mapped = (response.data.requests || []).map(req => ({
          requestId: req.id,
          userId: req.user_id,
          employeeName: req.employee_name,
          payPeriod: req.pay_period,
          requestDate: req.requested_at ? req.requested_at.substring(0, 10) : "",
        }));
        setRequestedPayslips(mapped);
      } catch (error) {
        console.error("Failed to fetch payslip requests:", error);
      }
    };
    fetchRequests();
  }
}, [showRequestedPayslipsTable]);



  const handleFieldChange = (field, value) => {
    if (field === "workingDays" || field === "lopDays") {
      const updated = { ...formData, [field]: value };
      const working = parseInt(updated.workingDays || 0);
      const lop = parseInt(updated.lopDays || 0);
      updated.paidDays = Math.max(0, working - lop);
      setFormData(updated);
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      employeeName: "",
      userId: "",
      employeeRole: "",
      baseSalary: "",
      hraPercent: "",
      incomeTaxPercent: "",
      pfPercent: "",
      bankName: "",
      bankAccount: "",
      ifscCode: "",
      pan: "",
      employeeEPF: 0,
      employeeESI: 0,
      payPeriod: "August 2025",
      payDate: "2025-08-01",
      workingDays: 0,
      paidDays: 0,
      lopDays: 0,
      earnings: [],
      deductions: [],
      employeeEmail: "",
    });
    setPdfBlob(null);
    setPdfBlobUrl(null);
    pdfDocRef.current = null;
  };

  const generatePayslip = () => {
    const {
      employeeName,
      userId,
      employeeRole,
      bankName,
      bankAccount,
      specialAllowancePercent,
      workingDays,
      paidDays,
      lopDays,
      baseSalary,
      pan,
      employeeESI = 0,
      hraPercent = 0,
      incomeTaxPercent = 0,
      pfPercent = 0,
      companyName = "AYSQO Technology Solutions Pvt Ltd",
      companyAddress = "HITECH CITY, HYDERABAD",
      payPeriod,
    } = formData;

    const basic = parseFloat(baseSalary || 0);
    const hra = (parseFloat(hraPercent) / 100) * basic;
    const conveyance = 1300;
    const medical = 1250;
    const employerEPF = (parseFloat(pfPercent) / 100) * basic;
    const gratuity = 0.0481 * basic;
    const specialAllowance = (parseFloat(specialAllowancePercent) / 100) * basic;

    const gross = basic + hra + conveyance + medical + specialAllowance;
    const workingDaysCount = parseFloat(workingDays) || 0;
    const paidDaysCount = parseFloat(paidDays) || 0;
    const lopDaysCount = parseFloat(lopDays) || 0;

    let lopDeduction = 0;
    if (workingDaysCount > 0 && lopDaysCount > 0) {
      lopDeduction = (gross / workingDaysCount) * lopDaysCount;
    }

    const adjustedGross = gross - lopDeduction;
    const incomeTax = (parseFloat(incomeTaxPercent) / 100) * basic;
    const employeeEPFComputed = (parseFloat(pfPercent) / 100) * basic;
    const professionalTax = 300;
    const totalDeductions = incomeTax + employeeEPFComputed + professionalTax;
    const netTakeHome = adjustedGross - totalDeductions;
    const totalCTC = gross + employerEPF + gratuity;

    const earnings = [
      ["Basic", basic.toFixed(2)],
      ["HRA", hra.toFixed(2)],
      ["Conveyance", conveyance.toFixed(2)],
      ["Medical Allowance", medical.toFixed(2)],
      ["Special Allowance", specialAllowance.toFixed(2)],
    ];
    const deductions = [
      ["Income Tax", incomeTax.toFixed(2)],
      ["Employee EPF", employeeEPFComputed.toFixed(2)],
      ["Professional Tax", professionalTax.toFixed(2)],
    ];

    const tableBody = [];
    const maxRows = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      const earning = earnings[i] || ["", ""];
      const deduction = deductions[i] || ["", ""];
      tableBody.push([earning[0], earning[1], deduction[0], deduction[1]]);
    }

    const doc = new jsPDF();

    // ========== PAGE ONE ==========
    doc.addImage(logo, "PNG", 110, 20, 80, 30);
    doc.setFontSize(20).text(companyName, 14, 10);
    doc.setFontSize(10).text(companyAddress, 14, 16);
    doc.setFontSize(18).text("Payslip Letter", 14, 26);
    doc.setFontSize(11);
    doc.text(`Employee Name: ${employeeName}`, 14, 34);
    doc.text(`Employee ID: ${userId}`, 14, 40);
    doc.text(`Role: ${employeeRole}`, 14, 46);
    doc.text(`Pay Period: ${payPeriod}`, 14, 52);

    autoTable(doc, {
      startY: 58,
      head: [["Component", "Monthly (Rs)", "Annual (Rs)"]],
      body: [
        ["Basic Salary", basic.toFixed(2), (basic * 12).toFixed(2)],
        ["HRA", hra.toFixed(2), (hra * 12).toFixed(2)],
        ["Conveyance Allowance", conveyance.toFixed(2), (conveyance * 12).toFixed(2)],
        ["Medical Allowance", medical.toFixed(2), (medical * 12).toFixed(2)],
        ["Special Allowance", specialAllowance.toFixed(2), (specialAllowance * 12).toFixed(2)],
        [{ content: "Gross Salary", styles: { fontStyle: "bold" } }, gross.toFixed(2), (gross * 12).toFixed(2)],
        ["Employer EPF", employerEPF.toFixed(2), (employerEPF * 12).toFixed(2)],
        ["Gratuity", gratuity.toFixed(2), (gratuity * 12).toFixed(2)],
        [{ content: "Total CTC", styles: { fontStyle: "bold" } }, "", totalCTC.toFixed(2)],
        ["Income Tax", incomeTax.toFixed(2), (incomeTax * 12).toFixed(2)],
        ["Employee ESI", employeeESI.toFixed(2), (employeeESI * 12).toFixed(2)],
        ["Working Days", workingDaysCount.toFixed(2), (workingDaysCount * 12).toFixed(2)],
        ["Paid Days", paidDaysCount.toFixed(2), (paidDaysCount * 12).toFixed(2)],
        ["LOP Days", lopDaysCount.toFixed(2), (lopDaysCount * 12).toFixed(2)],
        ["Employee EPF", employeeEPFComputed.toFixed(2), (employeeEPFComputed * 12).toFixed(2)],
        ["Professional Tax", professionalTax.toFixed(2), (professionalTax * 12).toFixed(2)],
        [{ content: "Total Deductions", styles: { fontStyle: "bold" } }, totalDeductions.toFixed(2), (totalDeductions * 12).toFixed(2)],
        [{ content: "Net Take-Home", styles: { fontStyle: "bold" } }, netTakeHome.toFixed(2), (netTakeHome * 12).toFixed(2)],
      ],
    });

    // ========== PAGE TWO ==========
    doc.addPage();
    doc.setFontSize(18).text(companyName, 50, 20);
    doc.setFontSize(12).text(companyAddress, 70, 26);
    doc.setFontSize(14).text(`Payslip for the month of ${payPeriod}`, 14, 66);
    doc.setLineWidth(1).line(14, 70, 196, 70);

    doc.setFontSize(12);
    doc.text(`Employee ID           :  ${userId}`, 14, 78);
    doc.text(`PAN                   :  ${pan}`, 110, 78);
    doc.text(`Employee Name         :  ${employeeName}`, 14, 86);
    doc.text(`Employee Role         :  ${employeeRole}`, 110, 86);
    doc.text(`Bank A/c No           :  ${bankAccount}`, 14, 94);
    doc.text(`Bank Name             :  ${bankName}`, 110, 94);
    doc.text(`Worked Days           :  ${workingDays}`, 14, 102);
    doc.text(`LOP Days              :  ${lopDays}`, 110, 102);
    doc.setLineWidth(1).line(14, 109, 196, 109);

    autoTable(doc, {
      startY: 115,
      head: [["Earnings", "Amount (Rs)", "Deductions", "Amount (Rs)"]],
      body: tableBody,
      styles: { fontSize: 12 },
    });

    doc.setLineWidth(1).line(14, 170, 196, 170);

    let finalY = (doc.lastAutoTable?.finalY || 170) + 10;

    const netPayInWords = toWords(Math.floor(netTakeHome)) + " Rupees Only";
    doc.setFontSize(12);
    doc.text(`Net Amount                         :   Rs ${netTakeHome.toFixed(2)}`, 14, finalY + 5);
    doc.text(`Deductions                        :   Rs ${totalDeductions.toFixed(2)}`, 105, finalY + 5);
    doc.setLineWidth(1).line(14, 184, 196, 184);

    doc.text(`Net Pay in Words: ${netPayInWords}`, 14, finalY + 20);
    doc.line(14, 200, 196, 200);
    doc.text(`Total CTC: Rs ${totalCTC.toFixed(2)}`, 14, finalY + 34);
    doc.setFontSize(12).text(`This is a computer-generated payslip and doesn't require a signature.`, 14, finalY + 46);

    doc.addImage(logo, 'PNG', 10, 30, 80, 27);

    const blob = doc.output("blob");
    setPdfBlob(blob);
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);
    pdfDocRef.current = doc;
  };
  const handleApprove = async (requestId) => {
  try {
    await axios.post(`http://localhost:5000/api/payslips/requested-payslips/${requestId}/approve`);
    setRequestedPayslips(requestedPayslips.filter(req => req.requestId !== requestId));
  } catch (error) {
    alert("Failed to approve request.");
  }
};

const handleDeny = async (requestId) => {
  try {
    await axios.post(`http://localhost:5000/api/payslips/requested-payslips/${requestId}/deny`);
    setRequestedPayslips(requestedPayslips.filter(req => req.requestId !== requestId));
  } catch (error) {
    alert("Failed to deny request.");
  }
};


  const shareToEmail = async () => {
    if (!formData.employeeEmail) {
      alert("Please enter a valid email first.");
      return;
    }
    if (!pdfBlob) {
      alert("Please generate the payslip first.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1];

      try {
        //const token = localStorage.getItem("token"); // ✅ Ensure token exists

        const res = await axios.post(
          "http://localhost:5000/api/payslips/send-payslip", // ✅ Correct route
          {
            email: formData.employeeEmail,
            name: formData.employeeName,
            pdfBase64: base64String,
          },
          // {
          //   headers: {
          //     Authorization: `Bearer ${token}`, // ✅ Required for authenticateToken middleware
          //     "Content-Type": "application/json",
          //   },
          // }
        );

        alert(res.data.message);
      } catch (err) {
        console.error("Error sending payslip:", err);
        alert("Failed to send payslip.");
      }
    };

    reader.readAsDataURL(pdfBlob);
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen">
      {/* App Bar */}
      <div className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex items-center relative">
          {/* Title centered */}
          <h1 className="text-xl md:text-3xl font-semibold absolute left-1/2 transform -translate-x-1/2">
            HR Payslip Management
          </h1>
          {/* Pay Period on the right */}
          <div className="ml-auto bg-white text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
            {formData.payPeriod}
          </div>
        </div>
      </div>
      {/* Horizontal Navigation Tabs */}
      <div className="bg-white shadow-sm mb-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center border-b border-gray-200">
            <button
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ease-in-out ${!showGeneratedPayslipsTable && !showRequestedPayslipsTable
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
                }`}
              onClick={() => {
                setShowGeneratedPayslipsTable(false);
                setShowRequestedPayslipsTable(false);
              }}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ease-in-out ${showGeneratedPayslipsTable
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
                }`}
              onClick={() => {
                setShowGeneratedPayslipsTable(true);
                setShowRequestedPayslipsTable(false);
              }}
            >
              <HistoryIcon className="w-5 h-5" />
              <span>Payslip History</span>
            </button>
            <button
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ease-in-out ${showRequestedPayslipsTable
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
                }`}
              onClick={() => {
                setShowRequestedPayslipsTable(true);
                setShowGeneratedPayslipsTable(false);
              }}
            >
              <NotificationsIcon className="w-5 h-5" />
              <span>Requested Payslips</span>
              {/* Optional: Add a notification badge here */}
              {requestedPayslips.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold">
                  {requestedPayslips.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        {!showGeneratedPayslipsTable && !showRequestedPayslipsTable ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <CreditCard className="mr-2" /> Employee Payslip Details
              </h2>
              <hr className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.userId}
                  onChange={(e) => handleFieldChange("userId", e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Employee Name"
                  value={formData.employeeName}
                  onChange={(e) =>
                    handleFieldChange("employeeName", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Employee Role"
                  value={formData.employeeRole}
                  onChange={(e) =>
                    handleFieldChange("employeeRole", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={(e) =>
                    handleFieldChange("bankName", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Bank Account No"
                  value={formData.bankAccount}
                  onChange={(e) =>
                    handleFieldChange("bankAccount", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    handleFieldChange("ifscCode", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="PAN"
                  value={formData.pan}
                  onChange={(e) => handleFieldChange("pan", e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Basic Salary (₹)"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) =>
                    handleFieldChange("baseSalary", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="HRA (%)"
                  type="number"
                  value={formData.hraPercent}
                  onChange={(e) =>
                    handleFieldChange("hraPercent", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Income Tax (%)"
                  type="number"
                  value={formData.incomeTaxPercent}
                  onChange={(e) =>
                    handleFieldChange("incomeTaxPercent", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Provident Fund (%)"
                  type="number"
                  value={formData.pfPercent}
                  onChange={(e) =>
                    handleFieldChange("pfPercent", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Special Allowance (%)"
                  value={formData.specialAllowancePercent}
                  onChange={(e) =>
                    handleFieldChange("specialAllowancePercent", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Working Days"
                  value={formData.workingDays}
                  onChange={(e) =>
                    handleFieldChange("workingDays", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="LOP Days"
                  value={formData.lopDays}
                  onChange={(e) => handleFieldChange("lopDays", e.target.value)}
                  variant="outlined"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "16px",
                }}
              >
                <TextField
                  label="Employee Email"
                  value={formData.employeeEmail}
                  onChange={(e) =>
                    handleFieldChange("employeeEmail", e.target.value)
                  }
                  variant="outlined"
                  sx={{ width: "60%" }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <Button
                  variant="contained"
                  onClick={generatePayslip}
                  startIcon={<PayslipIcon />}
                  size="large"
                  className="bg-[#343fbfff] hover:bg-[#1d2da4ff]"
                >
                  Generate Payslip
                </Button>
                <Button
                  variant="outlined"
                  onClick={shareToEmail}
                  disabled={!pdfBlobUrl || !formData.employeeEmail}
                  startIcon={<EmailIcon />}
                  size="large"
                >
                  Email Payslip
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  startIcon={<ResetIcon />}
                  size="large"
                  color="secondary"
                >
                  Reset Form
                </Button>
              </div>
            </div>
            {/* PDF Preview Section */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1 flex flex-col min-h-[600px]">
              <h3 className="text-lg font-semibold mb-4">Payslip Preview</h3>
              {pdfBlobUrl ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden flex-grow">
                  <iframe
                    src={pdfBlobUrl}
                    title="Payslip PDF"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                  />
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6 text-center">
                  <PayslipIcon className="text-6xl text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-500">
                    Payslip Preview
                  </h4>
                  <p className="text-sm text-gray-400">
                    Generate a payslip to see the preview here
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : showGeneratedPayslipsTable ? (
          /* Payslip History Section */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">
              Generated Payslips History
            </h2>
            <hr className="my-4" />
            {generatedPayslips.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No payslips generated yet. Generate your first payslip to see it
                listed here.
              </p>
            ) : (
              <TableContainer
                component={Paper}
                className="border border-gray-200 rounded-lg"
              >
                <Table>
                  <TableHead className="bg-gray-50">
                    <TableRow>
                      <TableCell className="font-bold">ID</TableCell>
                      <TableCell className="font-bold">Employee ID</TableCell>
                      <TableCell className="font-bold">Month</TableCell>
                      <TableCell className="font-bold">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generatedPayslips.map((payslip, index) => (
                      <TableRow key={payslip.id || payslip.payslipId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{payslip.userId}</TableCell>
                        <TableCell>{payslip.month}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            href={payslip.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        ) : (
          /* New Requested Payslips Section */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">
              Requested Payslips
            </h2>
            <hr className="my-4" />
            {requestedPayslips.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No new payslip requests at this time.
              </p>
            ) : (
              <TableContainer component={Paper} className="border border-gray-200 rounded-lg">
                <Table>
                  <TableHead className="bg-gray-50">
                    <TableRow>
                      <TableCell className="font-bold">ID</TableCell>
                      <TableCell className="font-bold">Employee ID</TableCell>
                      <TableCell className="font-bold">Employee Name</TableCell>
                      <TableCell className="font-bold">Pay Period</TableCell>
                      <TableCell className="font-bold">Request Date</TableCell>
                      <TableCell className="font-bold">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requestedPayslips.map((request, index) => (
                      <TableRow key={request.requestId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{request.userId}</TableCell>
                        <TableCell>{request.employeeName}</TableCell>
                        <TableCell>{request.payPeriod}</TableCell>
                        <TableCell>{request.requestDate}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleApprove(request.requestId)}// ✅ You would add an onClick handler here to approve the request
                            // e.g., onClick={() => handleApprove(request.requestId)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => handleDeny(request.requestId)}// ✅ You would add an onClick handler here to deny the request
                            // e.g., onClick={() => handleDeny(request.requestId)}
                          >
                            Deny
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRPayslip;