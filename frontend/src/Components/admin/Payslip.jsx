import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";
import { toWords } from 'number-to-words';
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
} from '@mui/material';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  RestartAlt as ResetIcon,
  Receipt as PayslipIcon,
  Visibility as ViewIcon,
  CreditCard,
} from '@mui/icons-material';

//const token = localStorage.getItem('authToken');

const Payslip = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    userId: '',
    employeeRole: '',
    baseSalary: '',
    hraPercent: '',
    incomeTaxPercent: '',
    pfPercent: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    pan: '',
    employeeEPF: '',
    specialAllowancePercent: '',
    payPeriod: 'August 2025',
    payDate: '2025-08-01',
    paidDays: 0,
    lopDays: '',
    workingDays: '',
    earnings: [],
    deductions: [],
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [generatedPayslips, setGeneratedPayslips] = useState([]);
  const [showGeneratedPayslipsTable, setShowGeneratedPayslipsTable] = useState(false);
  const pdfDocRef = useRef(null);
  const sidebarRef = useRef();

  useEffect(() => {
    const storedPayslips = localStorage.getItem('generatedPayslips');
    if (storedPayslips) {
      setGeneratedPayslips(JSON.parse(storedPayslips));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  const handleFieldChange = (field, value) => {
    if (field === "workingDays" || field === "lopDays") {
      const updated = {
        ...formData,
        [field]: value,
      };
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
      employeeName: '',
      userId: '',
      employeeRole: '',
      baseSalary: '',
      hraPercent: '',
      incomeTaxPercent: '',
      pfPercent: '',
      bankName: '',
      bankAccount: '',
      ifscCode: '',
      pan: '',
      employeeEPF: 0,
      employeeESI: 0,
      payPeriod: 'August 2025',
      payDate: '2025-08-01',
      workingDays: '',
      paidDays: '',
      lopDays: '',
      earnings: [],
      deductions: [],
    });
    setPdfBlobUrl(null);
    pdfDocRef.current = null;
  };

  const generatePayslip = async () => {
    const {
      employeeName,
      userId,
      employeeRole,
      bankName,
      bankAccount,
      ifscCode,
      pan,
      employeeEPF,
      employeeESI,
      specialAllowancePercent,
      workingDays,
      paidDays,
      lopDays,
      baseSalary,
      hraPercent,
      incomeTaxPercent,
      pfPercent,
      companyName = 'AYSQO Technology Solutions Pvt Ltd',
      companyAddress = 'HITECH CITY, HYDERABAD',
      payPeriod,
    } = formData;

    const basic = parseFloat(baseSalary || 0);
    const hra = (parseFloat(hraPercent || 0)) * basic / 100;
    const conveyance = 1300;
    const medical = 1250;
    const employerEPF = (parseFloat(pfPercent || 0)) * basic / 100;
    const gratuity = 0.0481 * basic;
    const specialAllowance = (parseFloat(specialAllowancePercent || 0)) * basic / 100;

    const gross = basic + hra + conveyance + medical + specialAllowance;
    const workingDaysCount = parseFloat(workingDays) || 0;
    const paidDaysCount = parseFloat(paidDays) || 0;
    const lopDaysCount = parseFloat(lopDays) || 0;

    let lopDeduction = 0;
    if (workingDaysCount > 0 && lopDaysCount > 0) {
      lopDeduction = (gross / workingDaysCount) * lopDaysCount;
    }
    const adjustedGross = gross - lopDeduction;
    const incomeTax = (parseFloat(incomeTaxPercent || 0)) * basic / 100;
    const employeeEPFComputed = (parseFloat(pfPercent || 0)) * basic / 100;
    const professionalTax = 300;
    const totalDeductions = incomeTax + employeeEPFComputed + professionalTax;
    const netTakeHome = adjustedGross - totalDeductions;
    const totalCTC = gross + employerEPF + gratuity;

    try {
      await axios.post("http://localhost:5000/api/payslips/create", {
        // Explicitly convert and guard all numeric fields
        userId: userId || '',
        employeeName: employeeName || '',
        employeeRole: employeeRole || '',
        bankName: bankName || '',
        bankAccount: bankAccount || '',
        ifscCode: ifscCode || '',
        pan: pan || '',
        employeeEPF: employeeEPF ? parseFloat(employeeEPF) : 0,
        employeeESI: employeeESI ? parseFloat(employeeESI) : 0,
        specialAllowancePercent: specialAllowancePercent ? parseFloat(specialAllowancePercent) : 0,
        workingDays: workingDays ? parseInt(workingDays) : 0,
        paidDays: paidDays ? parseInt(paidDays) : 0,
        lopDays: lopDays ? parseInt(lopDays) : 0,
        baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
        hraPercent: hraPercent ? parseFloat(hraPercent) : 0,
        incomeTaxPercent: incomeTaxPercent ? parseFloat(incomeTaxPercent) : 0,
        pfPercent: pfPercent ? parseFloat(pfPercent) : 0,
        companyName: companyName || '',
        companyAddress: companyAddress || '',
        payPeriod: payPeriod || '',
        netTakeHome: netTakeHome || 0,
        totalDeductions: totalDeductions || 0,
        totalCTC: totalCTC || 0,
        gross: gross || 0,
        employerEPF: employerEPF || 0,
        gratuity: gratuity || 0,
      }/*, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }*/);
      console.log("✅ Payslip saved in DB");
    } catch (err) {
      console.error("❌ Error saving payslip to DB:", err);
    }

    // PDF GENERATION
    const doc = new jsPDF();

    doc.addImage(logo, 'PNG', 110, 20, 80, 27);
    doc.setFontSize(20);
    doc.text(companyName, 14, 10);
    doc.setFontSize(10);
    doc.text(companyAddress, 14, 16);
    doc.setFontSize(18);
    doc.text('Payslip Letter', 14, 26);
    doc.setFontSize(11);
    doc.text(`Employee Name: ${employeeName}`, 14, 34);
    doc.text(`Employee ID: ${userId}`, 14, 40);
    doc.text(`Role: ${employeeRole}`, 14, 46);
    doc.text(`Pay Period: ${payPeriod}`, 14, 52);

    autoTable(doc, {
      startY: 58,
      head: [['Component', 'Monthly (Rs)', 'Annual (Rs)']],
      body: [
        ['Basic Salary', basic.toFixed(2), (basic * 12).toFixed(2)],
        ['HRA', hra.toFixed(2), (hra * 12).toFixed(2)],
        ['Conveyance Allowance', conveyance.toFixed(2), (conveyance * 12).toFixed(2)],
        ['Medical Allowance', medical.toFixed(2), (medical * 12).toFixed(2)],
        ['Special Allowance', specialAllowance.toFixed(2), (specialAllowance * 12).toFixed(2)],
        [
          { content: 'Gross Salary', styles: { fontStyle: 'bold' } },
          gross.toFixed(2),
          (gross * 12).toFixed(2),
        ],
        ['Employer EPF', employerEPF.toFixed(2), (employerEPF * 12).toFixed(2)],
        ['Gratuity', gratuity.toFixed(2), (gratuity * 12).toFixed(2)],
        [
          { content: 'Total CTC', styles: { fontStyle: 'bold' } },
          '',
          totalCTC.toFixed(2),
        ],
        ['Income Tax', incomeTax.toFixed(2), (incomeTax * 12).toFixed(2)],
        ['Employee ESI', (employeeESI ? parseFloat(employeeESI) : 0).toFixed(2), ((employeeESI ? parseFloat(employeeESI) : 0) * 12).toFixed(2)],
        ['Working Days', workingDaysCount.toFixed(2), (workingDaysCount * 12).toFixed(2)],
        ['Paid Days', paidDaysCount.toFixed(2), (paidDaysCount * 12).toFixed(2)],
        ['LOP Days', lopDaysCount.toFixed(2), (lopDaysCount * 12).toFixed(2)],
        ['Employee EPF', employeeEPFComputed.toFixed(2), (employeeEPFComputed * 12).toFixed(2)],
        ['Professional Tax', professionalTax.toFixed(2), (professionalTax * 12).toFixed(2)],
        [
          { content: 'Total Deductions', styles: { fontStyle: 'bold' } },
          totalDeductions.toFixed(2),
          (totalDeductions * 12).toFixed(2),
        ],
        [
          { content: 'Net Take-Home', styles: { fontStyle: 'bold' } },
          netTakeHome.toFixed(2),
          (netTakeHome * 12).toFixed(2),
        ],
      ],
    });

    doc.addPage();

    doc.setFontSize(18);
    doc.text(companyName, 50, 20);
    doc.setFontSize(12);
    doc.text(companyAddress, 70, 26);

    doc.setFontSize(14);
    doc.text(`Payslip for the month of ${payPeriod}`, 14, 66);

    doc.setLineWidth(1);
    doc.line(14, 70, 196, 70);

    doc.setFontSize(12);
    doc.text(`Employee ID           :  ${userId}`, 14, 78);
    doc.text(`PAN                    :  ${pan}`, 110, 78);

    doc.text(`Employee Name     :  ${employeeName}`, 14, 86);
    doc.text(`Employee Role     :  ${employeeRole}`, 110, 86);

    doc.text(`Bank A/c No         :  ${bankAccount}`, 14, 94);
    doc.text(`Bank Name           :  ${bankName}`, 110, 94);

    doc.text(`Worked Days        : ${workingDays}`, 14, 102);
    doc.text(`LOP Days           :  ${lopDays}`, 110, 102);

    doc.setLineWidth(1);
    doc.line(14, 109, 196, 109);

    const earnings = [
      ['Basic', basic.toFixed(2)],
      ['HRA', hra.toFixed(2)],
      ['Conveyance', conveyance.toFixed(2)],
      ['Medical Allowance', medical.toFixed(2)],
      ['Special Allowance', specialAllowance.toFixed(2)],
    ];

    const deductions = [
      ['Income Tax', incomeTax.toFixed(2)],
      ['Employee EPF', employeeEPFComputed.toFixed(2)],
      ['Professional Tax', professionalTax.toFixed(2)],
    ];

    const tableBody = [];
    const maxRows = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      const earning = earnings[i] || ['', ''];
      const deduction = deductions[i] || ['', ''];
      tableBody.push([
        earning[0], earning[1],
        deduction[0], deduction[1],
      ]);
    }

    autoTable(doc, {
      startY: 115,
      head: [['Earnings', 'Amount (Rs)', 'Deductions', 'Amount (Rs)']],
      body: tableBody,
      styles: { fontSize: 12 },
    });

    doc.setLineWidth(1);
    doc.line(14, 170, 196, 170);

    let finalY = (doc.lastAutoTable?.finalY || 170) + 10;
    const netPayInWords = toWords(Math.floor(netTakeHome)) + ' Rupees Only';
    doc.setFontSize(12);
    doc.text(`Net Amount                     :   Rs ${netTakeHome.toFixed(2)}`, 14, finalY + 5);
    doc.text(`Deductions                     :   Rs ${totalDeductions.toFixed(2)}`, 105, finalY + 5);

    doc.setLineWidth(1);
    doc.line(14, 184, 196, 184);

    doc.text(`Net Pay in Words: ${netPayInWords}`, 14, finalY + 20);
    doc.setLineWidth(1);
    doc.line(14, 200, 196, 200);

    doc.text(`Total CTC: Rs ${totalCTC.toFixed(2)}`, 14, finalY + 34);

    doc.setFontSize(12);
    doc.text(`This is a computer-generated payslip and doesn't require a signature.`, 14, finalY + 46);

    doc.addImage(logo, 'PNG', 10, 30, 80, 27);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);
    pdfDocRef.current = doc;

    const fileBlob = doc.output("blob");
    const fileUrl = URL.createObjectURL(fileBlob);

    setGeneratedPayslips((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        userId: formData.userId,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        fileUrl: fileUrl,
      }
    ]);

    const newPayslip = {
      id: Date.now(),
      userId: formData.userId,
      month: formData.payPeriod,
      fileUrl: URL.createObjectURL(blob),
    };

    const updatedPayslips = [...generatedPayslips, newPayslip];
    setGeneratedPayslips(updatedPayslips);
    localStorage.setItem("generatedPayslips", JSON.stringify(updatedPayslips));
  };

  const downloadPayslip = () => {
    if (pdfDocRef.current) {
      const { employeeName, payPeriod, userId } = formData;
      pdfDocRef.current.save(`${employeeName}_Payslip_${payPeriod}_${userId}.pdf`);
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen">
      {/* App Bar */}
      <div className="bg-[#1a237e] text-white shadow-md">
        <div className="container mx-auto px-4 py-5 flex items-center relative">
          {/* Title centered */}
          <h1 className="text-xl md:text-2xl font-semibold absolute left-1/2 transform -translate-x-1/2">
            Admin Payslip Management
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
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ease-in-out ${!showGeneratedPayslipsTable
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
              onClick={() => setShowGeneratedPayslipsTable(false)}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ease-in-out ${showGeneratedPayslipsTable
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
              onClick={() => setShowGeneratedPayslipsTable(true)}
            >
              <HistoryIcon className="w-5 h-5" />
              <span>Payslip History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        {!showGeneratedPayslipsTable ? (
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
                  onChange={(e) => handleFieldChange('userId', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Employee Name"
                  value={formData.employeeName}
                  onChange={(e) => handleFieldChange('employeeName', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Employee Role"
                  value={formData.employeeRole}
                  onChange={(e) => handleFieldChange('employeeRole', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Bank Account No"
                  value={formData.bankAccount}
                  onChange={(e) => handleFieldChange('bankAccount', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={formData.ifscCode}
                  onChange={(e) => handleFieldChange('ifscCode', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="PAN"
                  value={formData.pan}
                  onChange={(e) => handleFieldChange('pan', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Basic Salary (₹)"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => handleFieldChange('baseSalary', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="HRA (%)"
                  type="number"
                  value={formData.hraPercent}
                  onChange={(e) => handleFieldChange('hraPercent', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Income Tax (%)"
                  type="number"
                  value={formData.incomeTaxPercent}
                  onChange={(e) => handleFieldChange('incomeTaxPercent', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Provident Fund (%)"
                  type="number"
                  value={formData.pfPercent}
                  onChange={(e) => handleFieldChange('pfPercent', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Special Allowance (%)"
                  value={formData.specialAllowancePercent}
                  onChange={(e) => handleFieldChange('specialAllowancePercent', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Working Days"
                  value={formData.workingDays}
                  onChange={(e) => handleFieldChange('workingDays', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="LOP Days"
                  value={formData.lopDays}
                  onChange={(e) => handleFieldChange('lopDays', e.target.value)}
                  variant="outlined"
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
                  onClick={downloadPayslip}
                  disabled={!pdfBlobUrl}
                  startIcon={<DownloadIcon />}
                  size="large"
                >
                  Download
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
        ) : (
          /* Payslip History Section */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">
              Generated Payslips History
            </h2>
            <hr className="my-4" />

            {generatedPayslips.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No payslips generated yet. Generate your first payslip to see it listed here.
              </p>
            ) : (
              <TableContainer component={Paper} className="border border-gray-200 rounded-lg">
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
                        <TableCell>{payslip.userId || payslip.userId}</TableCell>
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
        )}
      </div>
    </div>
  );
};

export default Payslip;
