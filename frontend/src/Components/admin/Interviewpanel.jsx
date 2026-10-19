import React, { useState, useRef, useEffect } from 'react';
import { Calendar, UserCheck, LayoutDashboard, UserPlus, Star, Users, CheckCircle, Clock, Award, X } from 'lucide-react';
import axios from 'axios';

// Candidate Dropdown Component
const CandidateDropdown = ({ value, onChange, required = true }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('http://localhost:5000/api/employees');
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.employees || response.data.data || [];

        setEmployees(data.filter((employee) => employee.user_id || employee.userId));
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Unable to load employees. Please check the backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div>
      <select
        name="candidate_id"
        value={value}
        onChange={onChange}
        required={required}
        disabled={loading || Boolean(error)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">
          {loading ? 'Loading employees...' : error ? 'Employees unavailable' : 'Select employee'}
        </option>
        {employees.map((employee, index) => {
          const userId = employee.user_id || employee.userId;
          const name =
            employee.name ||
            employee.employee_name ||
            employee.full_name ||
            employee.fullName ||
            employee.username ||
            'Name not available';

          return (
            <option key={userId || index} value={userId}>
              {userId} - {name}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {!loading && !error && employees.length === 0 && (
        <p className="mt-1 text-sm text-slate-500">No employees found.</p>
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
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.users || response.data.data || [];

        const filteredInterviewers = data.filter((user) => {
          const role = String(user.role || '').trim().toLowerCase();
          return user.user_id && ['admin', 'hr'].includes(role);
        });

        setInterviewers(filteredInterviewers);
      } catch (err) {
        console.error(
          'Error fetching HR/Admin interviewers:',
          err.response?.data || err.message
        );
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
        {interviewers.map((user) => (
          <option key={user.user_id} value={user.name || user.user_id}>
            {user.user_id} - {user.name || 'Name not available'} ({String(user.role).toUpperCase()})
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
    { label: 'Total Interviews', value: total, icon: Users, iconStyle: 'bg-gray-100 text-gray-700', accent: 'bg-gray-800' },
    { label: 'Completed', value: completed, icon: CheckCircle, iconStyle: 'bg-yellow-100 text-yellow-700', accent: 'bg-yellow-500' },
    { label: 'Pending', value: pending, icon: Clock, iconStyle: 'bg-gray-100 text-gray-600', accent: 'bg-gray-400' },
    { label: 'Shortlisted', value: shortlisted, icon: Award, iconStyle: 'bg-yellow-100 text-yellow-700', accent: 'bg-yellow-500', clickable: true }
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, iconStyle, accent, clickable }) => (
        <button
          key={label}
          type="button"
          onClick={clickable ? onShortlistedClick : undefined}
          className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${clickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500' : 'cursor-default'}`}
          aria-label={clickable ? 'View shortlisted candidates' : label}
        >
          <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}><Icon size={23} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-500">{label}</span>
            <span className="mt-1 block text-2xl font-bold tracking-tight text-slate-900">{value ?? 0}</span>
          </span>
          {clickable && <span className="text-slate-400 transition group-hover:text-yellow-600"><Award size={18} /></span>}
        </button>
      ))}
    </div>
  );
};

// ScheduleForm Component
const ScheduleForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    candidate_id: "",
    role: "",
    date: "",
    time: "",
    status: "completed"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/interviews/schedule", formData);

      if (response.status === 201) {
        alert("Interview scheduled successfully!");
        setFormData({
          candidate_id: "",
          role: "",
          date: "",
          time: "",
          status: "completed"
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert("Scheduling failed.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Calendar className="text-yellow-700" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Schedule Interview</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Id</label>
          <CandidateDropdown
            value={formData.candidate_id}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
    interviewer_name: "",
    candidate_id: "",
    round: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/interviews/assign", formData);

      if (response.status === 201) {
        alert("Interview assigned successfully!");
        setFormData({
          interviewer_name: "",
          candidate_id: "",
          round: ""
        });
        onSuccess?.(); // Refresh parent component (if needed)
      }
    } catch (error) {
      console.error("Error assigning interview:", error);
      alert("Assignment failed.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <UserPlus className="text-yellow-700" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Assign Interview</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Interviewer Name</label>
          <InterviewerDropdown
            value={formData.interviewer_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Id</label>
          <CandidateDropdown
            value={formData.candidate_id}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Round</label>
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
    candidate_id: "",
    interviewer: "",
    feedback: "",
    rating: 0
  });

  const [hoverRating, setHoverRating] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingClick = (value) => {
    setFormData({
      ...formData,
      rating: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/interviews/feedback", formData);

      if (response.status === 201) {
        alert("Feedback submitted successfully!");
        setFormData({
          candidate_id: "",
          interviewer: "",
          feedback: "",
          rating: 0
        });
        setHoverRating(0);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Feedback submission failed.");
    }
  };


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Star className="text-yellow-700" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Submit Feedback</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Id</label>
          <CandidateDropdown
            value={formData.candidate_id}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Interviewer Name</label>
          <InterviewerDropdown
            value={formData.interviewer}
            onChange={(e) =>
              setFormData({
                ...formData,
                interviewer: e.target.value
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
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
          <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill={
                  star <= (hoverRating || formData.rating) ? "gold" : "lightgray"
                }
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(star)}
                className="w-8 h-8 cursor-pointer"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.285-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69l1.286-3.97z" />
              </svg>
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
    candidate_id: "",
    status: "shortlisted",
  });
  const [candidates, setCandidates] = useState({ shortlisted: [], rejected: [] });

  const fetchCandidates = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/interviews/shortlist");
      const data = response.data;

      const shortlisted = data.filter((c) => c.status === "shortlisted");
      const rejected = data.filter((c) => c.status === "rejected");

      setCandidates({ shortlisted, rejected });

      // Notify parent component about the updated counts
      if (onShortlistUpdate) {
        onShortlistUpdate(shortlisted.length, rejected.length);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  // useEffect(() => {
  //   fetchCandidates();
  // }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/interviews/shortlist", formData);

      if (response.status === 201) {
        alert("Candidate shortlisted successfully!");
        setFormData({ candidate_id: "", status: "shortlisted" });
        fetchCandidates(); // Refresh list after adding

        // Notify parent component about the update
        if (onShortlistUpdate) {
          onShortlistUpdate(
            response.data.status === "shortlisted" ? candidates.shortlisted.length + 1 : candidates.shortlisted.length,
            response.data.status === "rejected" ? candidates.rejected.length + 1 : candidates.rejected.length
          );
        }
      }
    } catch (error) {
      console.error("Error submitting shortlist:", error);
      alert("Shortlisting failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
            <UserCheck className="text-yellow-700" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Candidate Evaluation</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Id</label>
            <CandidateDropdown
              value={formData.candidate_id}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 flex items-center text-lg font-bold text-emerald-700">
            <CheckCircle size={18} className="mr-2" /> Shortlisted Candidates
          </h2>
          {candidates.shortlisted.length === 0 ? (
            <p className="text-slate-500 text-sm">No shortlisted candidates yet.</p>
          ) : (
            <div className="space-y-3">
              {candidates.shortlisted.map((c, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="font-medium text-slate-900">{c.candidate_id || c.candidate_name}</p>
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
          {candidates.rejected.length === 0 ? (
            <p className="text-slate-500 text-sm">No rejected candidates yet.</p>
          ) : (
            <div className="space-y-3">
              {candidates.rejected.map((c, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="font-medium text-slate-900">{c.candidate_id || c.candidate_name}</p>
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
  const [darkMode, ] = useState(false);
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
    try {
      const response = await axios.get("http://localhost:5000/api/interviews/dashboard");
      if (response.status === 200) {
        setStats({
          total: response.data.totalInterviews,
          completed: response.data.completed,
          pending: response.data.pending,
          shortlisted: response.data.shortlisted
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
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
    setIsModalOpen(true);
    setShortlistLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/interviews/shortlist");
      const rows = Array.isArray(response.data) ? response.data : [];
      setShortlistedCandidates(rows.filter((candidate) => String(candidate.status || '').toLowerCase() === 'shortlisted').map((candidate) => ({
        ...candidate,
        name: candidate.candidate_name || candidate.name || candidate.candidate_id || 'Unnamed candidate',
        role: candidate.role || 'Role not specified'
      })));
    } catch (error) {
      console.error("Error fetching shortlisted candidates:", error);
      setShortlistedCandidates([]);
      alert(error.response?.data?.error || "Could not load shortlisted candidates.");
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleShortlistUpdate = (shortlistedCount, rejectedCount) => {
    // Update the stats when a candidate is shortlisted or rejected
    setStats(prevStats => ({
      ...prevStats,
      shortlisted: shortlistedCount
    }));

    // Refresh the dashboard stats
    fetchStats();
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const tabClass = (tabName) =>
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
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-700">Human Resources · Administration</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Interview Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage interview schedules, assignments, feedback and candidate outcomes.</p>
          </div>
          <button type="button" onClick={fetchStats} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-400 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500">Refresh dashboard</button>
        </header>

        {/* Tab Navigation */}
        <nav className="mb-7 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>
              <LayoutDashboard size={18} className="mr-2 inline" /> Dashboard
            </button>
            <button onClick={() => setActiveTab('schedule')} className={tabClass('schedule')}>
              <Calendar size={18} className="mr-2 inline" /> Schedule
            </button>
            <button onClick={() => setActiveTab('assign')} className={tabClass('assign')}>
              <UserPlus size={18} className="mr-2 inline" /> Assign
            </button>
            <button onClick={() => setActiveTab('feedback')} className={tabClass('feedback')}>
              <Star size={18} className="mr-2 inline" /> Feedback
            </button>
            <button onClick={() => setActiveTab('shortlist')} className={tabClass('shortlist')}>
              <UserCheck size={18} className="mr-2 inline" /> Shortlist
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-7xl">
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Overview</h2>
                <p className="mt-1 text-sm text-slate-500">A real-time summary from your interview database.</p>
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
          {activeTab === 'shortlist' && <ShortlistForm onShortlistUpdate={handleShortlistUpdate} />}
        </main>
        </div>

        {/* Shortlisted Candidates Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-slate-900">Shortlisted Candidates</h2>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {shortlistLoading ? (
                  <p className="py-8 text-center text-sm text-slate-500">Loading shortlisted candidates...</p>
                ) : shortlistedCandidates.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {shortlistedCandidates.map((candidate, index) => (
                      <li key={index} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-center">
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
                  <p className="text-slate-500 text-center py-6">No shortlisted candidates found.</p>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                <button
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
