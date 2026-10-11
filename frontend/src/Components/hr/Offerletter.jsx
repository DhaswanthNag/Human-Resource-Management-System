import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import logo from "../../assets/logo.png";
import { ChevronLeft, ChevronRight, Mail, Send, Eye, Trash2 } from "lucide-react";
import logo2 from "../../assets/logo2.png";

function OfferLetter() {
  // API base URL
  const API_BASE_URL = "http://localhost:5000/api";

  // ðŸ”¹ Draft data (form typing)
  const [draftData, setDraftData] = useState({
    offer_id: "",
    candidate_name: "",
    email: "",
    mobile: "",
    designation: "",
    ctc: "",
    joining_date: "",
    address: "",
    offer_date: new Date().toISOString().split("T")[0],
  });

  // ðŸ”¹ FormData (only updates when Generate Now clicked)
  const [formData, setFormData] = useState({ ...draftData });

  const [currentPage, setCurrentPage] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "Offer Letter from Aysqo Technology Solutions",
    body: "Please find attached your offer letter.",
  });
  const [isSending, setIsSending] = useState(false);
  const [generatedLetters, setGeneratedLetters] = useState([]);
  const [viewMode, setViewMode] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const letterRef = useRef(null);
  const totalPages = 8;

  // Load saved letters from backend
  useEffect(() => {
    fetchOffers();
  }, []);

  // Add this useEffect to clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      generatedLetters.forEach(letter => {
        if (letter.pdf_link && letter.pdf_link.startsWith('blob:')) {
          URL.revokeObjectURL(letter.pdf_link);
        }
      });
    };
  }, [generatedLetters]);

  // Fetch all offers from backend
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/offer-letters`);
      setGeneratedLetters(response.data);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setError("Failed to load offer letters");
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem("generatedOfferLetters");
      if (saved) setGeneratedLetters(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  // Show only the current page
  useEffect(() => {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, index) => {
      if (index === currentPage) {
        page.style.display = 'block';
      } else {
        page.style.display = 'none';
      }
    });
  }, [currentPage]);

  const handleDraftChange = (e) => {
    setDraftData({ ...draftData, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (e) => {
    setEmailData({ ...emailData, [e.target.name]: e.target.value });
  };

  // âœ… Generate Now â†’ update preview + save record to backend
  const handleGenerate = async () => {
    setFormData({ ...draftData });

    try {
      // First generate the PDF to get the actual content
      const { pdfBlob, fileName } = await generatePDF();

      // Create a blob URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const newLetter = {
        offer_id: draftData.offer_id,
        candidate_name: draftData.candidate_name,
        email: draftData.email,
        mobile: draftData.mobile,
        designation: draftData.designation,
        ctc: draftData.ctc,
        joining_date: draftData.joining_date,
        address: draftData.address,
        offer_date: draftData.offer_date,
        pdf_link: pdfUrl,
        pdf_file_name: fileName
      };

      const response = await axios.post(`${API_BASE_URL}/offer-letters`, newLetter);

      // Add to local state with the ID returned from backend
      const savedLetter = {
        id: response.data.id,
        offer_id: response.data.offer_id,
        candidate_name: response.data.candidate_name,
        email: response.data.email,
        mobile: response.data.mobile,
        designation: response.data.designation,
        ctc: response.data.ctc,
        joining_date: response.data.joining_date,
        address: response.data.address,
        offer_date: response.data.offer_date,
        pdf_link: response.data.pdf_link,
        pdf_file_name: response.data.pdf_file_name,
        created_at: response.data.created_at
      };

      setGeneratedLetters([...generatedLetters, savedLetter]);
    } catch (err) {
      console.error("Error saving offer:", err);
      setError("Failed to save offer letter");

      // Fallback to localStorage if API fails
      const fileName = `OfferLetter_${draftData.offer_id || "AYSQO"}.pdf`;
      const newLetter = {
        id: Date.now(),
        offer_id: draftData.offer_id,
        candidate_name: draftData.candidate_name,
        email: draftData.email,
        mobile: draftData.mobile,
        designation: draftData.designation,
        ctc: draftData.ctc,
        joining_date: draftData.joining_date,
        address: draftData.address,
        offer_date: draftData.offer_date,
        pdf_link: "",
        pdf_file_name: fileName,
        created_at: new Date().toISOString()
      };

      setGeneratedLetters([...generatedLetters, newLetter]);
      localStorage.setItem("generatedOfferLetters", JSON.stringify([...generatedLetters, newLetter]));
    }
  };

  // Separate function to generate PDF
  const generatePDF = async () => {
    try {
      const input = letterRef.current;
      if (!input) {
        throw new Error("Letter reference not found");
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pages = input.querySelectorAll(".page");

      // Show all pages temporarily for capture
      pages.forEach(page => {
        page.style.display = 'block';
      });

      for (let i = 0; i < pages.length; i++) {
        try {
          const canvas = await html2canvas(pages[i], {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL("image/png");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          if (i !== 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } catch (pageError) {
          console.error(`Error capturing page ${i + 1}:`, pageError);
          if (i !== 0) pdf.addPage();
          pdf.setFontSize(16);
          pdf.text(`Error loading page ${i + 1}`, 20, 20);
        }
      }

      // Restore original page visibility
      pages.forEach((page, index) => {
        page.style.display = index === currentPage ? 'block' : 'none';
      });

      const fileName = `OfferLetter_${formData.offer_id || "AYSQO"}.pdf`;
      const pdfBlob = pdf.output('blob');

      return { pdfBlob, fileName };
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again or check the console for details.");
      throw err;
    }
  };

  // Update the handleDownload function
  const handleDownload = async () => {
    try {
      const { pdfBlob, fileName } = await generatePDF();

      // Create download link
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

      // Update the PDF link in the database if we have an ID
      if (generatedLetters.length > 0) {
        const latestId = generatedLetters[generatedLetters.length - 1].id;
        const pdfUrl = URL.createObjectURL(pdfBlob);

        try {
          await axios.put(`${API_BASE_URL}/offer-letters/${latestId}`, {
            ...generatedLetters[generatedLetters.length - 1],
            pdf_link: pdfUrl,
            pdf_file_name: fileName
          });

          // Update local state with the updated PDF link
          const updatedLetters = [...generatedLetters];
          updatedLetters[updatedLetters.length - 1].pdf_link = pdfUrl;
          updatedLetters[updatedLetters.length - 1].pdf_file_name = fileName;
          setGeneratedLetters(updatedLetters);
        } catch (err) {
          console.error("Error updating PDF link:", err);
        }
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  // Add this function to handle downloading specific offer letters
  const handleDownloadSpecific = async (letter) => {
    try {
      // Set the form data to the selected letter
      setFormData({
        offer_id: letter.offer_id,
        candidate_name: letter.candidate_name,
        email: letter.email,
        mobile: letter.mobile || "",
        designation: letter.designation,
        ctc: letter.ctc,
        joining_date: letter.joining_date,
        address: letter.address || "",
        offer_date: letter.offer_date || new Date().toISOString().split("T")[0],
      });

      // Wait a moment for the form data to update, then download
      setTimeout(() => {
        handleDownload();
      }, 100);
    } catch (err) {
      console.error("Error setting up download:", err);
      alert("Failed to download offer letter. Please try again.");
    }
  };

  // âœ… Send Mail
  const handleSendMail = () => {
    setEmailData({
      ...emailData,
      to: formData.email || "",
      subject: `Offer Letter from Aysqo Technology Solutions - ${formData.candidate_name}`,
      body: `Dear ${formData.candidate_name},\n\nPlease find attached your offer letter for the position of ${formData.designation}.\n\nBest regards,\nAysqo HR Team`,
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
  setIsSending(true);
  try {
    // Generate the PDF Blob and filename
    const { pdfBlob, fileName } = await generatePDF();

    // Prepare FormData for POST
    const formDataToSend = new FormData();
    formDataToSend.append('to', emailData.to);
    formDataToSend.append('subject', emailData.subject);
    formDataToSend.append('body', emailData.body);
    formDataToSend.append('pdf', pdfBlob, fileName); // Attach PDF

    // POST to backend email API
    await axios.post("http://localhost:5000/api/offer-letters/send-email", formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    alert(`Email with PDF attachment sent successfully to ${emailData.to}`);
    setShowEmailModal(false);
  } catch (err) {
    console.error("Error sending email:", err);
    alert("Failed to send email. Please try again.");
  } finally {
    setIsSending(false);
  }
};


  const nextPage = () => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 0 && setCurrentPage(currentPage - 1);

  const deleteLetter = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer letter record?")) {
      try {
        await axios.delete(`${API_BASE_URL}/offer-letters/${id}`);
        setGeneratedLetters(generatedLetters.filter((letter) => letter.id !== id));
      } catch (err) {
        console.error("Error deleting offer:", err);
        // Fallback to local state if API fails
        setGeneratedLetters(generatedLetters.filter((letter) => letter.id !== id));
        localStorage.setItem("generatedOfferLetters", JSON.stringify(generatedLetters.filter((letter) => letter.id !== id)));
      }
    }
  };

  const viewLetter = (letter) => {
    setDraftData({
      offer_id: letter.offer_id,
      candidate_name: letter.candidate_name,
      email: letter.email,
      mobile: letter.mobile || "",
      designation: letter.designation,
      ctc: letter.ctc,
      joining_date: letter.joining_date,
      address: letter.address || "",
      offer_date: letter.offer_date || new Date().toISOString().split("T")[0],
    });
    setFormData({
      offer_id: letter.offer_id,
      candidate_name: letter.candidate_name,
      email: letter.email,
      mobile: letter.mobile || "",
      designation: letter.designation,
      ctc: letter.ctc,
      joining_date: letter.joining_date,
      address: letter.address || "",
      offer_date: letter.offer_date || new Date().toISOString().split("T")[0],
    });
    setViewMode("form");
  };

  return (

    <div className="p-0 sm:p-0 bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen">

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
          <button onClick={() => setError("")} className="absolute top-0 right-0 p-2">
            &times;
          </button>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Send Offer Letter via Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="email" name="to" value={emailData.to} onChange={handleEmailChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" name="subject" value={emailData.subject} onChange={handleEmailChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea name="body" value={emailData.body} onChange={handleEmailChange} rows="5" className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleSendEmail} disabled={isSending} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                  {isSending ? "Sending..." : "Send"} <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="flex items-center justify-between py-5 bg-blue-900 mb-8 px-6">
          {/* Centered Title */}
          <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
              Offer Letter Generator
            </h1>
          </div>
        </header>

      {/* VIEW TOGGLE */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg shadow flex">
          <button onClick={() => setViewMode("form")} className={`px-4 py-2 rounded-l-lg ${viewMode === "form" ? "bg-blue-700 text-white" : "bg-gray-100"}`}>
            Create Offer Letter
          </button>
          <button onClick={() => setViewMode("table")} className={`px-4 py-2 rounded-r-lg ${viewMode === "table" ? "bg-green-600 text-white" : "bg-gray-100"}`}>
            Generated Letters ({generatedLetters.length})
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Generated Offer Letters</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : generatedLetters.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No offer letters generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 border">Offer ID</th>
                    <th className="px-3 py-2 border">Name</th>
                    <th className="px-3 py-2 border">Email</th>
                    <th className="px-3 py-2 border">Mobile</th>
                    <th className="px-3 py-2 border">Designation</th>
                    <th className="px-3 py-2 border">CTC</th>
                    <th className="px-3 py-2 border">Joining Date</th>
                    <th className="px-3 py-2 border">PDF Link</th>
                    <th className="px-3 py-2 border">Created Date</th>
                    <th className="px-3 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedLetters.map((letter) => (
                    <tr key={letter.id}>
                      <td className="border px-3 py-2">{letter.offer_id}</td>
                      <td className="border px-3 py-2">{letter.candidate_name}</td>
                      <td className="border px-3 py-2">{letter.email}</td>
                      <td className="border px-3 py-2">{letter.mobile}</td>
                      <td className="border px-3 py-2">{letter.designation}</td>
                      <td className="border px-3 py-2">{letter.ctc}</td>
                      <td className="border px-3 py-2">{letter.joining_date}</td>
                      <td className="border px-3 py-2">
                        {letter.pdf_link ? (
                          <button
                            onClick={() => handleDownloadSpecific(letter)}
                            className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                          >
                            {letter.pdf_file_name || 'Download PDF'}
                          </button>
                        ) : (
                          "Not generated"
                        )}
                      </td>
                      <td className="border px-3 py-2">{new Date(letter.created_at || letter.date).toLocaleDateString()}</td>
                      <td className="border px-3 py-2 flex gap-2">
                        <button onClick={() => viewLetter(letter)} className="text-blue-600"><Eye size={18} /></button>
                        <button onClick={() => deleteLetter(letter.id)} className="text-red-600"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT FORM */}
          <div className="bg-gray-300 p-6 rounded-lg shadow sticky top-4 h-fit">
            <h2 className="text-xl font-bold mb-4">Offer Letter Form</h2>
            <div className="grid grid-cols-1 gap-3">
              <input type="text" name="offer_id" placeholder="Offer ID" value={draftData.offer_id} onChange={handleDraftChange} className="border p-2 rounded" />
              <input type="text" name="candidate_name" placeholder="Full Name" value={draftData.candidate_name} onChange={handleDraftChange} className="border p-2 rounded" />
              <input type="email" name="email" placeholder="Email" value={draftData.email} onChange={handleDraftChange} className="border p-2 rounded" />
              <input type="text" name="mobile" placeholder="Mobile" value={draftData.mobile} onChange={handleDraftChange} className="border p-2 rounded" />
              <input type="text" name="designation" placeholder="Designation" value={draftData.designation} onChange={handleDraftChange} className="border p-2 rounded" />
              <input type="text" name="ctc" placeholder="CTC" value={draftData.ctc} onChange={handleDraftChange} className="border p-2 rounded" />
              <input type="date" name="joining_date" value={draftData.joining_date} onChange={handleDraftChange} className="border p-2 rounded" />
              <textarea name="address" placeholder="Address" value={draftData.address} onChange={handleDraftChange} className="border p-2 rounded" rows="3" />
            </div>
            <button onClick={handleGenerate} className="mt-4 w-full bg-purple-600 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-700">
              Generate Now
            </button>
          </div>

          {/* RIGHT PREVIEW */}
          <div className="bg-gray-300 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4 bg-gray-100 p-2 rounded">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`p-1 rounded ${currentPage === 0 ? "text-gray-400 cursor-not-allowed" : "text-black hover:bg-gray-200"}`}
              >
                <ChevronLeft size={24} />
              </button>
              <span className="font-medium">Page {currentPage + 1} of {totalPages}</span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className={`p-1 rounded ${currentPage === totalPages - 1 ? "text-gray-400 cursor-not-allowed" : "text-black hover:bg-gray-200"}`}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div ref={letterRef} className="overflow-y-auto h-[calc(100vh-200px)] border rounded-lg">
              {/* Your page content remains the same */}
              {/* PAGE 1 */}
              <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                  <img src={logo2} alt="Watermark" className="w-[500px]" />
                </div>
                <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                <div className="text-right mb-4">
                  <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/ {formData.offer_id || "-------"}
                  </p>
                  <p>{formData.offer_date}</p>
                </div>

                <h1 className="text-xl font-bold text-center mb-6">Letter Of Offer</h1>

                <p className="mb-2">
                  <span className="font-semibold">{formData.candidate_name || "-------"}</span><br />
                  Address: {formData.address || "--------------------------------------"}
                </p>

                <p className="mt-6">Dear <span className="font-semibold">{formData.candidate_name || "------------"}</span>,</p>
                <p className="mt-4">Welcome to Aysqo Technology Solutions Pvt. Ltd.</p>
                <p className="font-bold mt-2">Congratulations! We welcome you on board.</p>
                <p className="mt-4 text-justify">
                  Thank you for showing interest in being a part of our organization. We are delighted to inform you
                  that, following your successful interview process, <span className="font-semibold">AYSQO TECHNOLOGY SOLUTIONS PVT LTD</span>
                  is offering you a position with our team. On behalf of Aysqo Technology Solutions Pvt. Ltd.,
                  I am pleased to formally extend this offer of employment.
                </p>

                <p className="mt-4 text-justify">
                  Upon your acceptance, you will be appointed as <span className="font-semibold">
                  {formData.designation || "Associate Software Engineer (ASE)"}</span>, with your joining date scheduled for
                  <span className="font-semibold"> {formData.joining_date || "---------"}</span> at our office premises.
                </p>

                <p className="mt-4 text-justify">
                  This offer is contingent upon the standard terms and conditions of employment set forth by Aysqo Technology
                  Solutions and will be governed by the company's policies, rules, and guidelines. Upon joining, you will be
                  required to sign and adhere to the Employee Non-Disclosure, Non-Solicitation, and Non-Competition Agreement.
                  Your total annual Cost to Company (CTC) will be <span className="font-semibold">
                  INR {formData.ctc || "---------"}</span> and a detailed breakup of your CTC will be provided at the time of joining.
                </p>

                <p className="mt-4 text-justify">
                  This employment offer from Aysqo Technology Solutions Pvt Ltd is conditional upon the successful verification
                  of the information you have provided.
                </p>

                <h2 className="mt-6 font-semibold">By accepting this offer, you also acknowledge and confirm that â€“</h2>
                <ol className="list-decimal ml-6 mt-2 space-y-2 text-justify">
                  <li>You have lawfully ended your employment with your previous employer (if applicable), in accordance with their terms
                  and conditions.</li>
                  <li>You confirm that you have no outstanding contractual obligations from any previous employment that would hinder your
                  ability to undertake responsibilities or accept this position with the Company. Aysqo Technology Solutions Pvt Ltd will not
                  be held responsible for any dues or liabilities arising from the termination of your prior employment. </li>
                  <li>Additionally, you confirm that you are not bringing any intellectual property to the Company for which you do not hold sole
                  ownership rights.</li>
                  <li>This offer will remain valid for a period of 2 days from the date of this letter. If you choose to accept the offer, please
                  confirm your acceptance by email or telephone within 1 day of receiving this letter and submit a signed copy of this
                  document by post. If we do not receive a response within this time frame, the offer will be considered withdrawn, and the
                  Company will not be obligated to keep the position open</li>
                  <li>You will undergo training under your designated Team Lead/Developer/Senior.</li>
                  <li>Your official joining date will be <span className="font-semibold"> {formData.joining_date || "---------"}</span>. In case of changes, inform the Company in advance.</li>
                </ol><br /><br /><br />

                <div className="mt-10 text-sm text-center">
                  <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                  <p>4th Floor, Bizness Square, Opp. Hitec Entrance, Jubilee Hills, Hyderabad</p>
                  <p>
                    Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a>
                  </p>
                  <p>
                    Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a>
                  </p>
                </div>
              </div>

              {/* PAGE 2 - Annexure I */}
              <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                  <img src={logo2} alt="Watermark" className="w-[500px]" />
                </div>
                <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                <div className="text-right mb-4">
                  <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                </div>

                <h1 className="text-lg font-bold text-center mb-6">Annexure I</h1>

                <p className="mb-2">
                  <b>1.</b> You need to furnish the following Documents at the time of joining Aysqo.
                </p>
                <p className="mb-4">
                  <b>NOTE:</b> Joining will not happen without these documents.
                </p>

                <table className="w-full border border-black text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 font-bold w-6">A</td>
                      <td className="border border-black p-2">
                        <b>Original copy of Aysqo offer letter</b>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">B</td>
                      <td className="border border-black p-2">
                        <b>DATE OF BIRTH PROOF:</b> Mandatory is Aadhar Card. If no Aadhar Card or incomplete details on
                        Aadhar card then the following will apply: (Any ONE of the following: Birth Certificate, Xth, XIIth
                        Mark Sheet with DOB details on it, Passport, PAN Card, Driving License, School/College Leaving
                        Certificate) â€“ <b>1 copy</b>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">C</td>
                      <td className="border border-black p-2">
                        <b>PHOTO ID:</b> Aadhar OR PAN Card. In the absence of both then the following will apply: (One of the
                        following: Voter's ID, Driving License, Passport, or Bank Passbook with photograph, Banker
                        Verification, NSR (National Skills Registry) ID card) â€“ <b>Copy</b>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">D</td>
                      <td className="border border-black p-2">
                        <b>PERMANENT ADDRESS PROOF:</b> (One of the following: Passport, Driving License, Voter's ID,
                        Nationalized Bank Passbook with photograph and address, Electricity Bill â€“ latest of Self or Parent,
                        Ration Card, LIC & Insurance documents, Mobile Bill, Telephone Landline Bill â€“ latest of Self or
                        Parents, or Current lease deed â€“ with you or your parents / spouse as lessee or co-lessee) â€“ <b>1 copy</b>.
                        The information for address needs to be verifiable during BGV and hence the same needs to be
                        the latest permanent address proof.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">E</td>
                      <td className="border border-black p-2">
                        <b>EDUCATION QUALIFICATION PROOF:</b> (mark sheets & degree are important) (as applicable
                        Xth, XIIth, Graduation, Post-Graduation Certificate, Copy of Diploma, others)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">F</td>
                      <td className="border border-black p-2">
                        <b>PASSPORT SIZE PHOTOGRAPHS:</b> 5 copies (with Red Background ONLY)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">G</td>
                      <td className="border border-black p-2">
                        <b>PAN NUMBER:</b> Photocopy of PAN Card. If you do not possess a PAN Card then an application for
                        one will have to be made and a copy of the application receipt will have to be submitted.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">H</td>
                      <td className="border border-black p-2">
                        <b>Professional Relieving or Experience Letter</b> from previous employer (last 2 employments) or
                        Accepted Resignation Letter from previous employer.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">I</td>
                      <td className="border border-black p-2">
                        <b>Salary Slip / Salary certification</b> from previous employer (last 2 employments). <b>Bank statement</b> if no
                        salary slips from the company.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">J</td>
                      <td className="border border-black p-2">
                        <b>Employee ID Proof:</b> (photocopy of salary slips, appraisal letter which contains the employee id proof)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">K</td>
                      <td className="border border-black p-2">
                        <b>Marriage Certificate (if applicable)</b> OR Marriage Affidavit with Couple Photo
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">L</td>
                      <td className="border border-black p-2">
                        <b>Self-declaration Medical Fitness form:</b> Medical Fitness form needs to be duly filled and stamped by
                        a Doctor.
                      </td>
                    </tr>
                  </tbody>
                </table> <br /><br /><br />

                <div className="mt-10 text-sm text-center">
                  <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd</p>
                  <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p>
                  <p>Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a></p>
                  <p>Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a></p>
                </div>
              </div>

              {/* PAGE 3 - Appendix A: Employment Terms */}
                            <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                               <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                  <img src={logo2} alt="Watermark" className="w-[500px]" />
                </div>
                              <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                              <div className="text-right mb-4">
                                <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                              </div>

                              <p className="mt-4 text-justify">
                                We are delighted to welcome you to our organization and look forward to a long, rewarding, and mutually
                                beneficial association. We trust that you will find this offer satisfactory and eagerly await your
                                addition to the Aysqo Technology Solutions Pvt Ltd family.
                              </p>

                              <p className="mt-4">Best Regards</p>

                              <h2 className="mt-6 font-bold">APPENDIX A: Employment Terms and Conditions Profile Verification</h2>

                              <p className="mt-4 text-justify font-semibold">
                                This offer is conditional upon the successful verification of the information you have provided during the
                                interview and selection process. Should any discrepancies or falsified details be discovered at any stage of
                                your employment, this offer letter and/or your employment with the Company will be terminated with immediate effect.
                              </p>

                              <h3 className="mt-6 font-bold">Employee Duties and Responsibilities</h3>

                              <p className="mt-2 text-justify">
                                You will begin your employment with the Company in the position specified in your Offer Letter. However, you
                                may be assigned additional duties and responsibilities from time to time, as deemed necessary by the Company.
                              </p>

                              <p className="mt-2 text-justify">
                                You are expected to demonstrate a high level of initiative, efficiency, and dedication in all your work. All
                                tasks—whether within your job profile or reasonably expected as part of your role—must be carried out diligently,
                                competently, and to the satisfaction of the Company.
                              </p>

                              <p className="mt-2 text-justify">
                                It is your responsibility to ensure the quality and integrity of all work you are involved in, whether individually
                                or as part of a team. As a valuable employee, you are expected to devote your time, effort, and skills exclusively
                                toward fulfilling your responsibilities with the Company.
                              </p>

                              <p className="mt-2 text-justify">
                                During your employment, you agree not to engage in any commercial or business activity that may interfere with
                                the availability or conflict with your professional obligations. However, you are free to participate in
                                non-commercial, not-for-profit activities outside of your normal working hours, provided they do not affect your
                                performance.
                              </p>

                              <h3 className="mt-6 font-bold">CTC - Allowances & Components</h3>

                              <p className="mt-2 text-justify">
                                The Gross Cost to Company (CTC), outlined in this contract, includes all statutory and associated components
                                such as Provident Fund (PF), allowances, gratuity, insurance, and other applicable benefits. You will have the
                                opportunity to discuss a detailed pay breakup at the time of joining, including the variable components with the
                                Company.
                              </p>

                              <h3 className="mt-6 font-bold">Performance & Appraisal</h3>
                              <p className="mt-2 text-justify">
                                The Company at its sole discretion may award performance bonuses to employees, based on individual
                                contributions and the overall performance of the organization.
                              </p>

                              <h3 className="mt-6 font-bold">Tax</h3>
                              <p className="mt-2 text-justify">
                                You will be solely responsible for any tax liabilities arising from your employment, including those owed to
                                statutory authorities.
                              </p>

                              <h3 className="mt-6 font-bold">Expenses and Reimbursement</h3>
                              <p className="mt-2 text-justify">
                                You will be reimbursed for all reasonable and necessary out-of-pocket expenses incurred in the course of fulfilling
                                your responsibilities, subject to the submission of valid bills, tickets, or supporting documents, and approved by
                                your immediate supervisor.
                              </p>

                              <div className="mt-10 text-sm text-center">
                                <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                                <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p>
                                <p>Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a></p>
                                <p>Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a></p>
                              </div>
                            </div>

                            {/* PAGE 4 - Travel, Increments, Posting, Medical, etc. */}
                            <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                               <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                  <img src={logo2} alt="Watermark" className="w-[500px]" />
                </div>
                              <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                              <div className="text-right mb-4">
                               <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                              </div>

                              <h3 className="mt-6 font-bold">Travel</h3>
                              <p className="mt-2 text-justify">
                                As part of your employment, you may be required to travel. In such cases, you will be informed in
                                advance to allow adequate time for preparation.
                              </p>

                              <h3 className="mt-6 font-bold">Increments and Promotions</h3>
                              <p className="mt-2 text-justify">
                                Your career progression within the Company will be determined solely by your performance and capabilities.
                                Your individual contributions will be regularly evaluated by your managers, as well as through peer feedback,
                                forming the basis for decisions regarding salary increments and promotions. Performance reviews will be conducted
                                every six months to assess and guide your professional growth.
                              </p>
                              <p className="mt-2 text-justify">
                                You will be expected to continuously learn and adapt to the processes implemented at Aysqo Technology Solutions Pvt Ltd.
                                as the business evolves. Compliance with the Company's established quality standards is mandatory.
                                Demonstrating adherence to these standards, along with your overall attitude toward maintaining quality, will
                                be key factors in evaluating your performance.
                              </p>

                              <h3 className="mt-6 font-bold">Posting / Transfer</h3>
                              <p className="mt-2 text-justify">
                                While your initial posting will be as stated in the Offer Letter, you may be assigned to any department, office, or
                                location of the Company, its partners, or customers—whether in India or abroad—based on your job requirements
                                and the business needs, at the Company's discretion.
                              </p>

                              <h3 className="mt-6 font-bold">Medical</h3>
                              <p className="mt-2 text-justify">
                                The Company reserves the right to terminate your employment if valid medical evidence indicates that you are
                                physically or mentally incapacitated to a degree that prevents you from fulfilling your assigned responsibilities.
                              </p>

                              <h3 className="mt-6 font-bold">Working Hours, Holidays and Leave</h3>
                              <p className="mt-2 text-justify">
                                Your standard weekly working hours are from <b>10:00 AM to 6:00 PM, Monday through Friday</b>.
                                Saturdays and Sundays will generally be non-working days. Employees are entitled to 12 paid leaves annually,
                                accrued at the rate of one leave per month of service. The Company provides 12 annual holidays, including
                                national and festival holidays, applicable across all office branches. Except in cases of emergencies or medical
                                necessity, leave requests must be submitted in advance through an online system and approved by your manager.
                              </p>

                              <h3 className="mt-6 font-bold">Intellectual Property Rights</h3>
                              <p className="mt-2 text-justify">
                                During your employment, all materials or intellectual property created or developed by you during the course
                                of your employment, whether performed individually or as part of a team, in connection with your duties and
                                responsibilities, will belong exclusively to Aysqo Technology Solutions Pvt Ltd. You agree that all rights of
                                intellectual property created during your employment shall be the sole property of the Company, and you shall
                                execute all necessary documents to assign such rights unconditionally. Unauthorized use of such intellectual
                                property for personal benefit is strictly prohibited.
                              </p>

                              <h3 className="mt-6 font-bold">Non-Solicitation</h3>
                              <p className="mt-2 text-justify">
                                During your employment with Aysqo Technology Solutions Pvt Ltd, and for a period of one year following its
                                termination, you agree not to solicit or encourage any employees of the Company to leave their employment for
                                other pursuits. Additionally, you agree not to provide services, directly or indirectly, to any competitor,
                                vendor, client, or affiliate that is in conflict with Aysqo Technology Solutions Pvt Ltd. Furthermore, you agree
                                not to, on your own behalf or on behalf of any other person or entity, solicit or attempt to entice any customers
                                or prospective customers away from the Company.
                              </p>

                              <div className="mt-10 text-sm text-center">
                                <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                                <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p>
                                <p>Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a></p>
                                <p>Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a></p>
                              </div>
                            </div>
                             {/* PAGE 5 - Non-Disclosure, Non-Compete, Training, Termination, Warranty */}
                                          <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                                             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                                <img src={logo2} alt="Watermark" className="w-[500px]" />
                              </div>
                                            <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                                            <div className="text-right mb-4">
                                              <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                                            </div>

                                            <h3 className="mt-6 font-bold">Non-Disclosure</h3>
                                            <p className="mt-2 text-justify">
                                              You agree to sign and be legally bound by the terms of the Non-Disclosure, Non-Solicitation, and
                                              Non-Competition Agreement throughout the duration of your employment with the Company and thereafter.
                                              Additionally, you commit to adhering to all Company policies regarding the protection of confidential
                                              information as updated from time to time. You are strictly required to maintain confidentiality concerning
                                              your remuneration and terms of employment and must not disclose or discuss such information with any other
                                              employee, except your immediate supervisor. Any unauthorized disclosure of confidential information will be
                                              regarded as a serious breach of conduct and a violation of your employment terms.
                                            </p>

                                            <h3 className="mt-6 font-bold">Non-Compete</h3>
                                            <p className="mt-2 text-justify">
                                              By accepting this position with the Company, you agree not to engage in any competing business or activities
                                              during your employment and for a period of one year following the termination of your employment. However,
                                              this restriction does not prevent you from seeking employment with other IT companies after your tenure with
                                              Aysqo Technology Solutions Pvt Ltd has ended.
                                            </p>

                                            <h3 className="mt-6 font-bold">Training</h3>
                                            <p className="mt-2 text-justify">
                                              The Company may, at its discretion, arrange training sessions for employees either at the Company premises
                                              or at external locations. You will be required to attend these trainings and complete any associated assignments.
                                              During the training period, you will remain under evaluation until you meet the criteria established by Aysqo.
                                              Please note that the salary during this training phase may differ from the amount stated in your offer letter,
                                              and the Company reserves the right to revise your compensation based on your progress and development.
                                            </p>

                                            <h3 className="mt-6 font-bold">Personal Information</h3>
                                            <p className="mt-2 text-justify">
                                              It is the employee's responsibility to keep their personal contact information current with the Company and
                                              promptly notify the Company of any changes. Additionally, you are required to inform the Company of any
                                              changes in your civil or marital status.
                                            </p>

                                            <h3 className="mt-6 font-bold">Termination</h3>
                                            <p className="mt-2 text-justify">
                                              On termination of your employment with the Company irrespective of the circumstances, you are bound to return
                                              to the Company:
                                            </p>
                                            <ol className="list-decimal ml-6 mt-2 space-y-2 text-justify">
                                              <li>
                                                Any material items belonging to the Company per inventory, and all non-material items in your possession
                                                including but not limited to intellectual property (documentation, software, email correspondence) and any
                                                other information required for the continued execution of the duties of your role (login credentials,
                                                business contact information).
                                              </li>
                                              <li>
                                                Any physical company documents that you may have in your possession. You are also bound to repay any and all
                                                outstanding debts or loans due to the Company and the Company is hereby authorized to deduct from any payments
                                                due to the employee the amount due to the Company.
                                              </li>
                                              <li>
                                                You will also be bound by any previous confidentiality, non-disclosure or non-compete agreements that you had
                                                signed as part of your employment until the individual termination of such contracts.
                                              </li>
                                            </ol>

                                            <h3 className="mt-6 font-bold">Warranty</h3>
                                            <p className="mt-2 text-justify">
                                              You represent and warrant that the terms and conditions of your employment with the Company are lawful, valid,
                                              and binding upon you. By accepting this offer and fulfilling your obligations under this employment, you affirm
                                              that you are not, and will not be, in violation of any other agreement or understanding to which you are a party—
                                              including, but not limited to, any prior employment contracts—and that no such agreement will be breached or
                                              conflicted with as a result of your engagement with the Company.
                                            </p>

                                            <div className="mt-10 text-sm text-center">
                                              <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                                              <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p>
                                              <p>Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a></p>
                                              <p>Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a></p>
                                            </div>
                                          </div>

                                          {/* PAGE 6 - Breaches, Notice Period, Jurisdiction, Amendments */}
                                          <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                                             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                                <img src={logo2} alt="Watermark" className="w-[500px]" />
                              </div>
                                            <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                                            <div className="text-right mb-4">
                                             <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                                            </div>

                                            <h3 className="mt-6 font-bold">Breaches and Violations</h3>
                                            <p className="mt-2 text-justify">
                                              In addition to the terms outlined in this document, you may be subject to disciplinary actions—including
                                              but not limited to warnings, suspensions, demotion, or denial of promotions and increments—for any
                                              violations of the Company's code of conduct or policies. These policies and related Company manuals are
                                              considered integral parts of this Agreement. The Company reserves the right to modify or amend these terms
                                              and will notify employees accordingly. Employment may also be terminated following disciplinary action and
                                              a thorough investigation.
                                            </p>
                                            <p className="mt-2 text-justify">
                                              Throughout your employment, you are required to comply with all rules, regulations, and policies established
                                              by the Company, including any revisions made at the Company's discretion from time to time, regardless of
                                              whether such updates are individually communicated to you. It is your responsibility to stay informed of
                                              these policies by regularly consulting the Company intranet or employee manual. Failure to adhere to these
                                              guidelines may result in disciplinary action by the Company.
                                            </p>

                                            <h3 className="mt-6 font-bold">Notice Period</h3>
                                            <p className="mt-2 text-justify">
                                              During your first year of employment, either party must provide a minimum of six months' notice to terminate
                                              this contract. After the first year, termination may be made by either party with a one-month notice period.
                                              The notice period begins from the date the termination letter is received by your manager. However, in cases
                                              such as policy violations or other serious breaches, the Company reserves the right to terminate your employment
                                              immediately, without prior notice. Additionally, your manager may terminate your employment on the spot without
                                              any prior intimation if circumstances warrant.
                                            </p>

                                            <h3 className="mt-6 font-bold">Jurisdiction</h3>
                                            <p className="mt-2 text-justify">
                                              Your employment shall be governed by and interpreted in accordance with the laws of India. Any disputes arising
                                              out of or in connection with your employment, including the terms and conditions thereof, shall fall under the
                                              exclusive jurisdiction of the courts located in Telangana/Hyderabad.
                                            </p>
                                            <p className="mt-2 text-justify">
                                              Both parties further agree that any such disputes shall first be referred to arbitration in accordance with the
                                              Arbitration and Conciliation Act, 1996. The arbitrator shall be appointed by the Company, and the arbitration
                                              process will commence within fifteen (15) days of either party receiving written notice of the dispute.
                                            </p>

                                            <h3 className="mt-6 font-bold">Amendments</h3>
                                            <p className="mt-2 text-justify">
                                              The Company reserves the right, at its sole discretion, to amend, replace, or revoke any of the terms mentioned
                                              above, as may be required by statutory changes or other circumstances. Any such modifications will be updated
                                              on the Company intranet and formally communicated to employees through appropriate channels. All employees are
                                              expected to comply with Company rules and policies as they evolve over time.
                                            </p>

                                            <p className="mt-4 text-justify font-semibold">
                                              If you agree to accept this position, please confirm your acceptance in writing by signing below and specifying
                                              your intended date of joining. A copy of this letter will be provided for your records. Regardless of your decision
                                              to join Aysqo Technology Solutions Pvt. Ltd., you are required to maintain strict confidentiality regarding the
                                              contents of this letter. All related correspondence should be clearly marked as "Confidential."
                                            </p>

                                            <p className="mt-6 font-bold">
                                             <span className="font-semibold">{formData.candidate_name || "---------"}</span> , we take this opportunity to warmly welcome you to Aysqo Technology Solutions
                                              Pvt. Ltd., and look forward to a successful association.
                                            </p>

                                            <div className="mt-10 text-sm text-center">
                                              <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                                              <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p>
                                              <p>Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a></p>
                                              <p>Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a></p>
                                            </div>
                                          </div>

                                          {/* PAGE 7 - Annexure II (Compensation Structure) */}
                                          <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                                             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                                <img src={logo2} alt="Watermark" className="w-[500px]" />
                              </div>
                                            <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                                            <div className="text-right mb-4">
                                              <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                                            </div>

                                            <h2 className="text-center font-bold text-lg mb-6">Annexure II</h2>
                                            <p className="text-justify">
                                              AYSQO Technology Solutions Private Limited is pleased to extend the following compensation structure for your role,
                                              which includes statutory and company-level deductions:
                                            </p>

                                            {(() => {
                                              const ctc = parseInt(formData.ctc || 300000);
                                              const basic = Math.round(ctc * 0.48);
                                              const hra = Math.round(ctc * 0.192);
                                              const conveyance = 19000;
                                              const medicalAllowance = 15000;
                                              const special = ctc - (basic + hra + conveyance + medicalAllowance + Math.round(basic * 0.12) + Math.round(basic * 0.0481));

                                              const epf = Math.round(basic * 0.12);
                                              const gratuity = Math.round(basic * 0.0481);

                                              const gross = ctc - (epf + 2400 + 30000 + 1440);
                                              const deductions = epf + 2400 + 30000 + 1440;
                                              const netTakeHome = gross;

                                              return (
                                                <>
                                                  <table className="w-full border-collapse border text-sm mt-6">
                                                    <thead>
                                                      <tr className="bg-gray-100">
                                                        <th className="border px-2 py-1 text-left">Component</th>
                                                        <th className="border px-2 py-1">Monthly (₹)</th>
                                                        <th className="border px-2 py-1">Annual (₹)</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      <tr><td className="border px-2 py-1">Basic Salary</td><td className="border px-2 py-1">{(basic/12).toLocaleString()}</td><td className="border px-2 py-1">{basic.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">House Rent Allowance (HRA)</td><td className="border px-2 py-1">{(hra/12).toLocaleString()}</td><td className="border px-2 py-1">{hra.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">Conveyance Allowance</td><td className="border px-2 py-1">{(conveyance/12).toLocaleString()}</td><td className="border px-2 py-1">{conveyance.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">Medical Allowance</td><td className="border px-2 py-1">{(medicalAllowance/12).toLocaleString()}</td><td className="border px-2 py-1">{medicalAllowance.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">Special Allowance</td><td className="border px-2 py-1">{(special/12).toLocaleString()}</td><td className="border px-2 py-1">{special.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">Employer Provident Fund (12%)</td><td className="border px-2 py-1">{(epf/12).toLocaleString()}</td><td className="border px-2 py-1">{epf.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">Gratuity (4.81% of Basic)</td><td className="border px-2 py-1">{(gratuity/12).toLocaleString()}</td><td className="border px-2 py-1">{gratuity.toLocaleString()}</td></tr>
                                                      <tr className="bg-gray-100 font-bold"><td className="border px-2 py-1">Total Cost to Company (CTC)</td><td className="border px-2 py-1">--</td><td className="border px-2 py-1">₹{ctc.toLocaleString()}</td></tr>
                                                    </tbody>
                                                  </table>

                                                  <table className="w-full border-collapse border text-sm mt-6">
                                                    <thead>
                                                      <tr className="bg-gray-100">
                                                        <th className="border px-2 py-1">Deduction</th>
                                                        <th className="border px-2 py-1">Monthly (₹)</th>
                                                        <th className="border px-2 py-1">Annual (₹)</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      <tr><td className="border px-2 py-1">Employee Provident Fund (12%)</td><td className="border px-2 py-1">{(epf/12).toLocaleString()}</td><td className="border px-2 py-1">{epf.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1">Professional Tax (Telangana)</td><td className="border px-2 py-1">200</td><td className="border px-2 py-1">2,400</td></tr>
                                                      <tr><td className="border px-2 py-1">AYSQO Internal Recovery (Infra)</td><td className="border px-2 py-1">2,500</td><td className="border px-2 py-1">30,000</td></tr>
                                                      <tr><td className="border px-2 py-1">Digital Resource Fee</td><td className="border px-2 py-1">120</td><td className="border px-2 py-1">1,440</td></tr>
                                                      <tr className="bg-gray-100 font-bold"><td className="border px-2 py-1">Total Deductions</td><td className="border px-2 py-1">{(deductions/12).toLocaleString()}</td><td className="border px-2 py-1">{deductions.toLocaleString()}</td></tr>
                                                    </tbody>
                                                  </table>

                                                  <table className="w-full border-collapse border text-sm mt-6">
                                                    <tbody>
                                                      <tr><td className="border px-2 py-1 font-bold">Gross Salary (before deductions)</td><td className="border px-2 py-1">{(gross/12).toLocaleString()}</td><td className="border px-2 py-1">{gross.toLocaleString()}</td></tr>
                                                      <tr><td className="border px-2 py-1 font-bold">Net Take-Home Salary</td><td className="border px-2 py-1">₹{(netTakeHome/12).toLocaleString()}</td><td className="border px-2 py-1">₹{netTakeHome.toLocaleString()}</td></tr>
                                                    </tbody>
                                                  </table>
                                                </>
                                              )
                                            })()}

                                            <div className="mt-6 text-sm">
                                              <p><b>1.</b> Gratuity is payable upon completion of 5 years of continuous service with AYSQO.</p>
                                              <p><b>2.</b> Professional Tax is deducted as per Telangana regulations.</p>
                                              <p><b>3.</b> Income Tax, if applicable, will be deducted per IT laws and employee declarations.</p>
                                              <p><b>4.</b> Structure may be revised based on performance, statutory compliance, or company policy.</p>
                                              <p><b>5.</b> Net take-home salary is indicative and may vary based on applicable deductions and tax declarations.</p>
                                            </div><br /><br /><br /><br /><br /><br />

                                            <div className="mt-10 text-sm text-center">
                                              <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                                              <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad</p>
                                              <p>Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a></p>
                                              <p>Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a></p>
                                            </div>
                                          </div>


              {/* PAGE 8 - Acceptance */}
              <div className="page bg-white shadow rounded p-10 min-h-[1123px] w-[794px] mx-auto relative" style={{display: 'none'}}>
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                  <img src={logo2} alt="Watermark" className="w-[500px]" />
                </div>
                <img src={logo} alt="Company Logo" className="absolute top-4 left-4 h-12" />

                <div className="text-right mb-4">
                  <p className="font-semibold text-sm text-green-700">
                    AYSQO/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}
                  </p>
                </div>

                <h2 className="font-bold text-lg mb-6">Acceptance</h2>
                <p className="text-justify mb-6">
                  I, <span className="font-semibold">{formData.candidate_name || "---------"}</span>, hereby confirm my acceptance
                  of all the above-mentioned terms and conditions, and I agree to join as per the offer.
                </p>

                <div className="mt-10">
                  <p>Yours faithfully,</p>
                  <p className="mt-2">For Aysqo Ltd.</p>
                  <p className="mt-6 font-signature italic text-lg">frederick</p>
                  <p className="font-semibold">Frederick</p>
                  <p>Head Of Indian Operations - Talent Acquisition</p>
                </div>

                <div className="mt-12">
                  <p>I accept the terms of this letter.</p>

                  <div className="mt-6 space-y-4">
                    <p>
                      <span className="font-bold">Signature :</span>{" "}
                      <span className="text-green-600 underline">____________</span>
                    </p>
                    <p>
                      <span className="font-bold">Date :</span>{" "}
                      _____________
                    </p>
                    <p>
                      <span className="font-bold">Name :</span> {formData.candidate_name || "____________"}
                    </p>
                  </div>
                </div><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />

                <div className="mt-20 text-sm text-center">
                  <p className="font-bold">Aysqo Technology Solutions Pvt. Ltd.</p>
                  <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad</p>
                  <p>
                    Email: <a href="mailto:info@aysqo.com" className="text-blue-600">info@aysqo.com</a>
                  </p>
                  <p>
                    Website: <a href="http://www.aysqo.com" className="text-blue-600">www.aysqo.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "form" && (
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={handleDownload} className="bg-green-600 text-white px-6 py-2 rounded-lg">Download PDF</button>
          <button onClick={handleSendMail} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            <Mail size={18} /> Send Mail
          </button>
        </div>
      )}
    </div>
  );
}

export default OfferLetter;