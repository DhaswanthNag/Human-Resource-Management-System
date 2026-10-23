import React, { useRef, useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import logo from "../../assets/logo.png";
import { ChevronLeft, ChevronRight, Mail, Send, Trash2, RefreshCw, FileText, Users, CalendarDays, IndianRupee, Plus} from "lucide-react";
import logo2 from "../../assets/logo2.png";

function OfferLetter() {
  // API base URL
  const API_BASE_URL = "http://localhost:5000/api";
  const getAuthConfig = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // 🔹 Draft data (form typing)
  const [draftData, setDraftData] = useState({
    offer_id: "",
    candidate_id: "",
    candidate_name: "",
    email: "",
    mobile: "",
    designation: "",
    ctc: "",
    joining_date: "",
    address: "",
    offer_date: new Date().toISOString().split("T")[0],
  });

  // 🔹 FormData (only updates when Generate Now clicked)
  const [formData, setFormData] = useState({ ...draftData });
  const [currentPage, setCurrentPage] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "Offer Letter from Nexora Technology Solutions",
    body: "Please find attached your offer letter.",
  });
  const [isSending, setIsSending] = useState(false);
  const [generatedLetters, setGeneratedLetters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [viewMode, setViewMode] = useState("form");
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");
  const letterRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Set to 1 while only page 1 is present; change to 8 after restoring pages 2-8.
  const totalPages = 8;

  // Fetch all offers from backend
  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE_URL}/offer-letters`, getAuthConfig());
      setGeneratedLetters(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setError("Failed to load offer letters. Check that the backend and database are running.");
      setGeneratedLetters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch shortlisted candidates from the Interview Panel and match them with candidate records
  const fetchCandidates = useCallback(async () => {
    try {
      setLoadingCandidates(true);
      setError("");

      const config = getAuthConfig();
      const [shortlistResponse, candidatesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/interviews/shortlist`, config),
        axios.get(`${API_BASE_URL}/candidates`, config),
      ]);

      const shortlistData = Array.isArray(shortlistResponse.data)
        ? shortlistResponse.data
        : Array.isArray(shortlistResponse.data?.shortlists)
          ? shortlistResponse.data.shortlists
          : Array.isArray(shortlistResponse.data?.data)
            ? shortlistResponse.data.data
            : [];

      const candidateData = Array.isArray(candidatesResponse.data)
        ? candidatesResponse.data
        : [];

      const candidateMap = new Map(
        candidateData.map((candidate) => [
          String(candidate.candidate_id ?? candidate.id),
          candidate,
        ])
      );

      const shortlistedData = shortlistData
        .filter(
          (item) =>
            String(item.status || "").trim().toLowerCase() === "shortlisted"
        )
        .map((item) => {
          const candidateId = item.candidate_id ?? item.id;
          const existingCandidate = candidateMap.get(String(candidateId)) || {};

          return {
            ...existingCandidate,
            ...item,
            candidate_id: candidateId ?? existingCandidate.candidate_id ?? existingCandidate.id,
            candidate_code:
              item.candidate_code ||
              existingCandidate.candidate_code ||
              (candidateId != null
                ? `candidate${String(candidateId).padStart(3, "0")}`
                : ""),
            name:
              existingCandidate.name ||
              item.candidate_name ||
              item.name ||
              "",
            email: existingCandidate.email || item.email || "",
            job_applied:
              existingCandidate.job_applied ||
              existingCandidate.position ||
              existingCandidate.designation ||
              item.job_applied ||
              item.position ||
              item.designation ||
              "",
          };
        })
        .filter((candidate) => candidate.candidate_id != null);

      setCandidates(shortlistedData);
    } catch (err) {
      console.error("Error fetching shortlisted candidates:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load shortlisted candidates. Check your HR login and Interview Panel API."
      );
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  // Request the next unique Offer ID from the backend
  const fetchNextOfferId = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/offer-letters/next-id`, getAuthConfig());
      const offerId = response.data?.offer_id;

      if (!offerId || !/^offer\d+$/i.test(offerId)) {
        throw new Error("The backend did not return a valid Offer ID.");
      }

      setDraftData((previous) => ({ ...previous, offer_id: offerId }));
      return offerId;
    } catch (err) {
      console.error("Error generating Offer ID:", err);
      setError(
        err.response?.data?.error ||
          "Could not generate an Offer ID. Check that the backend next-ID endpoint exists and that you are logged in."
      );
      return "";
    }
  }, []);

  // Clean up temporary blob URLs when component unmounts
  useEffect(() => {
    return () => {
      generatedLetters.forEach((letter) => {
        if (letter.pdf_link?.startsWith("blob:")) URL.revokeObjectURL(letter.pdf_link);
      });
    };
  }, [generatedLetters]);

  // Load saved letters, existing candidates, and the first Offer ID
  useEffect(() => {
    fetchOffers();
    fetchCandidates();
    fetchNextOfferId();
  }, [fetchOffers, fetchCandidates, fetchNextOfferId]);

  // Show only the current page
  useEffect(() => {
    const pages = letterRef.current?.querySelectorAll(".page");
    if (!pages?.length) return;
    pages.forEach((page, index) => {
      page.style.display = index === currentPage ? "block" : "none";
    });
  }, [currentPage, viewMode]);

  // Adjust offer letter preview to fit the available width
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const availableWidth = container.clientWidth;
      const horizontalPadding = window.innerWidth >= 640 ? 32 : 16;
      const usableWidth = Math.max(0, availableWidth - horizontalPadding);
      setPreviewScale(Math.min(1, Math.max(0.1, usableWidth / 794)));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();

    return () => observer.disconnect();
  }, [viewMode]);

  // Only shortlisted candidates are eligible for offer letters
  const shortlistedCandidates = candidates.filter(
    (candidate) =>
      String(candidate.status || "").trim().toLowerCase() === "shortlisted"
  );

  const handleDraftChange = (e) => {
    const { name, value } = e.target;
    setDraftData((previous) => ({ ...previous, [name]: value }));
  };

  // Select an existing shortlisted candidate and fill details from PostgreSQL
  const handleCandidateChange = (e) => {
    const candidateId = e.target.value;
    const candidate = shortlistedCandidates.find(
      (item) => String(item.candidate_id ?? item.id) === String(candidateId)
    );

    if (!candidate) {
      setDraftData((previous) => ({
        ...previous,
        candidate_id: "",
        candidate_name: "",
        email: "",
        designation: "",
      }));
      return;
    }

    setDraftData((previous) => ({
      ...previous,
      candidate_id: String(candidate.candidate_id ?? candidate.id),
      candidate_name: candidate.name || candidate.candidate_name || "",
      email: candidate.email || "",
      designation: candidate.job_applied || candidate.position || candidate.designation || "",
    }));
    setError("");
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData((previous) => ({ ...previous, [name]: value }));
  };

  // Generate Now → update preview + save record to backend
  const handleGenerate = async () => {
    const data = { ...draftData };
    const existingId = data.id;

    data.offer_id = String(data.offer_id || "").trim();
    data.candidate_name = String(data.candidate_name || "").trim();
    data.email = String(data.email || "").trim();
    data.designation = String(data.designation || "").trim();
    data.ctc = String(data.ctc || "").trim();

    const selectedCandidate = shortlistedCandidates.find(
      (candidate) =>
        String(candidate.candidate_id ?? candidate.id) === String(data.candidate_id)
    );

    if (
      !data.offer_id ||
      !selectedCandidate ||
      !data.candidate_name ||
      !data.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      !data.designation ||
      !data.ctc ||
      !Number.isFinite(Number(data.ctc)) ||
      Number(data.ctc) <= 0 ||
      !data.joining_date
    ) {
      setError("Select a shortlisted candidate and enter a valid positive CTC and joining date.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      flushSync(() => setFormData(data));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const { pdfBlob, fileName } = await generatePDF(data);
      const payload = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "id" && key !== "candidate_id") {
          payload.append(key, value ?? "");
        }
      });

      payload.append("pdf", pdfBlob, fileName);

      const response = existingId
        ? await axios.put(`${API_BASE_URL}/offer-letters/${existingId}`, payload, getAuthConfig())
        : await axios.post(`${API_BASE_URL}/offer-letters`, payload, getAuthConfig());

      const savedLetter = response.data;

      setDraftData((previous) => ({
        ...previous,
        ...savedLetter,
        candidate_id: data.candidate_id,
      }));
      setFormData((previous) => ({
        ...previous,
        ...savedLetter,
        candidate_id: data.candidate_id,
      }));

      setGeneratedLetters((previous) =>
        existingId
          ? previous.map((letter) =>
              String(letter.id) === String(existingId) ? savedLetter : letter
            )
          : [...previous, savedLetter]
      );

      // Keep the generated offer letter open in the preview.
      setViewMode("form");
      setCurrentPage(0);

      // Get the next Offer ID after successfully creating a new offer
      if (!existingId) {
        await fetchNextOfferId();
      }
    } catch (err) {
      console.error("Error saving offer:", err);
      setError(
        err.response?.data?.error ||
          "Failed to save offer letter. Check the backend and database."
      );
    } finally {
      setLoading(false);
    }
  };

  // Separate function to generate PDF
  const generatePDF = async (data = formData) => {
    const input = letterRef.current;
    if (!input) throw new Error("Letter reference not found");

    const pages = Array.from(input.querySelectorAll(".page"));
    if (pages.length !== totalPages) {
      throw new Error(`Expected ${totalPages} pages, but found ${pages.length}.`);
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const previousDisplays = pages.map((page) => page.style.display);

    // Create a separate, unscaled container for accurate PDF rendering.
    const renderContainer = document.createElement("div");
    Object.assign(renderContainer.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "794px",
      minWidth: "794px",
      height: "auto",
      margin: "0",
      padding: "0",
      overflow: "visible",
      background: "#ffffff",
      zIndex: "-1",
      transform: "none",
    });
    document.body.appendChild(renderContainer);

    try {
      for (let i = 0; i < pages.length; i++) {
        const pageClone = pages[i].cloneNode(true);

        Object.assign(pageClone.style, {
          display: "block",
          position: "relative",
          width: "794px",
          minWidth: "794px",
          maxWidth: "794px",
          height: "1123px",
          minHeight: "1123px",
          maxHeight: "1123px",
          margin: "0",
          transform: "none",
          boxSizing: "border-box",
          flexShrink: "0",
        });

        renderContainer.replaceChildren(pageClone);

        // Wait for cloned images before capturing the page.
        const images = Array.from(pageClone.querySelectorAll("img"));
        await Promise.all(
          images.map(async (image) => {
            if (image.complete && image.naturalWidth > 0) return;
            try {
              await image.decode();
            } catch {
              // Continue rendering if an image cannot be decoded.
            }
          })
        );

        const canvas = await html2canvas(pageClone, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          imageTimeout: 15000,
          removeContainer: true,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (i > 0) pdf.addPage("a4", "p");

        // Fit the full page proportionally to A4.
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          0,
          pageWidth,
          pageHeight,
          undefined,
          "FAST"
        );

        canvas.width = 0;
        canvas.height = 0;
      }

      const safeOfferId = String(data.offer_id || "NEXORA").replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      return {
        pdfBlob: pdf.output("blob"),
        fileName: `OfferLetter_${safeOfferId}.pdf`,
      };
    } finally {
      renderContainer.remove();

      // Restore the preview's original page visibility.
      pages.forEach((page, index) => {
        page.style.display =
          previousDisplays[index] ||
          (index === currentPage ? "block" : "none");
      });
    }
  };


  // Download the currently displayed offer letter
  const handleDownload = async () => {
    try {
      setError("");
      const { pdfBlob, fileName } = await generatePDF(formData);
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError("Failed to download PDF. Please try again.");
    }
  };

  const handleSendMail = () => {
    if (!formData.offer_id || !formData.candidate_name || !formData.email) {
      setError("Select or generate an offer letter before sending an email.");
      return;
    }

    setEmailData({
      to: formData.email,
      subject: `Offer Letter from Nexora Technology Solutions - ${formData.candidate_name}`,
      body: `Dear ${formData.candidate_name},\n\nPlease find attached your offer letter for the position of ${formData.designation}.\n\nBest regards,\nNexora HR Team`,
    });
    setError("");
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailData.to.trim() || !emailData.subject.trim() || !emailData.body.trim()) {
      setError("Enter the recipient email, subject, and message.");
      return;
    }

    const selectedLetter = generatedLetters.find(
      (letter) => String(letter.offer_id) === String(formData.offer_id)
    );

    if (!selectedLetter?.id) {
      setError("Save the offer letter to the database before sending it.");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const { pdfBlob, fileName } = await generatePDF(formData);
      const payload = new FormData();
      payload.append("offer_id", String(selectedLetter.offer_id));
      payload.append("to", emailData.to.trim());
      payload.append("subject", emailData.subject.trim());
      payload.append("body", emailData.body);
      payload.append("pdf", pdfBlob, fileName);

      await axios.post(`${API_BASE_URL}/offer-letters/send-email`, payload, getAuthConfig());
      await fetchOffers();
      setShowEmailModal(false);
      alert(`Email with PDF attachment sent successfully to ${emailData.to}`);
    } catch (err) {
      console.error("Error sending email:", err);
      setError(
        err.response?.data?.error ||
          "Failed to send email. Check the backend email configuration."
      );
    } finally {
      setIsSending(false);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage((page) => page + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage((page) => page - 1);
  };

  const deleteLetter = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer letter record?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/offer-letters/${id}`, getAuthConfig());
      setGeneratedLetters((previous) =>
        previous.filter((letter) => String(letter.id) !== String(id))
      );
      setError("");
    } catch (err) {
      console.error("Error deleting offer:", err);
      setError(
        err.response?.data?.error ||
          "Failed to delete the offer letter. The database record was not removed."
      );
    }
  };

  const handleCreateNew = async () => {
    setDraftData({
      offer_id: "",
      candidate_id: "",
      candidate_name: "",
      email: "",
      mobile: "",
      designation: "",
      ctc: "",
      joining_date: "",
      address: "",
      offer_date: new Date().toISOString().split("T")[0],
    });

    setFormData({
      offer_id: "",
      candidate_id: "",
      candidate_name: "",
      email: "",
      mobile: "",
      designation: "",
      ctc: "",
      joining_date: "",
      address: "",
      offer_date: new Date().toISOString().split("T")[0],
    });

    setCurrentPage(0);
    setViewMode("form");
    setError("");
    await fetchNextOfferId();
  };

  const inputClass = "w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100 disabled:cursor-not-allowed disabled:opacity-60";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-7">
      {/* Error message */}
      {error && (
        <div className="relative mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 pr-12 text-sm text-red-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">!</span>
          <p>{error}</p>
          <button onClick={() => setError("")} aria-label="Dismiss error" className="absolute right-3 top-3 rounded-lg p-1 text-red-500 transition hover:bg-red-100">&times;</button>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-gray-900"><Mail size={21} /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Offer Letter</h3>
                <p className="mt-0.5 text-sm text-gray-500">Email the offer letter with its PDF attachment.</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} aria-label="Close email dialog" className="ml-auto rounded-lg px-2 py-1 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-800">&times;</button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className={labelClass}>To</label>
                <input type="email" name="to" value={emailData.to} onChange={handleEmailChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Subject</label>
                <input type="text" name="subject" value={emailData.subject} onChange={handleEmailChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Message</label>
                <textarea name="body" value={emailData.body} onChange={handleEmailChange} rows="5" className={`${inputClass} resize-y`} />
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button onClick={() => setShowEmailModal(false)} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Cancel</button>
                <button onClick={handleSendEmail} disabled={isSending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSending ? "Sending..." : "Send Email"} <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-5 flex flex-col gap-5 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-2">
        {/* Centered Title */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-yellow-400"></span>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Recruitment & Talent Acquisition</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Offer Letter Generator</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500">Create, manage and send professional offer letters to shortlisted candidates.</p>
        </div>
        <button onClick={() => { fetchOffers(); fetchCandidates(); }} disabled={loading || loadingCandidates} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-yellow-300 hover:bg-yellow-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading || loadingCandidates ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total Offer Letters</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-gray-900"><FileText size={19} /></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">{generatedLetters.length}</p>
          <p className="mt-1 text-xs text-gray-500">Saved offer records</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Shortlisted Candidates</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700"><Users size={19} /></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">{shortlistedCandidates.length}</p>
          <p className="mt-1 text-xs text-gray-500">Eligible for offer letters</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Latest Offer</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-gray-900"><CalendarDays size={19} /></div>
          </div>
          <p className="mt-3 truncate text-xl font-bold text-gray-900">{generatedLetters.length ? generatedLetters[generatedLetters.length - 1].offer_id || "Available" : "—"}</p>
          <p className="mt-1 text-xs text-gray-500">Most recently listed offer</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Next Offer ID</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700"><Plus size={19} /></div>
          </div>
          <p className="mt-3 truncate text-xl font-bold text-gray-900">{draftData.offer_id || "Loading..."}</p>
          <p className="mt-1 text-xs text-gray-500">Assigned by the backend</p>
        </div>
      </div>

      {/* VIEW TOGGLE */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-wrap justify-center gap-2">
          <button onClick={handleCreateNew} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${viewMode === "form" ? "bg-yellow-400 text-gray-900 shadow-sm hover:bg-yellow-300" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            <Plus size={17} /> Create Offer Letter
          </button>
          <button onClick={() => setViewMode("table")} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${viewMode === "table" ? "bg-yellow-400 text-gray-900 shadow-sm hover:bg-yellow-300" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            <FileText size={17} /> Generated Letters <span className={`rounded-lg px-2 py-0.5 text-xs ${viewMode === "table" ? "bg-white/60 text-gray-800" : "bg-gray-100 text-gray-600"}`}>{generatedLetters.length}</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generated Offer Letters</h2>
              <p className="mt-1 text-sm text-gray-500">Review saved offers and manage their records.</p>
            </div>
            <button onClick={handleCreateNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"><Plus size={16} /> New Offer</button>
          </div>
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw size={25} className="mx-auto animate-spin text-yellow-500" />
              <p className="mt-3 text-sm text-gray-500">Loading offer letters...</p>
            </div>
          ) : generatedLetters.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-gray-900"><FileText size={25} /></div>
              <p className="mt-4 font-semibold text-gray-800">No offer letters generated yet</p>
              <p className="mt-1 text-sm text-gray-500">Create an offer letter to see it listed here.</p>
              <button onClick={handleCreateNew} className="mt-4 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300">Create Offer Letter</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Offer ID</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Name</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Email</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Mobile</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Designation</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">CTC</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Joining Date</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">PDF Link</th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">Created Date</th>
                    <th className="whitespace-nowrap px-4 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {generatedLetters.map((letter) => (
                    <tr key={letter.id} className="transition hover:bg-yellow-50/50">
                      <td className="whitespace-nowrap px-4 py-4"><span className="inline-flex rounded-lg bg-yellow-100 px-2.5 py-1 text-xs font-bold text-gray-800">{letter.offer_id}</span></td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900">{letter.candidate_name}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">{letter.email}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">{letter.mobile || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">{letter.designation}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-800">{letter.ctc}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">{String(letter.joining_date || "").slice(0, 10) || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {letter.pdf_link ? (
                          <a href={`http://localhost:5000${letter.pdf_link}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-yellow-300 hover:bg-yellow-50">View PDF</a>
                        ) : (
                          <span className="text-xs text-gray-400">PDF unavailable</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">{new Date(letter.created_at || letter.date).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={handleSendMail} aria-label="Send offer letter by email" title="Send offer letter by email" className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600">
                            <Mail size={17} />
                          </button>
                          <button onClick={() => deleteLetter(letter.id)} aria-label="Delete offer letter" title="Delete offer letter" className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          {/* LEFT FORM */}
          <div className="h-full min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-4">
            <div className="mb-5 flex items-start gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-gray-900"><FileText size={21} /></div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Offer Letter Form</h2>
                <p className="mt-1 text-sm text-gray-500">Enter offer details below.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Offer ID</label>
                <input type="text" name="offer_id" placeholder="Offer ID" value={draftData.offer_id} readOnly className={`${inputClass} bg-gray-100 font-semibold`} />
                <p className="mt-1 text-xs text-gray-400">Automatically assigned by the system.</p>
              </div>
              <div>
                <label className={labelClass} htmlFor="candidate_id">Shortlisted Candidate</label>
                <select id="candidate_id" name="candidate_id" value={draftData.candidate_id} onChange={handleCandidateChange} disabled={loadingCandidates} className={inputClass}>
                  <option value="">
                    {loadingCandidates ? "Loading shortlisted candidates..." : "Select Shortlisted Candidate"}
                  </option>
                  {shortlistedCandidates.map((candidate) => (
                    <option key={candidate.candidate_id ?? candidate.id} value={candidate.candidate_id ?? candidate.id}>
                      {candidate.candidate_code || `candidate${String(candidate.candidate_id ?? candidate.id).padStart(3, "0")}`} — ID: {candidate.candidate_id ?? candidate.id} — {candidate.name || candidate.candidate_name}
                    </option>
                  ))}
                </select>
                {!loadingCandidates && shortlistedCandidates.length === 0 && (
                  <p className="mt-1.5 text-xs text-red-600">No shortlisted candidates are available.</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="candidate_name" placeholder="Full Name" value={draftData.candidate_name} readOnly className={`${inputClass} bg-gray-100`} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" name="email" placeholder="Email" value={draftData.email} readOnly className={`${inputClass} bg-gray-100`} />
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input type="text" name="mobile" placeholder="Mobile" value={draftData.mobile} onChange={handleDraftChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input type="text" name="designation" placeholder="Designation" value={draftData.designation} readOnly className={`${inputClass} bg-gray-100`} />
              </div>
              <div>
                <label className={labelClass}>Annual CTC</label>
                <div className="relative">
                  <IndianRupee size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="ctc" placeholder="Enter annual CTC" value={draftData.ctc} onChange={handleDraftChange} className={`${inputClass} pl-9`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Joining Date</label>
                <input type="date" name="joining_date" value={draftData.joining_date} onChange={handleDraftChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea name="address" placeholder="Enter candidate address" value={draftData.address} onChange={handleDraftChange} className={`${inputClass} resize-y`} rows="3" />
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !draftData.offer_id} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <><RefreshCw size={17} className="animate-spin" /> Saving Offer...</> : <><FileText size={17} /> Generate Now</>}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-gray-400">Check the candidate details before generating the offer letter.</p>
          </div>

          {/* RIGHT PREVIEW */}
          <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Document Preview</h2>
                <p className="mt-1 text-xs text-gray-500">Review the offer letter pages before downloading.</p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-2 py-1 sm:justify-center">
                <button onClick={prevPage} disabled={currentPage === 0} aria-label="Previous page" className={`rounded-lg p-1.5 transition ${currentPage === 0 ? "cursor-not-allowed text-gray-300" : "text-gray-700 hover:bg-yellow-100 hover:text-gray-900"}`}>
                  <ChevronLeft size={21} />
                </button>
                <span className="min-w-24 text-center text-sm font-semibold text-gray-700">Page {currentPage + 1} of {totalPages}</span>
                <button onClick={nextPage} disabled={currentPage === totalPages - 1} aria-label="Next page" className={`rounded-lg p-1.5 transition ${currentPage === totalPages - 1 ? "cursor-not-allowed text-gray-300" : "text-gray-700 hover:bg-yellow-100 hover:text-gray-900"}`}>
                  <ChevronRight size={21} />
                </button>
              </div>
            </div>

              <div ref={previewContainerRef} className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 p-2 sm:p-4">
                <div className="mx-auto w-full">
                  <div
                    className="relative mx-auto w-full"
                    style={{ aspectRatio: "794 / 1123" }}
                  >
                    <div
                      className="absolute left-0 top-0 origin-top-left"
                      style={{
                        width: "794px",
                        height: "1123px",
                        transform: `scale(${previewScale})`,
                      }}
                    >
                      <div
                        ref={letterRef}
                        className="w-[794px] min-w-[794px]"
                        style={{ boxSizing: "border-box" }}
                      >
                      {/* PAGE 1 */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white px-10 pb-6 pt-6 shadow" style={{ boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20">
                          <img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" />
                        </div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right">
                            <p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/ {formData.offer_id || "-------"}</p>
                            <p>{formData.offer_date}</p>
                          </div>
                          <h1 className="mb-6 text-center text-xl font-bold">Letter Of Offer</h1>
                          <p className="mb-2">
                            <span className="font-semibold">{formData.candidate_name || "-------"}</span>
                            <br />
                            Address: {formData.address || "--------------------------------------"}
                          </p>
                          <p className="mt-6">Dear <span className="font-semibold">{formData.candidate_name || "------------"}</span>,</p>
                          <p className="mt-4">Welcome to Nexora Technology Solutions Pvt. Ltd.</p>
                          <p className="mt-2 font-bold">Congratulations! We welcome you on board.</p>
                          <p className="mt-4 text-justify">
                            Thank you for showing interest in being a part of our organization. We are delighted to inform you that, following your successful interview process, <span className="font-semibold">NEXORA TECHNOLOGY SOLUTIONS PVT LTD</span> is offering you a position with our team. On behalf of Nexora Technology Solutions Pvt. Ltd., I am pleased to formally extend this offer of employment.
                          </p>
                          <p className="mt-4 text-justify">
                            Upon your acceptance, you will be appointed as <span className="font-semibold">{formData.designation || "Associate Software Engineer (ASE)"}</span>, with your joining date scheduled for <span className="font-semibold"> {formData.joining_date || "---------"}</span> at our office premises.
                          </p>
                          <p className="mt-4 text-justify">
                            This offer is contingent upon the standard terms and conditions of employment set forth by Nexora Technology Solutions and will be governed by the company's policies, rules, and guidelines. Upon joining, you will be required to sign and adhere to the Employee Non-Disclosure, Non-Solicitation, and Non-Competition Agreement. Your total annual Cost to Company (CTC) will be <span className="font-semibold">INR {formData.ctc || "---------"}</span> and a detailed breakup of your CTC will be provided at the time of joining.
                          </p>
                          <p className="mt-4 text-justify">
                            This employment offer from Nexora Technology Solutions Pvt Ltd is conditional upon the successful verification of the information you have provided.
                          </p>
                          <h2 className="mt-6 font-semibold">By accepting this offer, you also acknowledge and confirm that –</h2>
                          <ol className="ml-6 mt-2 list-decimal space-y-2 text-justify">
                            <li>You have lawfully ended your employment with your previous employer (if applicable), in accordance with their terms and conditions.</li>
                            <li>You confirm that you have no outstanding contractual obligations from any previous employment that would hinder your ability to undertake responsibilities or accept this position with the Company. Nexora Technology Solutions Pvt Ltd will not be held responsible for any dues or liabilities arising from the termination of your prior employment.</li>
                            <li>Additionally, you confirm that you are not bringing any intellectual property to the Company for which you do not hold sole ownership rights.</li>
                            <li>This offer will remain valid for a period of 2 days from the date of this letter. If you choose to accept the offer, please confirm your acceptance by email or telephone within 1 day of receiving this letter and submit a signed copy of this document by post. If we do not receive a response within this time frame, the offer will be considered withdrawn, and the Company will not be obligated to keep the position open</li>
                            <li>You will undergo training under your designated Team Lead/Developer/Senior.</li>
                            <li>Your official joining date will be <span className="font-semibold"> {formData.joining_date || "---------"}</span>. In case of changes, inform the Company in advance.</li>
                          </ol>
                          <div className="mt-10 text-center text-sm">
                            <p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p>
                            <p>4th Floor, Bizness Square, Opp. Hitec Entrance, Jubilee Hills, Hyderabad</p>
                            <p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p>
                            <p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p>
                          </div>
                        </div>
                      </div>

                      {/* PAGE 2 - Annexure I */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 1 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20">
                          <img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" />
                        </div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right">
                            <p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p>
                          </div>
                          <h1 className="mb-6 text-center text-lg font-bold">Annexure I</h1>
                          <p className="mb-2"><b>1.</b> You need to furnish the following Documents at the time of joining Nexora.</p>
                          <p className="mb-4"><b>NOTE:</b> Joining will not happen without these documents.</p>
                          <table className="w-full border border-black text-sm">
                            <tbody>
                              <tr><td className="w-6 border border-black p-2 font-bold">A</td><td className="border border-black p-2"><b>Original copy of Nexora offer letter</b></td></tr>
                              <tr><td className="border border-black p-2 font-bold">B</td><td className="border border-black p-2"><b>DATE OF BIRTH PROOF:</b> Mandatory is Aadhar Card. If no Aadhar Card or incomplete details on Aadhar card then the following will apply: (Any ONE of the following: Birth Certificate, Xth, XIIth Mark Sheet with DOB details on it, Passport, PAN Card, Driving License, School/College Leaving Certificate) â€“ <b>1 copy</b></td></tr>
                              <tr><td className="border border-black p-2 font-bold">C</td><td className="border border-black p-2"><b>PHOTO ID:</b> Aadhar OR PAN Card. In the absence of both then the following will apply: (One of the following: Voter's ID, Driving License, Passport, or Bank Passbook with photograph, Banker Verification, NSR (National Skills Registry) ID card) â€“ <b>Copy</b></td></tr>
                              <tr><td className="border border-black p-2 font-bold">D</td><td className="border border-black p-2"><b>PERMANENT ADDRESS PROOF:</b> (One of the following: Passport, Driving License, Voter's ID, Nationalized Bank Passbook with photograph and address, Electricity Bill â€“ latest of Self or Parent, Ration Card, LIC & Insurance documents, Mobile Bill, Telephone Landline Bill â€“ latest of Self or Parents, or Current lease deed â€“ with you or your parents / spouse as lessee or co-lessee) â€“ <b>1 copy</b>. The information for address needs to be verifiable during BGV and hence the same needs to be the latest permanent address proof.</td></tr>
                              <tr><td className="border border-black p-2 font-bold">E</td><td className="border border-black p-2"><b>EDUCATION QUALIFICATION PROOF:</b> (mark sheets & degree are important) (as applicable Xth, XIIth, Graduation, Post-Graduation Certificate, Copy of Diploma, others)</td></tr>
                              <tr><td className="border border-black p-2 font-bold">F</td><td className="border border-black p-2"><b>PASSPORT SIZE PHOTOGRAPHS:</b> 5 copies (with Red Background ONLY)</td></tr>
                              <tr><td className="border border-black p-2 font-bold">G</td><td className="border border-black p-2"><b>PAN NUMBER:</b> Photocopy of PAN Card. If you do not possess a PAN Card then an application for one will have to be made and a copy of the application receipt will have to be submitted.</td></tr>
                              <tr><td className="border border-black p-2 font-bold">H</td><td className="border border-black p-2"><b>Professional Relieving or Experience Letter</b> from previous employer (last 2 employments) or Accepted Resignation Letter from previous employer.</td></tr>
                              <tr><td className="border border-black p-2 font-bold">I</td><td className="border border-black p-2"><b>Salary Slip / Salary certification</b> from previous employer (last 2 employments). <b>Bank statement</b> if no salary slips from the company.</td></tr>
                              <tr><td className="border border-black p-2 font-bold">J</td><td className="border border-black p-2"><b>Employee ID Proof:</b> (photocopy of salary slips, appraisal letter which contains the employee id proof)</td></tr>
                              <tr><td className="border border-black p-2 font-bold">K</td><td className="border border-black p-2"><b>Marriage Certificate (if applicable)</b> OR Marriage Affidavit with Couple Photo</td></tr>
                              <tr><td className="border border-black p-2 font-bold">L</td><td className="border border-black p-2"><b>Self-declaration Medical Fitness form:</b> Medical Fitness form needs to be duly filled and stamped by a Doctor.</td></tr>
                            </tbody>
                          </table>
                          <div className="mt-10 text-center text-sm">
                            <p className="font-bold">Nexora Technology Solutions Pvt. Ltd</p>
                            <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p>
                            <p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p>
                            <p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p>
                          </div>
                        </div>
                      </div>

                      {/* PAGE 3 - Appendix A: Employment Terms */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 2 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20"><img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" /></div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right"><p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p></div>
                          <p className="mt-4 text-justify">We are delighted to welcome you to our organization and look forward to a long, rewarding, and mutually beneficial association. We trust that you will find this offer satisfactory and eagerly await your addition to the Nexora Technology Solutions Pvt Ltd family.</p>
                          <p className="mt-4">Best Regards</p>
                          <h2 className="mt-6 font-bold">APPENDIX A: Employment Terms and Conditions Profile Verification</h2>
                          <p className="mt-4 text-justify font-semibold">This offer is conditional upon the successful verification of the information you have provided during the interview and selection process. Should any discrepancies or falsified details be discovered at any stage of your employment, this offer letter and/or your employment with the Company will be terminated with immediate effect.</p>
                          <h3 className="mt-6 font-bold">Employee Duties and Responsibilities</h3>
                          <p className="mt-2 text-justify">You will begin your employment with the Company in the position specified in your Offer Letter. However, you may be assigned additional duties and responsibilities from time to time, as deemed necessary by the Company.</p>
                          <p className="mt-2 text-justify">You are expected to demonstrate a high level of initiative, efficiency, and dedication in all your work. All tasks—whether within your job profile or reasonably expected as part of your role—must be carried out diligently, competently, and to the satisfaction of the Company.</p>
                          <p className="mt-2 text-justify">It is your responsibility to ensure the quality and integrity of all work you are involved in, whether individually or as part of a team. As a valuable employee, you are expected to devote your time, effort, and skills exclusively toward fulfilling your responsibilities with the Company.</p>
                          <p className="mt-2 text-justify">During your employment, you agree not to engage in any commercial or business activity that may interfere with the availability or conflict with your professional obligations. However, you are free to participate in non-commercial, not-for-profit activities outside of your normal working hours, provided they do not affect your performance.</p>
                          <h3 className="mt-6 font-bold">CTC - Allowances & Components</h3>
                          <p className="mt-2 text-justify">The Gross Cost to Company (CTC), outlined in this contract, includes all statutory and associated components such as Provident Fund (PF), allowances, gratuity, insurance, and other applicable benefits. You will have the opportunity to discuss a detailed pay breakup at the time of joining, including the variable components with the Company.</p>
                          <h3 className="mt-6 font-bold">Performance & Appraisal</h3>
                          <p className="mt-2 text-justify">The Company at its sole discretion may award performance bonuses to employees, based on individual contributions and the overall performance of the organization.</p>
                          <h3 className="mt-6 font-bold">Tax</h3>
                          <p className="mt-2 text-justify">You will be solely responsible for any tax liabilities arising from your employment, including those owed to statutory authorities.</p>
                          <h3 className="mt-6 font-bold">Expenses and Reimbursement</h3>
                          <p className="mt-2 text-justify">You will be reimbursed for all reasonable and necessary out-of-pocket expenses incurred in the course of fulfilling your responsibilities, subject to the submission of valid bills, tickets, or supporting documents, and approved by your immediate supervisor.</p>
                          <div className="mt-10 text-center text-sm"><p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p><p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p><p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p><p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p></div>
                        </div>
                      </div>

                      {/* PAGE 4 - Travel, Increments, Posting, Medical, etc. */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 3 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20"><img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" /></div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right"><p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p></div>
                          <h3 className="mt-6 font-bold">Travel</h3>
                          <p className="mt-2 text-justify">As part of your employment, you may be required to travel. In such cases, you will be informed in advance to allow adequate time for preparation.</p>
                          <h3 className="mt-6 font-bold">Increments and Promotions</h3>
                          <p className="mt-2 text-justify">Your career progression within the Company will be determined solely by your performance and capabilities. Your individual contributions will be regularly evaluated by your managers, as well as through peer feedback, forming the basis for decisions regarding salary increments and promotions. Performance reviews will be conducted every six months to assess and guide your professional growth.</p>
                          <p className="mt-2 text-justify">You will be expected to continuously learn and adapt to the processes implemented at Nexora Technology Solutions Pvt Ltd. as the business evolves. Compliance with the Company's established quality standards is mandatory. Demonstrating adherence to these standards, along with your overall attitude toward maintaining quality, will be key factors in evaluating your performance.</p>
                          <h3 className="mt-6 font-bold">Posting / Transfer</h3>
                          <p className="mt-2 text-justify">While your initial posting will be as stated in the Offer Letter, you may be assigned to any department, office, or location of the Company, its partners, or customers—whether in India or abroad—based on your job requirements and the business needs, at the Company's discretion.</p>
                          <h3 className="mt-6 font-bold">Medical</h3>
                          <p className="mt-2 text-justify">The Company reserves the right to terminate your employment if valid medical evidence indicates that you are physically or mentally incapacitated to a degree that prevents you from fulfilling your assigned responsibilities.</p>
                          <h3 className="mt-6 font-bold">Working Hours, Holidays and Leave</h3>
                          <p className="mt-2 text-justify">Your standard weekly working hours are from <b>10:00 AM to 6:00 PM, Monday through Friday</b>. Saturdays and Sundays will generally be non-working days. Employees are entitled to 12 paid leaves annually, accrued at the rate of one leave per month of service. The Company provides 12 annual holidays, including national and festival holidays, applicable across all office branches. Except in cases of emergencies or medical necessity, leave requests must be submitted in advance through an online system and approved by your manager.</p>
                          <h3 className="mt-6 font-bold">Intellectual Property Rights</h3>
                          <p className="mt-2 text-justify">During your employment, all materials or intellectual property created or developed by you during the course of your employment, whether performed individually or as part of a team, in connection with your duties and responsibilities, will belong exclusively to Nexora Technology Solutions Pvt Ltd. You agree that all rights of intellectual property created during your employment shall be the sole property of the Company, and you shall execute all necessary documents to assign such rights unconditionally. Unauthorized use of such intellectual property for personal benefit is strictly prohibited.</p>
                          <h3 className="mt-6 font-bold">Non-Solicitation</h3>
                          <p className="mt-2 text-justify">During your employment with Nexora Technology Solutions Pvt Ltd, and for a period of one year following its termination, you agree not to solicit or encourage any employees of the Company to leave their employment for other pursuits. Additionally, you agree not to provide services, directly or indirectly, to any competitor, vendor, client, or affiliate that is in conflict with Nexora Technology Solutions Pvt Ltd. Furthermore, you agree not to, on your own behalf or on behalf of any other person or entity, solicit or attempt to entice any customers or prospective customers away from the Company.</p>
                          <div className="mt-10 text-center text-sm"><p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p><p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p><p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p><p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p></div>
                        </div>
                      </div>

                      {/* PAGE 5 - Non-Disclosure, Non-Compete, Training, Termination, Warranty */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 4 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20"><img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" /></div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right"><p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p></div>
                          <h3 className="mt-6 font-bold">Non-Disclosure</h3>
                          <p className="mt-2 text-justify">You agree to sign and be legally bound by the terms of the Non-Disclosure, Non-Solicitation, and Non-Competition Agreement throughout the duration of your employment with the Company and thereafter. Additionally, you commit to adhering to all Company policies regarding the protection of confidential information as updated from time to time. You are strictly required to maintain confidentiality concerning your remuneration and terms of employment and must not disclose or discuss such information with any other employee, except your immediate supervisor. Any unauthorized disclosure of confidential information will be regarded as a serious breach of conduct and a violation of your employment terms.</p>
                          <h3 className="mt-6 font-bold">Non-Compete</h3>
                          <p className="mt-2 text-justify">By accepting this position with the Company, you agree not to engage in any competing business or activities during your employment and for a period of one year following the termination of your employment. However, this restriction does not prevent you from seeking employment with other IT companies after your tenure with Nexora Technology Solutions Pvt Ltd has ended.</p>
                          <h3 className="mt-6 font-bold">Training</h3>
                          <p className="mt-2 text-justify">The Company may, at its discretion, arrange training sessions for employees either at the Company premises or at external locations. You will be required to attend these trainings and complete any associated assignments. During the training period, you will remain under evaluation until you meet the criteria established by Nexora. Please note that the salary during this training phase may differ from the amount stated in your offer letter, and the Company reserves the right to revise your compensation based on your progress and development.</p>
                          <h3 className="mt-6 font-bold">Personal Information</h3>
                          <p className="mt-2 text-justify">It is the employee's responsibility to keep their personal contact information current with the Company and promptly notify the Company of any changes. Additionally, you are required to inform the Company of any changes in your civil or marital status.</p>
                          <h3 className="mt-6 font-bold">Termination</h3>
                          <p className="mt-2 text-justify">On termination of your employment with the Company irrespective of the circumstances, you are bound to return to the Company:</p>
                          <ol className="ml-6 mt-2 list-decimal space-y-2 text-justify">
                            <li>Any material items belonging to the Company per inventory, and all non-material items in your possession including but not limited to intellectual property (documentation, software, email correspondence) and any other information required for the continued execution of the duties of your role (login credentials, business contact information).</li>
                            <li>Any physical company documents that you may have in your possession. You are also bound to repay any and all outstanding debts or loans due to the Company and the Company is hereby authorized to deduct from any payments due to the employee the amount due to the Company.</li>
                            <li>You will also be bound by any previous confidentiality, non-disclosure or non-compete agreements that you had signed as part of your employment until the individual termination of such contracts.</li>
                          </ol>
                          <h3 className="mt-6 font-bold">Warranty</h3>
                          <p className="mt-2 text-justify">You represent and warrant that the terms and conditions of your employment with the Company are lawful, valid, and binding upon you. By accepting this offer and fulfilling your obligations under this employment, you affirm that you are not, and will not be, in violation of any other agreement or understanding to which you are a party—including, but not limited to, any prior employment contracts—and that no such agreement will be breached or conflicted with as a result of your engagement with the Company.</p>
                          <div className="mt-10 text-center text-sm"><p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p><p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p><p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p><p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p></div>
                        </div>
                      </div>

                      {/* PAGE 6 - Breaches, Notice Period, Jurisdiction, Amendments */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 5 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20"><img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" /></div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right"><p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p></div>
                          <h3 className="mt-6 font-bold">Breaches and Violations</h3>
                          <p className="mt-2 text-justify">In addition to the terms outlined in this document, you may be subject to disciplinary actions—including but not limited to warnings, suspensions, demotion, or denial of promotions and increments—for any violations of the Company's code of conduct or policies. These policies and related Company manuals are considered integral parts of this Agreement. The Company reserves the right to modify or amend these terms and will notify employees accordingly. Employment may also be terminated following disciplinary action and a thorough investigation.</p>
                          <p className="mt-2 text-justify">Throughout your employment, you are required to comply with all rules, regulations, and policies established by the Company, including any revisions made at the Company's discretion from time to time, regardless of whether such updates are individually communicated to you. It is your responsibility to stay informed of these policies by regularly consulting the Company intranet or employee manual. Failure to adhere to these guidelines may result in disciplinary action by the Company.</p>
                          <h3 className="mt-6 font-bold">Notice Period</h3>
                          <p className="mt-2 text-justify">During your first year of employment, either party must provide a minimum of six months' notice to terminate this contract. After the first year, termination may be made by either party with a one-month notice period. The notice period begins from the date the termination letter is received by your manager. However, in cases such as policy violations or other serious breaches, the Company reserves the right to terminate your employment immediately, without prior notice. Additionally, your manager may terminate your employment on the spot without any prior intimation if circumstances warrant.</p>
                          <h3 className="mt-6 font-bold">Jurisdiction</h3>
                          <p className="mt-2 text-justify">Your employment shall be governed by and interpreted in accordance with the laws of India. Any disputes arising out of or in connection with your employment, including the terms and conditions thereof, shall fall under the exclusive jurisdiction of the courts located in Telangana/Hyderabad.</p>
                          <p className="mt-2 text-justify">Both parties further agree that any such disputes shall first be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitrator shall be appointed by the Company, and the arbitration process will commence within fifteen (15) days of either party receiving written notice of the dispute.</p>
                          <h3 className="mt-6 font-bold">Amendments</h3>
                          <p className="mt-2 text-justify">The Company reserves the right, at its sole discretion, to amend, replace, or revoke any of the terms mentioned above, as may be required by statutory changes or other circumstances. Any such modifications will be updated on the Company intranet and formally communicated to employees through appropriate channels. All employees are expected to comply with Company rules and policies as they evolve over time.</p>
                          <p className="mt-4 text-justify font-semibold">If you agree to accept this position, please confirm your acceptance in writing by signing below and specifying your intended date of joining. A copy of this letter will be provided for your records. Regardless of your decision to join Nexora Technology Solutions Pvt. Ltd., you are required to maintain strict confidentiality regarding the contents of this letter. All related correspondence should be clearly marked as "Confidential."</p>
                          <p className="mt-6 font-bold"><span className="font-semibold">{formData.candidate_name || "---------"}</span>{" "} , we take this opportunity to warmly welcome you to Nexora Technology Solutions Pvt. Ltd., and look forward to a successful association.</p>
                          <div className="mt-10 text-center text-sm"><p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p><p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081</p><p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p><p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p></div>
                        </div>
                      </div>

                      {/* PAGE 7 - Annexure II (Compensation Structure) */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 6 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20"><img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" /></div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right"><p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p></div>
                          <h2 className="mb-6 text-center text-lg font-bold">Annexure II</h2>
                          <p className="text-justify">NEXORA Technology Solutions Private Limited is pleased to extend the following compensation structure for your role, which includes statutory and company-level deductions:</p>
                          {(() => {
                            const ctc = parseInt(formData.ctc || 300000, 10);
                            const basic = Math.round(ctc * 0.48);
                            const hra = Math.round(ctc * 0.192);
                            const conveyance = 19000;
                            const medicalAllowance = 15000;
                            const epf = Math.round(basic * 0.12);
                            const gratuity = Math.round(basic * 0.0481);
                            const special = ctc - (basic + hra + conveyance + medicalAllowance + epf + gratuity);
                            const gross = ctc - (epf + 2400 + 30000 + 1440);
                            const deductions = epf + 2400 + 30000 + 1440;
                            const netTakeHome = gross;
                            return (
                              <>
                                <table className="mt-6 w-full border-collapse border text-sm">
                                  <thead><tr className="bg-gray-100"><th className="border px-2 py-1 text-left">Component</th><th className="border px-2 py-1">Monthly (₹)</th><th className="border px-2 py-1">Annual (₹)</th></tr></thead>
                                  <tbody>
                                    <tr><td className="border px-2 py-1">Basic Salary</td><td className="border px-2 py-1">{(basic / 12).toLocaleString()}</td><td className="border px-2 py-1">{basic.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">House Rent Allowance (HRA)</td><td className="border px-2 py-1">{(hra / 12).toLocaleString()}</td><td className="border px-2 py-1">{hra.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">Conveyance Allowance</td><td className="border px-2 py-1">{(conveyance / 12).toLocaleString()}</td><td className="border px-2 py-1">{conveyance.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">Medical Allowance</td><td className="border px-2 py-1">{(medicalAllowance / 12).toLocaleString()}</td><td className="border px-2 py-1">{medicalAllowance.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">Special Allowance</td><td className="border px-2 py-1">{(special / 12).toLocaleString()}</td><td className="border px-2 py-1">{special.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">Employer Provident Fund (12%)</td><td className="border px-2 py-1">{(epf / 12).toLocaleString()}</td><td className="border px-2 py-1">{epf.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">Gratuity (4.81% of Basic)</td><td className="border px-2 py-1">{(gratuity / 12).toLocaleString()}</td><td className="border px-2 py-1">{gratuity.toLocaleString()}</td></tr>
                                    <tr className="bg-gray-100 font-bold"><td className="border px-2 py-1">Total Cost to Company (CTC)</td><td className="border px-2 py-1">--</td><td className="border px-2 py-1">₹{ctc.toLocaleString()}</td></tr>
                                  </tbody>
                                </table>
                                <table className="mt-6 w-full border-collapse border text-sm">
                                  <thead><tr className="bg-gray-100"><th className="border px-2 py-1">Deduction</th><th className="border px-2 py-1">Monthly (₹)</th><th className="border px-2 py-1">Annual (₹)</th></tr></thead>
                                  <tbody>
                                    <tr><td className="border px-2 py-1">Employee Provident Fund (12%)</td><td className="border px-2 py-1">{(epf / 12).toLocaleString()}</td><td className="border px-2 py-1">{epf.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1">Professional Tax (Telangana)</td><td className="border px-2 py-1">200</td><td className="border px-2 py-1">2,400</td></tr>
                                    <tr><td className="border px-2 py-1">NEXORA Internal Recovery (Infra)</td><td className="border px-2 py-1">2,500</td><td className="border px-2 py-1">30,000</td></tr>
                                    <tr><td className="border px-2 py-1">Digital Resource Fee</td><td className="border px-2 py-1">120</td><td className="border px-2 py-1">1,440</td></tr>
                                    <tr className="bg-gray-100 font-bold"><td className="border px-2 py-1">Total Deductions</td><td className="border px-2 py-1">{(deductions / 12).toLocaleString()}</td><td className="border px-2 py-1">{deductions.toLocaleString()}</td></tr>
                                  </tbody>
                                </table>
                                <table className="mt-6 w-full border-collapse border text-sm">
                                  <tbody>
                                    <tr><td className="border px-2 py-1 font-bold">Gross Salary (before deductions)</td><td className="border px-2 py-1">{(gross / 12).toLocaleString()}</td><td className="border px-2 py-1">{gross.toLocaleString()}</td></tr>
                                    <tr><td className="border px-2 py-1 font-bold">Net Take-Home Salary</td><td className="border px-2 py-1">₹{(netTakeHome / 12).toLocaleString()}</td><td className="border px-2 py-1">₹{netTakeHome.toLocaleString()}</td></tr>
                                  </tbody>
                                </table>
                              </>
                            );
                          })()}
                          <div className="mt-6 text-sm">
                            <p><b>1.</b> Gratuity is payable upon completion of 5 years of continuous service with NEXORA.</p>
                            <p><b>2.</b> Professional Tax is deducted as per Telangana regulations.</p>
                            <p><b>3.</b> Income Tax, if applicable, will be deducted per IT laws and employee declarations.</p>
                            <p><b>4.</b> Structure may be revised based on performance, statutory compliance, or company policy.</p>
                            <p><b>5.</b> Net take-home salary is indicative and may vary based on applicable deductions and tax declarations.</p>
                          </div>
                          <div className="mt-10 text-center text-sm"><p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p><p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad</p><p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p><p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p></div>
                        </div>
                      </div>

                      {/* PAGE 8 - Acceptance */}
                      <div className="page relative mx-auto h-[1123px] w-[794px] shrink-0 overflow-hidden bg-white p-10 shadow" style={{ display: currentPage === 7 ? "block" : "none", boxSizing: "border-box" }}>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-20"><img src={logo2} alt="Watermark" className="h-[500px] w-[500px] max-w-none shrink-0 object-contain object-center" /></div>
                        <img src={logo} alt="Company Logo" className="absolute left-4 top-4 h-[72px] w-[175px] object-contain object-left-top" />
                        <div className="relative z-10">
                          <div className="mb-4 text-right"><p className="text-sm font-semibold text-green-700">NEXORA/HYD/HR/2025/OFR-ASE/{formData.offer_id || "-------"}</p></div>
                          <h2 className="mb-6 text-lg font-bold">Acceptance</h2>
                          <p className="mb-6 text-justify">I, <span className="font-semibold">{formData.candidate_name || "---------"}</span>, hereby confirm my acceptance of all the above-mentioned terms and conditions, and I agree to join as per the offer.</p>
                          <div className="mt-10">
                            <p>Yours faithfully,</p><p className="mt-2">For Nexora Ltd.</p><p className="mt-6 font-signature text-lg italic">frederick</p><p className="font-semibold">Frederick</p><p>Head Of Indian Operations - Talent Acquisition</p>
                          </div>
                          <div className="mt-12">
                            <p>I accept the terms of this letter.</p>
                            <div className="mt-6 space-y-4">
                              <p><span className="font-bold">Signature :</span>{" "}<span className="text-green-600 underline">____________</span></p>
                              <p><span className="font-bold">Date :</span> _____________</p>
                              <p><span className="font-bold">Name :</span>{" "}{formData.candidate_name || "____________"}</p>
                            </div>
                          </div>
                          <div className="mt-20 text-center text-sm">
                            <p className="font-bold">Nexora Technology Solutions Pvt. Ltd.</p>
                            <p>4th Floor, Bizness Square, Opp Hitec Entrance, Jubilee Enclave, HITEC City, Hyderabad</p>
                            <p>Email: <a href="mailto:info@nexora.com" className="text-blue-600">info@nexora.com</a></p>
                            <p>Website: <a href="http://www.nexora.com" className="text-blue-600">www.nexora.com</a></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-600">Offer document · A4 format</p>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]"></span>
                  </span>
                  <span className="text-xs ml-1 font-medium text-gray-600">Nexora Technology Solutions</span>
                </div>
              </div>
              {viewMode === "form" && (
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-yellow-300"
                  >
                    <FileText size={17} />
                    Download PDF
                  </button>
                  <button
                    onClick={handleSendMail}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-yellow-300"
                  >
                    <Mail size={18} />
                    Send Mail
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferLetter;