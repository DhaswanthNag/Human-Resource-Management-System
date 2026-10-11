import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarPlus, CalendarClock, PartyPopper, Calendar, Link as LinkIcon, Pencil, Trash2, Gift } from "lucide-react";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";

function Calendarandmeeting({ meetings: parentMeetings, setMeetings: setParentMeetings, currentUser }) {
  const [meetings, setMeetings] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "internal",
    link: "",
    employeeId: "",
  });

  const [newHoliday, setNewHoliday] = useState({
    title: "",
    date: "",
  });

  const [editIndex, setEditIndex] = useState(null);
  const [showHolidays, setShowHolidays] = useState(false);

  const API_URL = "http://localhost:5000/api/meetings";
  const HOLIDAY_API = "http://localhost:5000/api/holidays";

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await axios.get(API_URL);
        const data = res.data.map((m) => ({
          id: m.id,
          title: m.meeting_title,
          type: m.meeting_type,
          link: m.meeting_link,
          start: new Date(m.start_time),
          end: m.end_time ? new Date(m.end_time) : null,
          employeeId: m.employee_id || "",
        }));
        setMeetings(data);
        setParentMeetings(data);
      } catch (err) {
        console.error("Error fetching meetings:", err);
      }
    };
    const fetchHolidays = async () => {
      try {
        const res = await axios.get(HOLIDAY_API);
        const data = res.data.map((h) => ({
          id: h.id,
          title: h.holiday_title,
          start: new Date(h.holiday_date),
          allDay: true,
          type: "holiday",
        }));
        setHolidays(data);
      } catch (err) {
        console.error("Error fetching holidays:", err);
      }
    };

    fetchMeetings();
    fetchHolidays();
  }, [setParentMeetings]);

  const handleDateClick = (info) => {
    setNewMeeting({ ...newMeeting, date: info.dateStr });
    setNewHoliday({ ...newHoliday, date: info.dateStr });
  };

  const handleAddOrEditMeeting = async (e) => {
    e.preventDefault();
    if (
      !newMeeting.title ||
      !newMeeting.date ||
      !newMeeting.startTime ||
      !newMeeting.employeeId ||
      !newMeeting.link
    ) {
      alert("Please fill all required fields including Employee ID and Meeting Link.");
      return;
    }

    const startDateTime = `${newMeeting.date}T${newMeeting.startTime}`;
    const endDateTime = newMeeting.endTime ? `${newMeeting.date}T${newMeeting.endTime}` : null;

    const payload = {
      meeting_title: newMeeting.title,
      meeting_type: newMeeting.type,
      meeting_link: newMeeting.link,
      start_time: startDateTime,
      end_time: endDateTime,
      employee_id: newMeeting.employeeId,
    };

    try {
      if (editIndex !== null) {
        const id = meetings[editIndex].id;
        const res = await axios.put(`${API_URL}/${id}`, payload);
        const updated = res.data;
        const updatedEvents = [...meetings];
        updatedEvents[editIndex] = {
          id: updated.id,
          title: updated.meeting_title,
          type: updated.meeting_type,
          link: updated.meeting_link,
          start: new Date(updated.start_time),
          end: updated.end_time ? new Date(updated.end_time) : null,
          employeeId: updated.employee_id || "",
        };
        setMeetings(updatedEvents);
        setParentMeetings(updatedEvents);
        setEditIndex(null);
      } else {
        const res = await axios.post(API_URL, payload);
        const created = res.data;
        const newEvents = [
          ...meetings,
          {
            id: created.id,
            title: created.meeting_title,
            type: created.meeting_type,
            link: created.meeting_link,
            start: new Date(created.start_time),
            end: created.end_time ? new Date(created.end_time) : null,
            employeeId: created.employee_id || "",
          },
        ];
        setMeetings(newEvents);
        setParentMeetings(newEvents);
      }

      setNewMeeting({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        type: "internal",
        link: "",
        employeeId: "",
      });
    } catch (err) {
      console.error("Error adding/editing meeting:", err);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      const filtered = meetings.filter((m) => m.id !== id);
      setMeetings(filtered);
      setParentMeetings(filtered);
      setEditIndex(null);
    } catch (err) {
      console.error("Error deleting meeting:", err);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.title || !newHoliday.date) {
      alert("Please enter holiday title and date.");
      return;
    }

    const payload = {
      holiday_title: newHoliday.title,
      holiday_date: newHoliday.date,
    };

    try {
      const res = await axios.post(HOLIDAY_API, payload);
      const created = res.data;
      const newEvents = [
        ...holidays,
        {
          id: created.id,
          title: created.holiday_title,
          start: new Date(created.holiday_date),
          allDay: true,
          type: "holiday",
        },
      ];
      setHolidays(newEvents);

      setNewHoliday({
        title: "",
        date: "",
      });
    } catch (err) {
      console.error("Error adding holiday:", err);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await axios.delete(`${HOLIDAY_API}/${id}`);
      const filtered = holidays.filter((h) => h.id !== id);
      setHolidays(filtered);
    } catch (err) {
      console.error("Error deleting holiday:", err);
    }
  };

  return (
    <motion.div className="min-h-screen p-0 bg-gray-50 mr-5">
      <h1 className="text-3xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gray-700">
        Calendar & Meetings
      </h1>
      <br />

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          className="col-span-1 lg:col-span-2 bg-white shadow-lg rounded-2xl p-4 overflow-x-auto min-w-0 w-full"
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={[
              ...meetings,
              ...holidays.map((h) => ({
                ...h,
                backgroundColor: "#f7d529ff",
                borderColor: "#f8f671ff",
              })),
            ]}
            dateClick={handleDateClick}
            eventDidMount={(info) => {
              if (info.event.extendedProps.type === "holiday") {
                tippy(info.el, {
                  content: `<strong>Holiday:</strong> ${info.event.title}`,
                  allowHTML: true,
                });
              } else if (info.event.extendedProps.link) {
                tippy(info.el, {
                  content: `<strong>${info.event.title}</strong><br/>Type: ${info.event.extendedProps.type}<br/>🔗 <a href="${info.event.extendedProps.link}" target="_blank">Join Meeting</a>`,
                  allowHTML: true,
                });
              }
            }}
            height="75vh"
          />
        </motion.div>

        {/* Sidebar */}
        <motion.div className="lg:col-span-1 bg-white shadow-lg rounded-2xl p-4 flex flex-col">
          {/* Meetings Form */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            {editIndex !== null ? (
              "Edit Meeting"
            ) : (
              <>
                <Plus className="w-5 h-5 text-yellow-500" />
                Add Meeting
              </>
            )}
          </h2>

          <form onSubmit={handleAddOrEditMeeting} className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Meeting Title"
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
              required
            />
            <input
              type="date"
              value={newMeeting.date}
              onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
              required
            />
            <input
              type="time"
              value={newMeeting.startTime}
              onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
              required
            />
            <input
              type="time"
              value={newMeeting.endTime}
              onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
            />
            <select
              value={newMeeting.type}
              onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
              required
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
            <input
              type="url"
              placeholder="Meeting Link"
              value={newMeeting.link}
              onChange={(e) => setNewMeeting({ ...newMeeting, link: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
            />
            <input
              type="text"
              placeholder="Employee ID"
              value={newMeeting.employeeId}
              onChange={(e) => setNewMeeting({ ...newMeeting, employeeId: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
            />
            <button className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-800 transition text-sm">
              {editIndex !== null ? "Update Meeting" : "Add Meeting"}
            </button>
          </form>

          {/* Holiday Form */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-yellow-500" />
            Add Holiday
          </h2>
          <form onSubmit={handleAddHoliday} className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Holiday Title"
              value={newHoliday.title}
              onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
              required
            />
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300 text-sm"
              required
            />
            <button className="w-full bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-800 transition text-sm">
              Add Holiday
            </button>
          </form>

          {/* Upcoming Meetings */}
          <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-700 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-yellow-500" />
              Upcoming Meetings
            </span>
            <span className="bg-yellow-500 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
              {meetings.length}
            </span>
          </h2>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-40 sm:max-h-52 pr-2 mb-6">
            {meetings.map((event, index) => (
              <motion.div
                key={event.id}
                className={`p-3 rounded-lg shadow-sm flex flex-col text-sm ${
                  event.type === "internal"
                    ? "bg-blue-50 border-l-4 border-yellow-500"
                    : "bg-green-50 border-l-4 border-gray-500"
                }`}
              >
                <span className="font-semibold text-gray-900">
                  {event.title} ({event.type})
                </span>
                <span className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {new Date(event.start).toLocaleString()}
                </span>

                <div className="flex gap-2 mt-2">
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded-lg text-xs hover:bg-gray-700 transition"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Join
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditIndex(index);
                      setNewMeeting({
                        title: event.title,
                        date: event.start.toISOString().split("T")[0],
                        startTime: event.start.toISOString().slice(11, 16),
                        endTime: event.end ? event.end.toISOString().slice(11, 16) : "",
                        type: event.type,
                        link: event.link,
                        employeeId: event.employeeId,
                      });
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(event.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Accordion Toggle Section for Upcoming Holidays */}
          <div className="mb-3">
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl shadow hover:shadow-md focus:outline-none transition"
              onClick={() => setShowHolidays((prev) => !prev)}
              aria-expanded={showHolidays}
              aria-controls="holidays-section"
            >
            <span className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <PartyPopper className="w-5 h-5 text-pink-600" />
              Upcoming Holidays
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {holidays.length}
              </span>
            </span>
              <svg
                className={`w-5 h-5 ml-2 transform transition-transform ${
                  showHolidays ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {showHolidays && (
                <motion.div
                  id="holidays-section"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {holidays.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center px-2 py-6 col-span-2">
                      No upcoming holidays.
                    </div>
                  ) : (
                    holidays.map((holiday, i) => (
                      <motion.div
                        key={holiday.id}
                        className="bg-white border border-red-200 shadow-lg flex flex-col items-start px-4 py-4 rounded-xl mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.06 }}
                      >
                        <div className="flex items-center mb-2">
                      <span className="text-red-700 text-xl mr-2">
                        <Gift className="w-4 h-4 text-red-700" />
                      </span>
                          <span className="font-bold text-gray-800">{holiday.title}</span>
                        </div>

                        <span className="text-xs text-gray-600 mt-0 mb-2 flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(holiday.start).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>

                        <button
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="flex items-center gap-1 mt-2 px-2 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Calendarandmeeting;
