import React, { useState } from "react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import logo from "../../assets/logo.png";
import axios from "axios";
import { toWords } from "number-to-words";

import {
  TextField,
  Button,
} from '@mui/material';
import {
  Download as DownloadIcon,
  RestartAlt as ResetIcon,
  Receipt as PayslipIcon,
  CreditCard,
  Send as SendIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
//const [error, setError] = useState("");

const Section = styled('div')({
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  padding: '24px',
  marginBottom: '24px',
});

const SectionTitle = styled('h2')({
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  color: '#333',
});

const EmployeePayslip = () => {
  // Unified form data state
  const [formData, setFormData] = useState({
    userId: "",
    employeeName: "",
    payPeriod: "",
  });


  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({ userId: "", employeeName: "", payPeriod: "" });
    setPdfBlobUrl(null);
    //setError("");
    setSelectedDate(null);
  };

  const createPayslipPDF = (p) => {
    const toNum = (val) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const basic = toNum(p.base_salary);
    const hra = (toNum(p.hra_percent) / 100) * basic;
    const conveyance = 1300;
    const medical = 1250;
    const specialAllowance = (toNum(p.special_allowance_percent) / 100) * basic;
    const employerEPF = (toNum(p.pf_percent) / 100) * basic;
    const gratuity = 0.0481 * basic;

    const workingDaysCount = toNum(p.working_days);
    const lopDaysCount = toNum(p.lop_days);
    const employeeESI = toNum(p.employee_esi);

    const gross = basic + hra + conveyance + medical + specialAllowance;
    const lopDeduction =
      workingDaysCount > 0 && lopDaysCount > 0
        ? (gross / workingDaysCount) * lopDaysCount
        : 0;

    const adjustedGross = gross - lopDeduction;
    const incomeTax = (toNum(p.income_tax_percent) / 100) * basic;
    const employeeEPFComputed = (toNum(p.pf_percent) / 100) * basic;
    const professionalTax = 300;

    const totalDeductions = incomeTax + employeeEPFComputed + professionalTax;
    const netTakeHome = adjustedGross - totalDeductions;
    const totalCTC = gross + employerEPF + gratuity;

    const doc = new jsPDF();

    // Header and company info
    doc.addImage(logo, "PNG", 110, 20, 80, 30);
    doc.setFontSize(20);
    doc.text(p.company_name || "", 14, 10);
    doc.setFontSize(10);
    doc.text(p.company_address || "", 14, 16);
    doc.setFontSize(18);
    doc.text("Payslip Letter", 14, 26);

    // Employee info
    doc.setFontSize(11);
    doc.text(`Employee Name: ${p.employee_name}`, 14, 34);
    doc.text(`Employee ID: ${p.user_id}`, 14, 40);
    doc.text(`Role: ${p.employee_role}`, 14, 46);
    doc.text(`Pay Period: ${p.pay_period}`, 14, 52);

    // Salary components table
    autoTable(doc, {
      startY: 58,
      head: [["Component", "Monthly (Rs)", "Annual (Rs)"]],
      body: [
        ["Basic Salary", basic.toFixed(2), (basic * 12).toFixed(2)],
        ["HRA", hra.toFixed(2), (hra * 12).toFixed(2)],
        ["Conveyance Allowance", conveyance.toFixed(2), (conveyance * 12).toFixed(2)],
        ["Medical Allowance", medical.toFixed(2), (medical * 12).toFixed(2)],
        ["Special Allowance", specialAllowance.toFixed(2), (specialAllowance * 12).toFixed(2)],
        [
          { content: "Gross Salary", styles: { fontStyle: "bold" } },
          gross.toFixed(2),
          (gross * 12).toFixed(2),
        ],
        ["Employer EPF", employerEPF.toFixed(2), (employerEPF * 12).toFixed(2)],
        ["Gratuity", gratuity.toFixed(2), (gratuity * 12).toFixed(2)],
        [
          { content: "Total CTC", styles: { fontStyle: "bold" } },
          "",
          totalCTC.toFixed(2),
        ],
        ["Income Tax", incomeTax.toFixed(2), (incomeTax * 12).toFixed(2)],
        ["Employee ESI", employeeESI.toFixed(2), (employeeESI * 12).toFixed(2)],
        ["Working Days", workingDaysCount.toFixed(2), ""],
        ["LOP Days", lopDaysCount.toFixed(2), ""],
        ["Employee EPF", employeeEPFComputed.toFixed(2), (employeeEPFComputed * 12).toFixed(2)],
        ["Professional Tax", professionalTax.toFixed(2), (professionalTax * 12).toFixed(2)],
        [
          { content: "Total Deductions", styles: { fontStyle: "bold" } },
          totalDeductions.toFixed(2),
          (totalDeductions * 12).toFixed(2),
        ],
        [
          { content: "Net Take-Home", styles: { fontStyle: "bold" } },
          netTakeHome.toFixed(2),
          (netTakeHome * 12).toFixed(2),
        ],
      ],
    });

    // Page 2 - Bank and other info
    doc.addPage();
    doc.setFontSize(18);
    doc.text(p.company_name || "", 50, 20);
    doc.setFontSize(12);
    doc.setLineWidth(1).line(14, 70, 196, 70);
    doc.text(p.company_address || "", 70, 26);
    doc.setFontSize(14);
    doc.text(`Payslip for the month of ${p.pay_period}`, 14, 66);
    doc.setFontSize(12);
    doc.text(`Employee ID: ${p.user_id}`, 14, 78);
    doc.text(`PAN: ${p.pan || ""}`, 110, 78);
    doc.text(`Employee Name: ${p.employee_name}`, 14, 86);
    doc.text(`Employee Role: ${p.employee_role}`, 110, 86);
    doc.text(`Bank A/c No: ${p.bank_account || ""}`, 14, 94);
    doc.text(`Bank Name: ${p.bank_name || ""}`, 110, 94);
    doc.text(`Worked Days: ${workingDaysCount}`, 14, 102);
    doc.text(`LOP Days: ${lopDaysCount}`, 110, 102);

    // Earnings and Deductions table
    doc.setLineWidth(1).line(14, 109, 196, 109);
    const earningsDeductionsBody = [];
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

    const maxLength = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxLength; i++) {
      earningsDeductionsBody.push([
        ...(earnings[i] || ["", ""]),
        ...(deductions[i] || ["", ""]),
      ]);
    }

    autoTable(doc, {
      startY: 115,
      head: [["Earnings", "Amount (Rs)", "Deductions", "Amount (Rs)"]],
      body: earningsDeductionsBody,
    });
    doc.setLineWidth(1).line(14, 170, 196, 170);

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Net Amount: Rs ${netTakeHome.toFixed(2)}`, 14, finalY + 5);
    doc.text(`Deductions: Rs ${totalDeductions.toFixed(2)}`, 105, finalY + 5);
    doc.setLineWidth(1).line(14, 184, 196, 184);

    doc.text(
      `Net Pay in Words: ${
        typeof toWords === "function" ? toWords(Math.floor(netTakeHome)) : ""
      } Rupees Only`,
      14,
      finalY + 20
    );
    doc.line(14, 200, 196, 200);

    doc.text(`Total CTC: Rs ${totalCTC.toFixed(2)}`, 14, finalY + 34);

    doc.setFontSize(12);
    doc.text(
      `This is a computer-generated payslip and doesn't require a signature.`,
      14,
      finalY + 46
    );

    // Create Blob URL for preview/download
    doc.addImage(logo, 'PNG', 10, 30, 80, 27);
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);
  };

  const generatePayslip = async () => {
    const trimmedId = formData.userId.trim();
    const trimmedName = formData.employeeName.trim();


    if (!trimmedId || !trimmedName) {
      alert("Please enter both Employee ID and Name");
      return;
    }

    try {
      setError("");
      setPdfBlobUrl(null);

      const { data } = await axios.get(`http://localhost:5000/api/payslips/${trimmedId}/${trimmedName}`);

      if (!data) throw new Error("Payslip not found");

      createPayslipPDF(data.data);
    } catch (err) {
      console.error("❌ Error fetching payslip:", err);
      setError(err.response?.data?.message || "Payslip not found");
    }
  };

  const downloadPayslip = () => {
    if (pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = pdfBlobUrl;
      link.download = `${formData.employeeName}_Payslip.pdf`;
      link.click();
    }
  };

  const requestPayslip = async () => {
  if (!selectedDate) {
    alert('Please select a month and year for your payslip request.');
    return;
  }

  const month = selectedDate.toLocaleString('default', { month: 'long' });
  const year = selectedDate.getFullYear();
  const payPeriod = `${month} ${year}`;

  try {
    await axios.post("http://localhost:5000/api/payslips/payslip-request", {
      userId: formData.userId,
      employeeName: formData.employeeName,
      payPeriod: payPeriod,
      requestType: "payslip_request"
    });
    alert(`Your request for the ${payPeriod} payslip has been sent. HR will be notified.`);
  } catch (error) {
    alert("❌ Failed to send payslip request. Please try again.");
  }
};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="flex flex-col bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen">
        {/* App Bar */}
        <div className="bg-blue-900 text-white shadow-md">
          <div className="container mx-auto px-4 py-9 flex items-center relative">
            {/* Title centered */}
            <h1 className="text-xl md:text-3xl font-bold absolute left-1/2 transform -translate-x-1/2">
              Employee Payslip Download
            </h1>

          {/* Pay Period on the right */}
          {/* <div className="ml-auto bg-white text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
            {formData.payPeriod}
          </div> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 flex-grow">
          <div className="flex flex-col lg:flex-row gap-6">
{/* Form Section */}
<div className="bg-white rounded-lg shadow-md p-6 flex-1">
  <SectionTitle>
    <CreditCard className="mr-2" /> Employee Payslip Details
  </SectionTitle>

  <div className="flex flex-wrap -mx-3">
    {/* Employee ID Field */}
    <div className="w-full md:w-1/2 px-3 mb-4">
      <TextField
        fullWidth
        label="Employee ID"
        value={formData.userId}
        onChange={(e) => handleFieldChange('userId', e.target.value)}
        variant="outlined"
      />
    </div>

    {/* Employee Name Field */}
    <div className="w-full md:w-1/2 px-3 mb-4">
      <TextField
        fullWidth
        label="Employee Name"
        value={formData.employeeName}
        onChange={(e) => handleFieldChange('employeeName', e.target.value)}
        variant="outlined"
      />
    </div>

    {error && <p className="text-red-600 mt-3 font-semibold w-full px-3">{error}</p>}

    {/* Generate Payslip Button */}
    <div className="w-full md:w-1/2 px-3 mb-4">
      <Button
        variant="contained"
        onClick={generatePayslip}
        startIcon={<PayslipIcon />}
        size="large"
        fullWidth
      >
        Generate Payslip
      </Button>
    </div>

    {/* Download Button */}
    <div className="w-full md:w-1/2 px-3 mb-4">
      <Button
        variant="contained"
        onClick={downloadPayslip}
        disabled={!pdfBlobUrl}
        startIcon={<DownloadIcon />}
        size="large"
        fullWidth
      >
        Download
      </Button>
    </div>

    {/* Reset Form Button */}
    <div className="w-full md:w-1/2 px-3 mb-4">
      <Button
        variant="contained"
        onClick={resetForm}
        startIcon={<ResetIcon />}
        size="large"
        fullWidth
        color="primary"
      >
        Reset Form
      </Button>
    </div>

    {/* Request Payslip Section */}
    <div className="w-full px-3 mt-16">
      <Section>
        <SectionTitle>
          <PayslipIcon className="mr-2" /> Request Payslip
        </SectionTitle>

        <div className="flex flex-wrap -mx-2 items-center">
          {/* Date Picker */}
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <DatePicker
              views={['year', 'month']}
              label="Select Month and Year"
              minDate={new Date('2000-01-01')}
              maxDate={new Date()}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} helperText={null} fullWidth />}
            />
          </div>

          {/* Request Button */}
          <div className="w-full sm:w-1/2 px-2">
            <Button
              variant="contained"
              onClick={requestPayslip}
              startIcon={<SendIcon />}
              size="large"
              fullWidth
              sx={{ height: '56px' }}
            >
              Request Payslip
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Send a request to the HR/Admin team to receive your payslip for the selected month.
        </p>
      </Section>
    </div>
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
                    style={{ border: 'none' }}
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
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default EmployeePayslip;
