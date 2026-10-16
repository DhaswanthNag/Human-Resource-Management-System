
import React, { useState, useEffect } from 'react';
// import eren from "../../assets/eren.png";

const API_URL = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const EMPTY_PROFILE = {
  name: '',
  title: '',
  department: '',
  email: '',
  phone: '',
  location: '',
  hireDate: '',
  manager: '',
  bio: '',
  skills: [],
  experience: [],
  education: [],
  profilePhoto: ''
};
const EMPTY_CONTACT = { name: '', relationship: '', phone: '' };
const INPUT_CLASS = 'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500';

const getToken = () => {
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch (error) {
    console.error('Unable to read saved user data:', error);
  }
  return localStorage.getItem('employeeAuthToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    storedUser.token ||
    storedUser.authToken ||
    localStorage.getItem('hams_token');
};

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getProfileResult = (result = {}) =>
  result.profile || result.user || result.data?.profile ||
  result.data?.user || result.data || result;

const normalizeProfile = (profile = {}) => ({
  ...EMPTY_PROFILE,
  ...profile,
  name: profile.name || '',
  title: profile.position || profile.title || '',
  department: profile.department || profile.position || profile.title || '',
  email: profile.email || '',
  phone: profile.phone || '',
  location: profile.location || '',
  hireDate: profile.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : profile.hireDate || profile.hire_date || '',
  manager: profile.manager || '',
  bio: profile.bio || '',
  skills: parseArray(profile.skills),
  experience: parseArray(profile.experience),
  education: parseArray(profile.education),
  profilePhoto: profile.profilePhoto || profile.profile_photo ||
    profile.photo || profile.profilePicture || profile.profile_picture || ''
});

const EmpProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profilePhoto, setProfilePhoto] = useState(() =>
    localStorage.getItem('employeeProfilePhoto') ||
    localStorage.getItem('profilePhoto') || ''
  );
  // const [profilePhoto] = useState(eren);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userData, setUserData] = useState(EMPTY_PROFILE);
  const [editFormData, setEditFormData] = useState(EMPTY_PROFILE);
  const [emergencyContact, setEmergencyContact] = useState(EMPTY_CONTACT);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Load the logged-in employee's profile from the database
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) {
          setProfileError(true);
          setProfileMessage('Your session token was not found. Please log in again.');
          setProfileLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/profile/me`, {
          headers: getHeaders()
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load your profile.');
        }

        const profile = getProfileResult(result);
        const loadedUserData = normalizeProfile(profile);
        const contact = profile.emergency_contact || profile.emergencyContact || {};

        if (!isMounted) return;

        setUserData(loadedUserData);
        setEditFormData(loadedUserData);
        setEmergencyContact({
          name: contact.name || '',
          relationship: contact.relationship || '',
          phone: contact.phone || ''
        });

        if (loadedUserData.profilePhoto) {
          setProfilePhoto(loadedUserData.profilePhoto);
          localStorage.setItem('employeeProfilePhoto', loadedUserData.profilePhoto);
          localStorage.setItem('profilePhoto', loadedUserData.profilePhoto);
          window.dispatchEvent(new CustomEvent('employeeProfilePhotoUpdated', {
            detail: { profilePhoto: loadedUserData.profilePhoto }
          }));
        }

        setProfileMessage('');
      } catch (error) {
        if (isMounted) {
          setProfileError(true);
          setProfileMessage(error.message || 'Unable to connect to the server.');
        }
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    loadProfile();
    // Load the profile once when this page opens.
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep the employee's online status updated while this page is open.
  useEffect(() => {
    let isMounted = true;
    let heartbeatInProgress = false;

    const sendHeartbeat = async () => {
      if (heartbeatInProgress || !isMounted) return;
      heartbeatInProgress = true;

      try {
        const token = getToken();
        if (!token) {
          if (isMounted) setIsOnline(false);
          return;
        }

        const response = await fetch(`${API_URL}/users/presence/heartbeat`, {
          method: 'POST',
          headers: getHeaders()
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || `Heartbeat failed with status ${response.status}`);
        }

        const result = await response.json();
        if (isMounted) setIsOnline(result.online === true);
      } catch (error) {
        console.error('Unable to update employee online status:', error);
        if (isMounted) setIsOnline(false);
      } finally {
        heartbeatInProgress = false;
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 20000);

    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Handle input changes for edit form
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((previous) => ({ ...previous, [name]: value }));
  };

  // Handle emergency contact changes
  const handleEmergencyContactChange = (event) => {
    const { name, value } = event.target;
    setEmergencyContact((previous) => ({ ...previous, [name]: value }));
  };

  // Handle skill level changes
  const handleSkillChange = (index, value) => {
    const level = Math.max(0, Math.min(100, Number(value) || 0));
    updateArrayItem('skills', index, 'level', level);
  };

  // Handle skill name changes
  const handleSkillNameChange = (index, value) => {
    updateArrayItem('skills', index, 'name', value);
  };

  // Add a skill
  const handleAddSkill = () => {
    addArrayItem('skills', { name: '', level: 50 });
  };

  // Remove a skill
  const handleRemoveSkill = (index) => {
    removeArrayItem('skills', index);
  };

  // Handle experience changes
  const handleExperienceChange = (index, field, value) => {
    updateArrayItem('experience', index, field, value);
  };

  // Add experience
  const handleAddExperience = () => {
    addArrayItem('experience', {
      title: '',
      company: '',
      period: '',
      description: ''
    });
  };

  // Remove experience
  const handleRemoveExperience = (index) => {
    removeArrayItem('experience', index);
  };

  // Handle education changes
  const handleEducationChange = (index, field, value) => {
    updateArrayItem('education', index, field, value);
  };

  // Add education
  const handleAddEducation = () => {
    addArrayItem('education', { degree: '', institution: '', year: '' });
  };

  // Remove education
  const handleRemoveEducation = (index) => {
    removeArrayItem('education', index);
  };

  const updateArrayItem = (field, index, key, value) => {
    setEditFormData((previous) => ({
      ...previous,
      [field]: previous[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  };

  const addArrayItem = (field, item) => {
    setEditFormData((previous) => ({
      ...previous,
      [field]: [...previous[field], { ...item, id: Date.now() }]
    }));
  };

  const removeArrayItem = (field, index) => {
    setEditFormData((previous) => ({
      ...previous,
      [field]: previous[field].filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  // Handle profile photo change
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError(true);
      setProfileMessage('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError(true);
      setProfileMessage('Please select an image smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const photo = reader.result;
      setEditFormData((previous) => ({ ...previous, profilePhoto: photo }));
      setProfileMessage('Photo selected. Click Save Changes to store it in your profile.');
      setProfileError(false);
    };
    reader.onerror = () => {
      setProfileError(true);
      setProfileMessage('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  // Save edited data
  const handleSave = async () => {
    setProfileMessage('');
    setProfileError(false);

    if (!getToken()) {
      setProfileError(true);
      setProfileMessage('Your session token was not found. Please log in again.');
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch(`${API_URL}/users/profile/me`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          position: editFormData.title,
          phone: editFormData.phone,
          location: editFormData.location,
          bio: editFormData.bio,
          skills: editFormData.skills,
          experience: editFormData.experience,
          education: editFormData.education,
          emergency_contact: emergencyContact,
          profilePhoto: editFormData.profilePhoto || null
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Unable to save your profile.');
      }

      const returnedProfile = getProfileResult(result);
      const savedUserData = normalizeProfile({
        ...editFormData,
        ...returnedProfile,
        name: returnedProfile.name ?? editFormData.name,
        title: returnedProfile.position ?? returnedProfile.title ?? editFormData.title,
        department: returnedProfile.department || returnedProfile.position || editFormData.department,
        email: returnedProfile.email ?? editFormData.email,
        phone: returnedProfile.phone ?? editFormData.phone,
        location: returnedProfile.location ?? editFormData.location,
        bio: returnedProfile.bio ?? editFormData.bio,
        skills: returnedProfile.skills ?? editFormData.skills,
        experience: returnedProfile.experience ?? editFormData.experience,
        education: returnedProfile.education ?? editFormData.education,
        profilePhoto: returnedProfile.profilePhoto ||
          returnedProfile.profile_photo ||
          returnedProfile.photo ||
          editFormData.profilePhoto ||
          localStorage.getItem('employeeProfilePhoto') ||
          localStorage.getItem('profilePhoto') ||
          ''
      });

      setUserData(savedUserData);
      setEditFormData(savedUserData);

      if (savedUserData.profilePhoto) {
        setProfilePhoto(savedUserData.profilePhoto);
        localStorage.setItem('employeeProfilePhoto', savedUserData.profilePhoto);
        localStorage.setItem('profilePhoto', savedUserData.profilePhoto);

        window.dispatchEvent(new CustomEvent('employeeProfilePhotoUpdated', {
          detail: { profilePhoto: savedUserData.profilePhoto }
        }));

        window.dispatchEvent(new StorageEvent('storage', {
          key: 'employeeProfilePhoto',
          newValue: savedUserData.profilePhoto
        }));
      }

      setIsEditing(false);
      setProfileMessage(result.message || 'Profile updated successfully.');
    } catch (error) {
      setProfileError(true);
      setProfileMessage(error.message || 'Unable to connect to the server.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditFormData(userData);
    setEmergencyContact({
      name: userData.emergencyContact?.name || '',
      relationship: userData.emergencyContact?.relationship || '',
      phone: userData.emergencyContact?.phone || ''
    });
    setIsEditing(false);
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((previous) => ({ ...previous, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError(false);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError(true);
      setPasswordMessage('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(true);
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError(true);
      setPasswordMessage('New password must contain at least 8 characters.');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError(true);
      setPasswordMessage('Your new password must be different from your current password.');
      return;
    }

    if (!getToken()) {
      setPasswordError(true);
      setPasswordMessage('Your session token was not found. Please log in again.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Unable to change password.');
      }

      setPasswordMessage(result.message || 'Password changed successfully.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setPasswordError(true);
      setPasswordMessage(error.message || 'Unable to connect to the server.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const displayValue = (value) => value || 'Not provided';

  if (profileLoading) {
    return (
      <div className="mt-8 min-h-screen bg-gray-50 py-8">
        <p className="mb-4 text-center text-sm text-gray-600" role="status">
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {profileMessage && (
          <p className={`mb-4 text-sm ${profileError ? 'text-red-600' : 'text-green-600'}`} role="status">
            {profileMessage}
          </p>
        )}

        {/* Header Section */}
        <div className="relative mb-6 mr-6 overflow-hidden rounded-lg bg-white shadow-md">
          <div className="h-32 bg-gradient-to-r from-yellow-500 to-yellow-300"></div>
          <div className="absolute right-4 top-4 m-4">
            {/* <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
              EMPLOYEE
            </span> */}
          </div>
          <div className="-mt-16 px-6 pb-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-end">
              <div className="relative">
                <img
                  className="h-32 w-32 rounded-full border-4 border-white bg-gray-100 object-cover shadow-lg"
                  src={editFormData.profilePhoto || profilePhoto || 'https://ui-avatars.com/api/?name=Employee&background=e5e7eb&color=374151'}
                  alt="Profile"
                />
                <div
                  className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-[3px] border-white ${
                    isOnline
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-status-online'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-status-offline'
                  }`}
                  title={isOnline ? 'Online' : 'Offline'}
                  role="status"
                  aria-label={isOnline ? 'Employee is online' : 'Employee is offline'}
                ></div>
                {isEditing && (
                  <label className="absolute bottom-0 left-0 right-0 cursor-pointer bg-black bg-opacity-70 py-1 text-center text-xs text-white">
                    Change Photo
                    <input
                      type="file"
                      className="hidden focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>
              <div className="mt-4 text-center sm:ml-6 sm:mt-0 sm:text-left">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className="mb-2 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-3xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <input
                      type="text"
                      name="title"
                      value={editFormData.title}
                      onChange={handleInputChange}
                      className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </>
                ) : (
                  <>
                    <h1 className="mt-6 mb-4 text-3xl font-bold text-gray-900">{userData.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">{userData.title}</p>
                  </>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start">
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">EMPLOYEE</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-3 sm:ml-auto sm:mt-0">
                {isEditing ? (
                  <>
                    <button
                      className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={handleSave}
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mr-6 flex flex-col gap-6 lg:flex-row">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/3">
            {/* Personal Info Card */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
              <div className="space-y-4">
                {[
                  ['email', 'Email', 'email'],
                  ['phone', 'Phone', 'tel'],
                  ['location', 'Location', 'text']
                ].map(([name, label, type]) => (
                  <div key={name}>
                    <p className="text-sm text-gray-500">{label}</p>
                    {isEditing ? (
                      <input type={type} name={name} value={editFormData[name] || ''} onChange={handleInputChange} className={INPUT_CLASS} />
                    ) : (
                      <p className="text-gray-900">{displayValue(userData[name])}</p>
                    )}
                  </div>
                ))}
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="text-gray-900">{displayValue(userData.hireDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="text-gray-900">{displayValue(userData.manager)}</p>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Skills & Expertise</h2>
              <div className="space-y-5">
                {(isEditing ? editFormData.skills : userData.skills).map((skill, index) => {
                  const level = Math.max(0, Math.min(100, Number(skill.level) || 0));
                  return (
                    <div key={skill.id || index}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={skill.name || ''}
                            onChange={(event) => handleSkillNameChange(index, event.target.value)}
                            placeholder="Skill name"
                            aria-label={`Skill ${index + 1} name`}
                            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                        )}
                        <span className="text-sm font-medium text-gray-900">{level}%</span>
                        {isEditing && (
                          <button type="button" onClick={() => handleRemoveSkill(index)} className="text-sm text-red-600 hover:text-red-800">
                            Remove
                          </button>
                        )}
                      </div>
                      {isEditing && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={level}
                          onChange={(event) => handleSkillChange(index, event.target.value)}
                          aria-label={`${skill.name || `Skill ${index + 1}`} proficiency`}
                          className="w-full cursor-pointer accent-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          style={{ background: `linear-gradient(to right, #eab308 0%, #eab308 ${level}%, #e5e7eb ${level}%, #e5e7eb 100%)` }}
                        />
                      )}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className="h-2.5 rounded-full bg-yellow-500 transition-all duration-300" style={{ width: `${level}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {isEditing && (
                  <button type="button" onClick={handleAddSkill} className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    + Add Skill
                  </button>
                )}
                {!isEditing && userData.skills.length === 0 && (
                  <p className="text-sm text-gray-500">No skills added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full lg:w-2/3">
            {/* Tabs */}
            <div className="mb-6 rounded-lg bg-white shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {['personal', 'experience', 'education'].map((tab) => (
                    <button
                      key={tab}
                      className={`border-b-2 px-6 py-4 text-center text-sm font-medium focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                        activeTab === tab
                          ? 'border-yellow-500 text-yellow-700'
                          : 'border-transparent text-gray-500 hover:border-yellow-300 hover:text-yellow-700'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'personal' && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">About</h2>
                    {isEditing ? (
                      <textarea name="bio" value={editFormData.bio} onChange={handleInputChange} className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    ) : (
                      <p className="text-gray-700">{displayValue(userData.bio)}</p>
                    )}
                    <h2 className="mb-4 mt-6 text-lg font-semibold text-gray-900">Emergency Contact</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        ['name', 'Name', 'text'],
                        ['relationship', 'Relationship', 'text'],
                        ['phone', 'Phone', 'tel']
                      ].map(([name, label, type]) => (
                        <div key={name}>
                          <p className="text-sm text-gray-500">{label}</p>
                          {isEditing ? (
                            <input type={type} name={name} value={emergencyContact[name] || ''} onChange={handleEmergencyContactChange} className={INPUT_CLASS} />
                          ) : (
                            <p className="text-gray-900">{displayValue(emergencyContact[name])}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    {isEditing && (
                      <button type="button" onClick={handleAddExperience} className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        + Add Experience
                      </button>
                    )}
                    {(isEditing ? editFormData.experience : userData.experience).map((exp, index) => (
                      <div key={exp.id || index} className="border-l-4 border-yellow-500 py-1 pl-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            {[
                              ['title', 'Job title'],
                              ['company', 'Company'],
                              ['period', 'Period (e.g. 2022 - Present)']
                            ].map(([field, placeholder]) => (
                              <input
                                key={field}
                                type="text"
                                value={exp[field] || ''}
                                onChange={(event) => handleExperienceChange(index, field, event.target.value)}
                                placeholder={placeholder}
                                aria-label={placeholder}
                                className={INPUT_CLASS}
                              />
                            ))}
                            <textarea
                              value={exp.description || ''}
                              onChange={(event) => handleExperienceChange(index, 'description', event.target.value)}
                              placeholder="Describe your responsibilities and achievements"
                              aria-label="Experience description"
                              className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <button type="button" onClick={() => handleRemoveExperience(index)} className="text-sm text-red-600 hover:text-red-800">
                              Remove experience
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-600">{exp.company}{exp.period ? ` • ${exp.period}` : ''}</p>
                            <p className="mt-2 whitespace-pre-wrap text-gray-700">{exp.description}</p>
                          </>
                        )}
                      </div>
                    ))}
                    {!isEditing && userData.experience.length === 0 && (
                      <p className="text-sm text-gray-500">No experience added yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    {isEditing && (
                      <button type="button" onClick={handleAddEducation} className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        + Add Education
                      </button>
                    )}
                    {(isEditing ? editFormData.education : userData.education).map((edu, index) => (
                      <div key={edu.id || index} className="border-l-4 border-yellow-500 py-1 pl-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            {[
                              ['degree', 'Degree / qualification'],
                              ['institution', 'Institution / university'],
                              ['year', 'Graduation year']
                            ].map(([field, placeholder]) => (
                              <input
                                key={field}
                                type="text"
                                value={edu[field] || ''}
                                onChange={(event) => handleEducationChange(index, field, event.target.value)}
                                placeholder={placeholder}
                                aria-label={placeholder}
                                className={INPUT_CLASS}
                              />
                            ))}
                            <button type="button" onClick={() => handleRemoveEducation(index)} className="text-sm text-red-600 hover:text-red-800">
                              Remove education
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                            <p className="text-gray-600">{edu.institution}{edu.year ? ` • ${edu.year}` : ''}</p>
                          </>
                        )}
                      </div>
                    ))}
                    {!isEditing && userData.education.length === 0 && (
                      <p className="text-sm text-gray-500">No education added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm((previous) => !previous);
                    setPasswordMessage('');
                    setPasswordError(false);
                  }}
                  className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                  {[
                    ['currentPassword', 'Current Password', 'current-password'],
                    ['newPassword', 'New Password', 'new-password'],
                    ['confirmPassword', 'Confirm New Password', 'new-password']
                  ].map(([name, label, autoComplete]) => (
                    <div key={name}>
                      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
                        {label}
                      </label>
                      <input
                        id={name}
                        name={name}
                        type="password"
                        autoComplete={autoComplete}
                        minLength={name === 'currentPassword' ? undefined : 8}
                        value={passwordData[name]}
                        onChange={handlePasswordInputChange}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                      />
                    </div>
                  ))}

                  {passwordMessage && (
                    <p className={`text-sm ${passwordError ? 'text-red-600' : 'text-green-600'}`} role="status">
                      {passwordMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-md bg-yellow-500 px-4 py-2 font-medium text-gray-900 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpProfilePage;
