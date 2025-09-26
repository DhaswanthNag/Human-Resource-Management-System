import React, { useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion } from "framer-motion";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";

function Calendarandmeeting({ events, setEvents }) {
  const API_URL = "http://localhost:5000/api/meetings";

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await axios.get(API_URL);
        const data = res.data.map((m) => ({
          id: m.id,
          title: m.meeting_title, // title from DB
          type: m.meeting_type,
          link: m.meeting_link,
          start: new Date(m.start_time),
          end: m.end_time ? new Date(m.end_time) : null,
        }));
        setEvents(data); // update parent state
      } catch (err) {
        console.error("Error fetching meetings:", err);
      }
    };
    fetchMeetings();
  }, [setEvents]);

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
        <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventDidMount={(info) => {
              tippy(info.el, {
                content: `<strong>${info.event.title}</strong><br/>Type: ${info.event.extendedProps.type}<br/><a href="${info.event.extendedProps.link}" target="_blank">Join Meeting</a>`,
                allowHTML: true,
              });
            }}
            height="75vh"
          />
        </div>

        {/* Upcoming Meetings */}
        <div className="lg:col-span-1 bg-white shadow-lg rounded-2xl p-5 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📌 Upcoming Meetings</h2>
          <div className="space-y-2 overflow-y-auto max-h-112 pr-2">
            {events.length > 0 ? (
              events
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map((event) => (
                  <div
                    key={event.id}
                    className={`p-2 rounded-lg shadow-sm flex flex-col text-sm ${
                      event.type === "internal"
                        ? "bg-blue-100 border-l-4 border-blue-500"
                        : "bg-green-100 border-l-4 border-green-500"
                    }`}
                  >
                    <span className="font-medium">
                      Title: {event.title} | Type: {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(event.start).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {event.link && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline text-xs mt-1"
                      >
                        🔗 Join
                      </a>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-sm">No upcoming meetings</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Calendarandmeeting;
