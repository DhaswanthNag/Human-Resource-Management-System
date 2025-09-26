import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion } from "framer-motion";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";

function Calendarandmeeting({ meetings: parentMeetings, setMeetings: setParentMeetings }) {
  const [meetings, setMeetings] = useState([]);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "internal",
    link: "",
  });
  const [editIndex, setEditIndex] = useState(null);

  const API_URL = "http://localhost:5000/api/meetings";

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await axios.get(API_URL);
        const data = res.data.map((m) => ({
          id: m.id,
          title: m.meeting_title, // using meeting_title from DB
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
    fetchMeetings();
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

  const handleEditMeeting = (index) => {
    const meeting = meetings[index];
    setNewMeeting({
      title: meeting.title,
      date: meeting.start.toISOString().split("T")[0],
      startTime: meeting.start.toTimeString().slice(0, 5),
      endTime: meeting.end ? meeting.end.toTimeString().slice(0, 5) : "",
      type: meeting.type,
      link: meeting.link,
    });
    setEditIndex(index);
  };

  // Reminder
  useEffect(() => {
    const now = new Date();
    meetings.forEach((event) => {
      if (!event.start) return;
      const eventTime = new Date(event.start).getTime();
      const reminderTime = eventTime - 10 * 60 * 1000;
      const delay = reminderTime - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          alert(
            `🔔 Reminder: "${event.title}" starts in 10 minutes.\nLink: ${event.link || "No link provided"}`
          );
        }, delay);
      }
    });
  }, [meetings]);

  return (
    <motion.div className="min-h-screen p-0 sm:p-0 bg-gradient-to-br from-blue-400 via-white to-blue-50">

     <header className="flex items-center justify-between py-5 bg-blue-900 mb-8 px-6">
          {/* Centered Title */}
          <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
             📅 Calendar & Meetings
            </h1>
          </div>
        </header>

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
            events={meetings}
            dateClick={handleDateClick}
            eventDidMount={(info) => {
              if (info.event.extendedProps.link) {
                tippy(info.el, {
                  content: `<strong>${info.event.title}</strong><br/>Type: ${info.event.extendedProps.type}<br/>🔗 <a href="${info.event.extendedProps.link}" target="_blank">Join Meeting</a>`,
                  allowHTML: true,
                });
              }
            }}
            height="75vh"
          />
        </motion.div>

        {/* Form + Upcoming */}
        <motion.div className="lg:col-span-1 bg-white shadow-lg rounded-2xl p-5 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            {editIndex !== null ? "✏️ Edit Meeting" : "➕ Add Meeting"}
          </h2>

          <form onSubmit={handleAddOrEditMeeting} className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Meeting Title"
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
              required
            />
            <input
              type="date"
              value={newMeeting.date}
              onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
              required
            />
            <input
              type="time"
              value={newMeeting.startTime}
              onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
              required
            />
            <input
              type="time"
              value={newMeeting.endTime}
              onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <select
              value={newMeeting.type}
              onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
            <input
              type="url"
              placeholder="Meeting Link"
              value={newMeeting.link}
              onChange={(e) => setNewMeeting({ ...newMeeting, link: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition text-sm"
            >
              {editIndex !== null ? "Update Meeting" : "Add Meeting"}
            </button>
          </form>

          {/* Upcoming Meetings */}
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-700 flex justify-between items-center">
              📌 Upcoming Meetings
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {meetings.length}
              </span>
            </h2>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-72 pr-2">
            {meetings.map((event, index) => (
              <motion.div
                key={event.id}
                className={`p-3 rounded-lg shadow-sm flex flex-col text-sm ${
                  event.type === "internal"
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "bg-green-50 border-l-4 border-green-500"
                }`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <span className="font-semibold text-gray-900">
                  Title: {event.title} | Type: {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
                <span className="text-xs text-gray-600 mt-1">
                  📅 {new Date(event.start).toLocaleString()}
                </span>

                <div className="flex gap-2 mt-2">
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                    >
                      🔗 Join
                    </a>
                  )}
                  <button
                    onClick={() => handleEditMeeting(index)}
                    className="px-2 py-1 bg-yellow-400 text-white rounded-lg text-xs hover:bg-yellow-500 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(event.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Calendarandmeeting;
