import React, { useState, useRef, useEffect } from 'react';
import { Calendar,LayoutDashboard, Star, Users, CheckCircle, Clock, Award, X } from 'lucide-react';
import axios from 'axios';
// Dashboard Component
const Dashboard = ({ onShortlistedClick, stats }) => {
  const { total, completed, pending, shortlisted } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
          <Users className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Interviews</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{total}</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mr-4">
          <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completed</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{completed}</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg mr-4">
          <Clock className="text-amber-600 dark:text-amber-400" size={24} />
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{pending}</h2>
        </div>
      </div>

      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center cursor-pointer hover:shadow-md transition-shadow"
        onClick={onShortlistedClick}
      >
        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4">
          <Award className="text-purple-600 dark:text-purple-400" size={24} />
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Shortlisted</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{shortlisted}</h2>
        </div>
      </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="bg-gray-200 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
          <Calendar className="text-gray-700 dark:text-blue-400" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Schedule Interview</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Candidate Name</label>
          <input
            type="text"
            name="candidate_id"
            placeholder="Enter candidate name"
            value={formData.candidate_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <input
            type="text"
            name="role"
            placeholder="Enter role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-700 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Schedule Interview
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="bg-gray-200 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
          <Star className="text-gray-700 dark:text-blue-400" size={20} />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Submit Feedback</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Candidate Name</label>
          <input
            type="text"
            name="candidate_id"
            placeholder="Enter candidate name"
            value={formData.candidate_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interviewer Name</label>
          <input
            type="text"
            name="interviewer"
            placeholder="Enter interviewer name"
            value={formData.interviewer}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback</label>
          <textarea
            name="feedback"
            placeholder="Enter your feedback"
            value={formData.feedback}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
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
          className="w-full bg-gray-700 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

// Main InterviewPanelDashboard Component
const HRInterviewPanel = () => {
  const [, setMenuOpen] = useState(false);
  const [darkMode,] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
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
    try {
      // API call would go here in a real implementation
      // Mock data for demonstration
      const mockData = [
        // { name: "John Doe", role: "Frontend Developer" },
        // { name: "Jane Smith", role: "UX Designer" },
        // { name: "Michael Brown", role: "Backend Engineer" },
        // { name: "Sarah Johnson", role: "Product Manager" }
      ];
      setShortlistedCandidates(mockData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching shortlisted candidates:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const tabClass = (tabName) =>
    `px-5 py-3 rounded-lg transition-all flex items-center font-medium ${
      activeTab === tabName
        ? 'bg-gray-700 dark:bg-blue-900/40 text-white dark:text-blue-300'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
    <div className="p-0 sm:p-0 bg-gray-50 dark:from-gray-900 dark:via-gray-800 mt-6 dark:to-gray-700 min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">

        {/* Header */}
        {/* <header className="flex items-center justify-between py-5 bg-blue-900 mb-8">
          <div className="relative" ref={menuRef}>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
            Interview Panel Dashboard
          </h1>
        </header> */}

        {/* Tab Navigation */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm ml-4 mr-4 rounded-xl p-2 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap justify-center gap-x-8 sm:gap-x-16 lg:gap-x-32 gap-y-4 px-4">
            <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>
              <LayoutDashboard size={18} className="mr-2 inline" /> Dashboard
            </button>
            <button onClick={() => setActiveTab('schedule')} className={tabClass('schedule')}>
              <Calendar size={18} className="mr-2 inline" /> Schedule
            </button>
            {/* <button onClick={() => setActiveTab('assign')} className={tabClass('assign')}>
              <UserPlus size={18} className="mr-2 inline" /> Assign
            </button> */}
            <button onClick={() => setActiveTab('feedback')} className={tabClass('feedback')}>
              <Star size={18} className="mr-2 inline" /> Feedback
            </button>
            {/* <button onClick={() => setActiveTab('shortlist')} className={tabClass('shortlist')}>
              <UserCheck size={18} className="mr-2 inline" /> Shortlist
            </button> */}
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto ml-6 mr-4">
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Interview Dashboard</h1>
              <Dashboard stats={stats} onShortlistedClick={handleShortlistedClick} />
            </div>
          )}
          {activeTab === 'schedule' && <ScheduleForm onSuccess={fetchStats} />}
          {/* {activeTab === 'assign' && <AssignForm onSuccess={() => console.log("Success")} />} */}
          {activeTab === 'feedback' && <FeedbackForm onSuccess={fetchStats} />}
          {/* {activeTab === 'shortlist' && <ShortlistForm />} */}
        </main>

        {/* Shortlisted Candidates Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shortlisted Candidates</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {shortlistedCandidates.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {shortlistedCandidates.map((candidate, index) => (
                      <li key={index} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{candidate.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.role}</p>
                          </div>
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-3 py-1 rounded-full">
                            Shortlisted
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-6">No shortlisted candidates found.</p>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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