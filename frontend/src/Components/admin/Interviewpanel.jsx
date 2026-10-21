import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, UserCheck, LayoutDashboard, UserPlus, Star, Users, CheckCircle, Clock, Award, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

const getArray = (data, key) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.[key])
      ? data[key]
      : Array.isArray(data?.data)
        ? data.data
        : [];

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
        const response = await axios.get(`${API_URL}/candidates`, getAuthConfig());
        const data = getArray(response.data, 'candidates');
        setCandidates(
          data.filter(candidate => candidate.candidate_id != null || candidate.id != null)
        );
      } catch (err) {
        console.error('Error fetching candidates:', err.response?.data || err.message);
        setError(
          err.response?.status === 401
            ? 'Please log in again to load candidates.'
            : 'Unable to load candidates. Please check the backend.'
        );
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
          const candidateCode =
            candidate.candidate_code || `candidate${String(candidateId).padStart(3, '0')}`;
          const name =
            candidate.name ||
            candidate.candidate_name ||
            candidate.full_name ||
            candidate.fullName ||
            'Name not available';

          return (
            <option
              key={`${candidateCode}-${index}`}
              value={candidateCode}
            >
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

        if (!localStorage.getItem('token')) {
          setError('Please log in again to load interviewers.');
          return;
        }

        const response = await axios.get(`${API_URL}/users/interviewers`, getAuthConfig());
        const data = getArray(response.data, 'users');

        setInterviewers(
          data.filter(
            user =>
              user.user_id &&
              ['admin', 'hr'].includes(String(user.role || '').trim().toLowerCase())
          )
        );
      } catch (err) {
        console.error('Error fetching HR/Admin interviewers:', err.response?.data || err.message);
        setError(
          err.response?.status === 401
            ? 'Your session has expired. Please log in again.'
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
        name="interviewer_name"
        value={value}
        onChange={onChange}
        required={required}
        disabled={loading || Boolean(error) || interviewers.length === 0}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-slate-100"
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
        {interviewers.map((user, index) => (
          <option key={`${user.user_id}-${index}`} value={user.name || user.user_id}>
            {user.user_id} - {user.name || 'Name not available'} (
            {String(user.role).toUpperCase()})
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {!loading && !error && interviewers.length === 0 && (
        <p className="mt-1 text-sm text-slate-500">No HR/Admin accounts found.</p>
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
          className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            clickable
              ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500'
              : 'cursor-default'
          }`}
          aria-label={clickable ? 'View shortlisted candidates' : label}
        >
          <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
          >
            <Icon size={23} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-500">{label}</span>
            <span className="mt-1 block text-2xl font-bold tracking-tight text-slate-900">
              {value ?? 0}
            </span>
          </span>
          {clickable && (
            <span className="text-slate-400 transition group-hover:text-yellow-600">
              <Award size={18} />
            </span>
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

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_URL}/interviews/schedule`,
        formData,
        getAuthConfig()
      );

      if (response.status === 201 || response.status === 200) {
        alert('Interview scheduled successfully!');
        setFormData({
          candidate_id: '',
          role: '',
          date: '',
          time: '',
          status: 'pending'
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error scheduling interview:', error.response?.data || error.message);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Scheduling failed.'
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Calendar className="text-yellow-700" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Schedule Interview</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Candidate Id</label>
          <CandidateDropdown value={formData.candidate_id} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <input
            type="text"
            name="role"
            placeholder="Enter role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          Schedule Interview
        </button>
      </form>
    </div>
  );
};

// AssignForm Component
const AssignForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    interviewer_name: '',
    candidate_id: '',
    round: ''
  });

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_URL}/interviews/assign`,
        formData,
        getAuthConfig()
      );

      if (response.status === 201 || response.status === 200) {
        alert('Interview assigned successfully!');
        setFormData({ interviewer_name: '', candidate_id: '', round: '' });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error assigning interview:', error.response?.data || error.message);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Assignment failed.'
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <UserPlus className="text-yellow-700" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Assign Interview</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Interviewer Name
          </label>
          <InterviewerDropdown
            value={formData.interviewer_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Candidate Id</label>
          <CandidateDropdown value={formData.candidate_id} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Round</label>
          <input
            type="text"
            name="round"
            placeholder="Technical, HR, etc."
            value={formData.round}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          Assign Interview
        </button>
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

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.rating) {
      alert('Please select a rating from 1 to 5.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/interviews/feedback`,
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
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error.response?.data || error.message);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Feedback submission failed.'
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Star className="text-yellow-700" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Submit Feedback</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Candidate Id</label>
          <CandidateDropdown value={formData.candidate_id} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Interviewer Name
          </label>
          <InterviewerDropdown
            value={formData.interviewer}
            onChange={e =>
              setFormData(prev => ({ ...prev, interviewer: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Feedback</label>
          <textarea
            name="feedback"
            placeholder="Enter your feedback"
            value={formData.feedback}
            onChange={handleChange}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} out of 5`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                className="cursor-pointer"
              >
                <Star
                  className="h-8 w-8"
                  fill={star <= (hoverRating || formData.rating) ? 'gold' : 'lightgray'}
                  color={star <= (hoverRating || formData.rating) ? 'gold' : 'lightgray'}
                />
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

// ShortlistForm Component
const ShortlistForm = ({ onShortlistUpdate }) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    status: 'shortlisted'
  });
  const [candidates, setCandidates] = useState({
    shortlisted: [],
    rejected: []
  });
  const [loading, setLoading] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/interviews/shortlist`, getAuthConfig());
      const data = getArray(response.data, 'shortlists');
      const shortlisted = data.filter(
        candidate => String(candidate.status || '').toLowerCase() === 'shortlisted'
      );
      const rejected = data.filter(
        candidate => String(candidate.status || '').toLowerCase() === 'rejected'
      );

      setCandidates({ shortlisted, rejected });
      onShortlistUpdate?.(shortlisted.length, rejected.length);
    } catch (error) {
      console.error('Error fetching evaluated candidates:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, [onShortlistUpdate]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_URL}/interviews/shortlist`,
        formData,
        getAuthConfig()
      );

      if (response.status === 201 || response.status === 200) {
        alert(
          formData.status === 'shortlisted'
            ? 'Candidate shortlisted successfully!'
            : 'Candidate rejected successfully!'
        );
        setFormData({ candidate_id: '', status: 'shortlisted' });
        await fetchCandidates();
      }
    } catch (error) {
      console.error('Error submitting candidate evaluation:', error.response?.data || error.message);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Candidate evaluation failed.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
            <UserCheck className="text-yellow-700" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Candidate Evaluation</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Candidate Id</label>
            <CandidateDropdown value={formData.candidate_id} onChange={handleChange} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Submit Evaluation
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 flex items-center text-lg font-bold text-emerald-700">
            <CheckCircle size={18} className="mr-2" /> Shortlisted Candidates
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading candidates...</p>
          ) : candidates.shortlisted.length === 0 ? (
            <p className="text-sm text-slate-500">No shortlisted candidates yet.</p>
          ) : (
            <div className="space-y-3">
              {candidates.shortlisted.map((candidate, index) => (
                <div
                  key={`${candidate.id ?? candidate.candidate_id ?? candidate.candidate_name ?? 'candidate'}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3"
                >
                  <p className="font-medium text-slate-900">
                    {candidate.candidate_name || candidate.name || candidate.candidate_id}
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    Shortlisted
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 flex items-center text-lg font-bold text-red-700">
            <X size={18} className="mr-2" /> Rejected Candidates
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading candidates...</p>
          ) : candidates.rejected.length === 0 ? (
            <p className="text-sm text-slate-500">No rejected candidates yet.</p>
          ) : (
            <div className="space-y-3">
              {candidates.rejected.map((candidate, index) => (
                <div
                  key={`${candidate.id ?? candidate.candidate_id ?? candidate.candidate_name ?? 'candidate'}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-3"
                >
                  <p className="font-medium text-slate-900">
                    {candidate.candidate_name || candidate.name || candidate.candidate_id}
                  </p>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                    Rejected
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main InterviewPanelDashboard Component
const InterviewPanel = () => {
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

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/interviews/dashboard`, getAuthConfig());

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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShortlistedClick = useCallback(async () => {
    setIsModalOpen(true);
    setShortlistLoading(true);

    try {
      const response = await axios.get(`${API_URL}/interviews/shortlist`, getAuthConfig());
      const rows = getArray(response.data, 'shortlists');

      setShortlistedCandidates(
        rows
          .filter(candidate => String(candidate.status || '').toLowerCase() === 'shortlisted')
          .map(candidate => ({
            ...candidate,
            name:
              candidate.candidate_name ||
              candidate.name ||
              candidate.candidate_id ||
              'Unnamed candidate',
            role: candidate.role || 'Role not specified'
          }))
      );
    } catch (error) {
      console.error('Error fetching shortlisted candidates:', error.response?.data || error.message);
      setShortlistedCandidates([]);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Could not load shortlisted candidates.'
      );
    } finally {
      setShortlistLoading(false);
    }
  }, []);

  const handleShortlistUpdate = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  const closeModal = () => setIsModalOpen(false);

  const tabClass = tabName =>
    `inline-flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
      activeTab === tabName
        ? 'bg-slate-900 text-white shadow-sm'
        : 'text-slate-600 hover:bg-yellow-50 hover:text-slate-900'
    }`;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
        {/* Header */}
        {/* Tab Navigation */}
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 lg:px-8">
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1 w-9 shrink-0 rounded-full bg-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                  INTERVIEW &amp; RECRUITMENT PANEL
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Interview Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage interview schedules, assignments, feedback and candidate outcomes.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchStats}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-400 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Refresh dashboard
            </button>
          </header>

          {/* Tab Navigation */}
          <nav className="mb-7 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={tabClass('dashboard')}
              >
                <LayoutDashboard size={18} className="mr-2 inline" /> Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={tabClass('schedule')}
              >
                <Calendar size={18} className="mr-2 inline" /> Schedule
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assign')}
                className={tabClass('assign')}
              >
                <UserPlus size={18} className="mr-2 inline" /> Assign
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className={tabClass('feedback')}
              >
                <Star size={18} className="mr-2 inline" /> Feedback
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shortlist')}
                className={tabClass('shortlist')}
              >
                <UserCheck size={18} className="mr-2 inline" /> Shortlist
              </button>
            </div>
          </nav>

          <main className="mx-auto w-full max-w-7xl">
            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    A real-time summary from your interview database.
                  </p>
                </div>
                <Dashboard stats={stats} onShortlistedClick={handleShortlistedClick} />
                <button
                  type="button"
                  onClick={handleShortlistedClick}
                  disabled={shortlistLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-yellow-400 hover:bg-yellow-50 disabled:opacity-60"
                >
                  <Award size={18} className="text-yellow-600" />
                  {shortlistLoading
                    ? 'Loading shortlisted candidates...'
                    : 'View shortlisted candidates'}
                </button>
              </div>
            )}
            {activeTab === 'schedule' && <ScheduleForm onSuccess={fetchStats} />}
            {activeTab === 'assign' && <AssignForm onSuccess={fetchStats} />}
            {activeTab === 'feedback' && <FeedbackForm onSuccess={fetchStats} />}
            {activeTab === 'shortlist' && (
              <ShortlistForm onShortlistUpdate={handleShortlistUpdate} />
            )}
          </main>
        </div>

        {/* Shortlisted Candidates Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-slate-900">Shortlisted Candidates</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                {shortlistLoading ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Loading shortlisted candidates...
                  </p>
                ) : shortlistedCandidates.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {shortlistedCandidates.map((candidate, index) => (
                      <li
                        key={`${candidate.id ?? candidate.candidate_id ?? candidate.candidate_name ?? 'candidate'}-${index}`}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{candidate.name}</p>
                            <p className="text-sm text-slate-500">{candidate.role}</p>
                          </div>
                          <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800">
                            Shortlisted
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-slate-500">
                    No shortlisted candidates found.
                  </p>
                )}
              </div>
              <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-200"
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

export default InterviewPanel;
