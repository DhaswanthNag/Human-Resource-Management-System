// frontend/src/Components/hr/Interviewpanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  LayoutDashboard,
  Star,
  Users,
  CheckCircle,
  Clock,
  Award,
  X,
  ArrowUpRight,
  UserRound,
  MessageSquare,
  CalendarDays,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

// Shared authentication configuration for protected HR APIs
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {}
  };
};

// Candidate Dropdown Component
const CandidateDropdown = ({ value, onChange, required = true }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(
          'http://localhost:5000/api/candidates',
          getAuthConfig()
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.candidates || response.data.data || [];
        setCandidates(data.filter(candidate => candidate.candidate_id != null || candidate.id != null));
      } catch (err) {
        console.error('Error fetching candidates:', err.response?.data || err.message);
        setError(err.response?.status === 401
          ? 'Your session is invalid or expired. Please log in again.'
          : err.response?.status === 403
            ? 'You do not have permission to view these candidates.'
            : 'Unable to load candidates. Please check the backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  return (
    <div>
      <select
        name="candidate_id"
        value={value}
        onChange={onChange}
        required={required}
        disabled={loading || Boolean(error)}
        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        <option value="">
          {loading ? 'Loading candidates...' : error ? 'Candidates unavailable' : 'Select candidate'}
        </option>
        {candidates.map((candidate, index) => {
          const candidateId = candidate.candidate_id ?? candidate.id;
          const candidateCode = candidate.candidate_code || `candidate${String(candidateId).padStart(3, '0')}`;
          const name = candidate.name || candidate.candidate_name || candidate.full_name || candidate.fullName || 'Name not available';
          return (
            <option key={candidateId ?? index} value={candidateCode}>
              ID: {candidateId} | {candidateCode} - {name}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {!loading && !error && candidates.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No candidates found.</p>
      )}
    </div>
  );
};

// Interviewer Dropdown Component
const InterviewerDropdown = ({ value, onChange, required = true }) => {
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Please log in again to load interviewers.');
          return;
        }

        const response = await axios.get(
          'http://localhost:5000/api/users/interviewers',
          getAuthConfig()
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.users || response.data.data || [];

        const filteredInterviewers = data.filter((user) => {
          const role = String(user.role || '').trim().toLowerCase();
          return (user.user_id || user.userId) && ['admin', 'hr'].includes(role);
        });

        setInterviewers(filteredInterviewers);
      } catch (err) {
        console.error('Error fetching HR/Admin interviewers:', err.response?.data || err.message);
        setError(
          err.response?.status === 401
            ? 'Your session is invalid or expired. Please log in again.'
            : err.response?.status === 403
              ? 'Only Admin/HR accounts can load interviewers.'
              : 'Unable to load HR/Admin accounts. Please check the backend API.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewers();
  }, []);

  return (
    <div>
      <select
        name="interviewer"
        value={value}
        onChange={onChange}
        required={required}
        disabled={loading || Boolean(error) || interviewers.length === 0}
        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        <option value="">
          {loading
            ? 'Loading interviewers...'
            : error
              ? 'Interviewers unavailable'
              : interviewers.length === 0
                ? 'No HR/Admin accounts found'
                : 'Select HR/Admin interviewer'}
        </option>
        {interviewers.map((user, index) => {
          const userId = user.user_id || user.userId;
          const name = user.name || user.full_name || user.fullName || user.username;
          return (
            <option key={userId || index} value={name || userId}>
              {userId} - {name || 'Name not available'} ({String(user.role).toUpperCase()})
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {!loading && !error && interviewers.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No HR/Admin accounts found.</p>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ onShortlistedClick, stats }) => {
  const { total, completed, pending, shortlisted } = stats;

  const cards = [
    {
      label: 'Total Interviews',
      value: total,
      icon: Users,
      iconStyle: 'bg-gray-100 text-gray-700',
      accent: 'bg-gray-800'
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle,
      iconStyle: 'bg-yellow-100 text-yellow-700',
      accent: 'bg-yellow-500'
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      iconStyle: 'bg-gray-100 text-gray-600',
      accent: 'bg-gray-400'
    },
    {
      label: 'Shortlisted',
      value: shortlisted,
      icon: Award,
      iconStyle: 'bg-yellow-100 text-yellow-700',
      accent: 'bg-yellow-500',
      clickable: true
    }
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, iconStyle, accent, clickable }) => (
        <button
          key={label}
          type="button"
          onClick={clickable ? onShortlistedClick : undefined}
          aria-label={clickable ? 'View shortlisted candidates' : label}
          className={`group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:shadow-md ${
            clickable
              ? 'cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-yellow-500'
              : 'cursor-default'
          }`}
        >
          <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
            <Icon size={23} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gray-500">{label}</span>
            <span className="mt-1 block text-2xl font-bold tracking-tight text-gray-900">{value}</span>
          </span>
          {clickable && (
            <ArrowUpRight size={17} className="shrink-0 text-gray-400 transition group-hover:text-yellow-600" />
          )}
        </button>
      ))}
    </div>
  );
};

// ScheduleForm Component
const ScheduleForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    role: '',
    date: '',
    time: '',
    status: 'pending'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!localStorage.getItem('token')) {
      alert('Your session has expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/interviews/schedule',
        formData,
        getAuthConfig()
      );

      if (response.status === 200 || response.status === 201) {
        alert('Interview scheduled successfully!');
        setFormData({
          candidate_id: '',
          role: '',
          date: '',
          time: '',
          status: 'pending'
        });
        await onSuccess?.();
      }
    } catch (error) {
      console.error('Error scheduling interview:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert('Your session is invalid or expired. Please log in again.');
      } else {
        alert(error.response?.data?.message || error.response?.data?.error || 'Failed to schedule interview. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500';

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Calendar size={21} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Schedule Interview</h2>
          <p className="mt-0.5 text-sm text-gray-500">Add the candidate and interview details below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Candidate Name</label>
            <CandidateDropdown value={formData.candidate_id} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Role</label>
            <input type="text" name="role" placeholder="Enter role" value={formData.role} onChange={handleChange} className={fieldClass} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className={fieldClass} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Time</label>
            <input type="time" name="time" value={formData.time} onChange={handleChange} className={fieldClass} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={fieldClass}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <CalendarDays size={17} />
            {submitting ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </div>
      </form>
    </div>
  );
};

// FeedbackForm Component
const FeedbackForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    interviewer: '',
    feedback: '',
    rating: 0
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingClick = (value) => {
    setFormData({ ...formData, rating: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.rating) {
      alert('Please select a rating.');
      return;
    }

    if (!localStorage.getItem('token')) {
      alert('Your session has expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/interviews/feedback',
        formData,
        getAuthConfig()
      );

      if (response.status === 201 || response.status === 200) {
        alert('Feedback submitted successfully!');
        setFormData({
          candidate_id: '',
          interviewer: '',
          feedback: '',
          rating: 0
        });
        setHoverRating(0);
        await onSuccess?.();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert('Your session is invalid or expired. Please log in again.');
      } else {
        alert(error.response?.data?.error || error.response?.data?.message || 'Feedback submission failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500';

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Star size={21} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Submit Feedback</h2>
          <p className="mt-0.5 text-sm text-gray-500">Record your assessment of the candidate.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Candidate Name</label>
            <CandidateDropdown value={formData.candidate_id} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Interviewer Name</label>
            <InterviewerDropdown value={formData.interviewer} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">Feedback</label>
            <textarea name="feedback" placeholder="Enter your feedback" value={formData.feedback} onChange={handleChange} rows={4} className={`${fieldClass} resize-y`} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">Rating</label>
            <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Candidate rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  aria-pressed={formData.rating === star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onFocus={() => setHoverRating(star)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => handleRatingClick(star)}
                  className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <Star size={30} className={star <= (hoverRating || formData.rating) ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'} />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-500">
                {formData.rating ? `${formData.rating}/5` : 'Select rating'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <MessageSquare size={17} />
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Main InterviewPanelDashboard Component
const HRInterviewPanel = () => {
  const [, setMenuOpen] = useState(false);
  const [darkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef(null);

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    shortlisted: 0
  });

  const fetchStats = async () => {
    if (!localStorage.getItem('token')) {
      console.error('Cannot fetch interview statistics: no authentication token found.');
      return;
    }

    try {
      const response = await axios.get(
        'http://localhost:5000/api/interviews/dashboard',
        getAuthConfig()
      );

      if (response.status === 200) {
        setStats({
          total: Number(response.data.totalInterviews ?? response.data.total ?? 0),
          completed: Number(response.data.completed ?? 0),
          pending: Number(response.data.pending ?? 0),
          shortlisted: Number(response.data.shortlisted ?? 0)
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShortlistedClick = async () => {
    if (!localStorage.getItem('token')) {
      alert('Your session has expired. Please log in again.');
      return;
    }

    setShortlistLoading(true);
    setIsModalOpen(true);

    try {
      const response = await axios.get(
        'http://localhost:5000/api/interviews/shortlist',
        getAuthConfig()
      );

      const rows = Array.isArray(response.data) ? response.data : [];

      setShortlistedCandidates(
        rows.map((candidate) => ({
          ...candidate,
          name: candidate.candidate_name || candidate.name || candidate.candidate_id || 'Unnamed candidate',
          role: candidate.role || 'Role not specified',
          status: candidate.status || 'Shortlisted'
        }))
      );
    } catch (error) {
      console.error('Error fetching shortlisted candidates:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert('Your session is invalid or expired. Please log in again.');
      } else {
        alert(error.response?.data?.error || error.response?.data?.message || 'Could not load shortlisted candidates.');
      }
    } finally {
      setShortlistLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const tabClass = (tabName) =>
    `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 sm:px-5 ${
      activeTab === tabName
        ? 'bg-gray-800 text-white shadow-sm'
        : 'text-gray-600 hover:bg-yellow-50 hover:text-gray-900'
    }`;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="mt-4 min-h-screen bg-gray-50 p-3 text-gray-800 transition-colors duration-300 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-9 shrink-0 rounded-full bg-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                INTERVIEW & RECRUITMENT PANEL.HR
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Interview Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Monitor interview progress and candidate outcomes.</p>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50 sm:self-auto"
          >
            <RefreshCw size={16} /> Refresh stats
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="mb-6 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('schedule')} className={tabClass('schedule')}>
              <Calendar size={18} /> Schedule
            </button>
            <button onClick={() => setActiveTab('feedback')} className={tabClass('feedback')}>
              <Star size={18} /> Feedback
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-7xl">
          {activeTab === 'dashboard' && (
            <div>
              <Dashboard stats={stats} onShortlistedClick={handleShortlistedClick} />
              <button
                type="button"
                onClick={handleShortlistedClick}
                disabled={shortlistLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-yellow-400 hover:bg-yellow-50 disabled:opacity-60"
              >
                <Award size={18} className="text-yellow-600" />
                {shortlistLoading ? 'Loading shortlisted candidates...' : 'View shortlisted candidates'}
              </button>
            </div>
          )}
          {activeTab === 'schedule' && <ScheduleForm onSuccess={fetchStats} />}
          {activeTab === 'feedback' && <FeedbackForm onSuccess={fetchStats} />}
        </main>

        {/* Shortlisted Candidates Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                    <Award size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Shortlisted Candidates</h2>
                    <p className="text-sm text-gray-500">{shortlistedCandidates.length} candidate(s)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close shortlisted candidates"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {shortlistLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <RefreshCw size={18} className="animate-spin" /> Loading candidates...
                  </div>
                ) : shortlistedCandidates.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {shortlistedCandidates.map((candidate, index) => (
                      <li
                        key={candidate.id || candidate.candidate_id || `${candidate.name}-${index}`}
                        className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <UserRound size={19} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{candidate.name}</p>
                            <p className="mt-0.5 text-sm text-gray-500">{candidate.role}</p>
                          </div>
                        </div>
                        <span className="inline-flex w-fit items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold capitalize text-yellow-800">
                          {candidate.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                      <Users size={23} />
                    </div>
                    <p className="font-semibold text-gray-800">No shortlisted candidates found</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Candidates will appear here when shortlist records are available.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRInterviewPanel;
