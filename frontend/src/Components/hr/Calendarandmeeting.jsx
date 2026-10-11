import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarClock, PartyPopper, Calendar, Link as LinkIcon, Pencil, Trash2, Gift } from "lucide-react";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";

function Calendarandmeeting({ meetings: parentMeetings, setMeetings: setParentMeetings }) {
  const [meetings, setMeetings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "internal",
    link: "",
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
  };

  const handleAddOrEditMeeting = async (e) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.date || !newMeeting.startTime) return;

    const startDateTime = `${newMeeting.date}T${newMeeting.startTime}`;
    const endDateTime = newMeeting.endTime ? `${newMeeting.date}T${newMeeting.endTime}` : null;

    const payload = {
      meeting_title: newMeeting.title,
      meeting_type: newMeeting.type,
      meeting_link: newMeeting.link,
      start_time: startDateTime,
      end_time: endDateTime,
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
          },
        ];
        setMeetings(newEvents);
        setParentMeetings(newEvents);
      }

      setNewMeeting({ title: "", date: "", startTime: "", endTime: "", type: "internal", link: "" });
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
    } catch (err) {
      console.error("Error deleting meeting:", err);
    }
  };

  // const handleEditMeeting = (index) => {
  //   const meeting = meetings[index];
  //   setNewMeeting({
  //     title: meeting.title,
  //     date: meeting.start.toISOString().split("T")[0],
  //     startTime: meeting.start.toTimeString().slice(0, 5),
  //     endTime: meeting.end ? meeting.end.toTimeString().slice(0, 5) : "",
  //     type: meeting.type,
  //     link: meeting.link,
  //   });
  //   setEditIndex(index);
  // };

  useEffect(() => {
    const now = new Date();
    meetings.forEach((event) => {
      if (!event.start) return;
      const eventTime = new Date(event.start).getTime();
      const reminderTime = eventTime - 10 * 60 * 1000;
      const delay = reminderTime - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          alert(`🔔 Reminder: "${event.title}" starts in 10 minutes.\nLink: ${event.link || "No link provided"}`);
        }, delay);
      }
    });
  }, [meetings]);

  return (
    <motion.div className="min-h-screen p-4 sm:p-0 bg-gray-50">
      <h1 className="text-3xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gray-700">
        Calendar & Meetings
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-4">
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

        {/* Meetings Sidebar */}
        <motion.div className="lg:col-span-1 bg-white shadow-lg rounded-2xl p-5 flex flex-col">
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
            <button
              type="submit"
              className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-800 transition text-sm"
            >
              {editIndex !== null ? "Update Meeting" : "Add Meeting"}
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

          <div className="space-y-2 overflow-y-auto max-h-72 pr-2 mb-6">
            {meetings.map((event, index) => (
              <motion.div
                key={event.id}
                className={`p-3 rounded-lg shadow-sm flex flex-col text-sm ${
                  event.type === "internal"
                    ? "bg-blue-50 border-l-4 border-yellow-500"
                    : "bg-green-50 border-l-4 border-gray-500"
                }`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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

          {/* Holidays Collapsible Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowHolidays(!showHolidays)}
              className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl shadow hover:shadow-md focus:outline-none transition"
            >
              <span className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <PartyPopper className="w-5 h-5 text-pink-600" />
                Upcoming Holidays
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {holidays.length}
                </span>
              </span>
              <svg
                className={`w-6 h-6 transform transition-transform duration-300 ${
                  showHolidays ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {showHolidays && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
                >
                  {holidays.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center col-span-2 py-6">
                      No upcoming holidays.
                    </div>
                  ) : (
                    holidays.map((holiday, idx) => (
                      <motion.div
                        key={holiday.id}
                        className="bg-white border border-red-200 shadow-lg flex items-center px-3 py-4 rounded-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                      <span className="text-red-400 text-2xl mr-3">
                        <Gift className="w-6 h-6 text-red-700" />
                      </span>
                      <div>
                        <span className="font-bold text-gray-800">{holiday.title}</span>
                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(holiday.start).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
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
