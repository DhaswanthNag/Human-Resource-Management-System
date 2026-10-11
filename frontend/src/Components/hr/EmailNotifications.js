import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // ✅ Import axios

const HREmailNotifications = () => {
  // State for notifications and filters
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Sample notification data - moved inside useCallback to stabilize the reference
  const getSampleNotifications = useCallback(() => {
    return [
      {
        id: 1,
        type: 'leave',
        title: 'Leave Request Submitted',
        message: 'John Doe has submitted a leave request for August 15-18, 2023.',
        time: '2 hours ago',
        read: false,
        priority: 'high'
      },
      {
        id: 2,
        type: 'approval',
        title: 'Document Approval Required',
        message: 'The employee handbook update requires your approval.',
        time: '5 hours ago',
        read: false,
        priority: 'medium'
      },
      {
        id: 3,
        type: 'reminder',
        title: 'Performance Review Reminder',
        message: 'Performance reviews for Q2 are due next Friday.',
        time: '1 day ago',
        read: true,
        priority: 'medium'
      },
      {
        id: 4,
        type: 'recruitment',
        title: 'New Applicant for Senior Developer',
        message: 'Sarah Johnson has applied for the Senior Developer position.',
        time: '1 day ago',
        read: true,
        priority: 'low'
      },
      {
        id: 5,
        type: 'system',
        title: 'System Maintenance Scheduled',
        message: 'HR system maintenance is scheduled for Saturday at 10 PM.',
        time: '2 days ago',
        read: true,
        priority: 'low'
      },
      {
        id: 6,
        type: 'payroll',
        title: 'Payroll Processing Complete',
        message: 'The payroll for August has been successfully processed.',
        time: '3 days ago',
        read: true,
        priority: 'medium'
      }
    ];
  }, []);

  // Initialize notifications and count unread
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // ✅ Replace with your backend API endpoint
        const response = await axios.get('http://localhost:5000/api/notifications');
        const data = response.data;

        setNotifications(data);
        const unread = data.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // fallback to sample data if backend fails
        const sampleNotifications = getSampleNotifications();
        setNotifications(sampleNotifications);
        const unread = sampleNotifications.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      }
    };

    fetchNotifications();
  }, [getSampleNotifications]);

  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(notification => notification.type === filter);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      setNotifications(updatedNotifications);
      setUnreadCount(prevCount => prevCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/mark-all-read');
      const updatedNotifications = notifications.map(notification =>
        ({ ...notification, read: true })
      );
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'leave':
        return (
          <div className="p-2 bg-blue-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'approval':
        return (
          <div className="p-2 bg-green-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="p-2 bg-yellow-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'recruitment':
        return (
          <div className="p-2 bg-purple-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'payroll':
        return (
          <div className="p-2 bg-indigo-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
        );
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Low</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-screen mx-auto p-0 bg-white rounded-lg shadow-md mr-6">
      <div className="flex justify-end mb-6">
        <div className="flex items-center space-x-4 mr-6">
          {/* <h1 className="text-2xl md:text-2xl font-semibold text-gray-800 dark:text-white text-center ">
            Email Notifications
          </h1> */}
          <span className="text-sm font-medium mt-4 text-gray-600">{unreadCount} unread</span>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 mt-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6 ml-6 mr-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-gray-400 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('leave')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'leave' ? 'bg-gray-400 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setFilter('approval')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'approval' ? 'bg-gray-400 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
        >
          Approvals
        </button>
        <button
          onClick={() => setFilter('recruitment')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'recruitment' ? 'bg-gray-400 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
        >
          Recruitment
        </button>
        <button
          onClick={() => setFilter('payroll')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'payroll' ? 'bg-gray-400 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
        >
          Payroll
        </button>
        <button
          onClick={() => setFilter('system')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'system' ? 'bg-gray-400 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
        >
          System
        </button>
      </div>

      {/* Notifications list */}
      <div className="space-y-4 ml-6 mr-6">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg flex items-start space-x-4 ${!notification.read ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'}`}
            >
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900">{notification.title}</h3>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(notification.priority)}
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                <div className="mt-3 flex space-x-3">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-sm text-yellow-500 hover:text-yellow-600"
                    >
                      Mark as read
                    </button>
                  )}
                  <button className="text-sm text-gray-600 hover:text-gray-800">Archive</button>
                  <button className="text-sm text-gray-600 hover:text-gray-800">Reply</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 ">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-600">No notifications found</p>
          </div>
        )}
      </div>

      {/* Pagination (optional) */}
      <div className="mt-8 flex justify-between items-center ml-6 mr-6">
        <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md mb-6 hover:bg-gray-200 disabled:opacity-50" disabled>
          Previous
        </button>
        <span className="text-sm text-gray-700">Page 1 of 1</span>
        <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md mb-6 hover:bg-gray-200 disabled:opacity-50" disabled>
          Next
        </button>
      </div>
    </div>
  );
};

export default HREmailNotifications;
