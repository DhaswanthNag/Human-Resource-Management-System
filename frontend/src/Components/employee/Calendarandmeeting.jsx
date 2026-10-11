import React, { useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion } from "framer-motion";
import { CalendarClock, PartyPopper, Calendar, Link as LinkIcon, Gift } from "lucide-react";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";

function Calendarandmeeting({ events, setEvents }) {
  const API_URL = "http://localhost:5000/api/meetings";
  const HOLIDAY_API = "http://localhost:5000/api/holidays";

  const [holidays, setHolidays] = React.useState([]);

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
        setEvents(data);
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
          backgroundColor: "#f7d529ff",
          borderColor: "#f8f671ff",
        }));
        setHolidays(data);
      } catch (err) {
        console.error("Error fetching holidays:", err);
      }
    };

    fetchMeetings();
    fetchHolidays();
  }, [setEvents]);

  // Combine meetings and holidays for calendar display
  const calendarEvents = [...events, ...holidays];

  return (
    <motion.div className="min-h-screen p-0 sm:p-0 bg-gray-50 mr-6">
      <h1 className="text-3xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gray-700">
        Calendar & Meetings
      </h1>
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
            events={calendarEvents}
            eventDidMount={(info) => {
              const isHoliday = info.event.extendedProps.type === "holiday";
              tippy(info.el, {
                content: isHoliday
                  ? `<strong>Holiday:</strong> ${info.event.title}`
                  : `<strong>${info.event.title}</strong><br/>Type: ${info.event.extendedProps.type}<br/><a href="${info.event.extendedProps.link}" target="_blank">Join Meeting</a>`,
                allowHTML: true,
              });
            }}
            height="75vh"
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white shadow-lg rounded-2xl p-5 flex flex-col">
          {/* Upcoming Meetings */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-yellow-500" />
              Upcoming Meetings
            </span>
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {events.length}
            </span>
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-112 pr-2 mb-8">
            {events.length > 0 ? (
              events
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map((event) => (
                  <div
                    key={event.id}
                    className={`p-2 rounded-lg shadow-sm flex flex-col text-sm ${
                      event.type === "internal"
                    ? "bg-blue-50 border-l-4 border-yellow-500"
                    : "bg-green-50 border-l-4 border-gray-500"
                    }`}
                  >
                    <span className="font-medium">
                      Title: {event.title} | Type:{" "}
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
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
                      <LinkIcon className="w-4 h-4" />
                      Join
                      </a>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-sm">No upcoming meetings</p>
            )}
          </div>

          {/* Upcoming Holidays */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <PartyPopper className="w-6 h-6 text-pink-600" />
              Upcoming Holidays
            </span>
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {holidays.length}
            </span>
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-72 pr-2">
            {holidays.length > 0 ? (
              holidays
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map((holiday) => (
                  <div
                    key={holiday.id}
                    className="p-3 rounded-lg shadow-sm flex items-center text-sm bg-red-50 border-l-4 border-red-500"
                  >
                      <span className="text-red-700 text-xl mr-2">
                        <Gift className="w-4 h-4 text-red-700" />
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
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-sm">No upcoming holidays</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Calendarandmeeting;
