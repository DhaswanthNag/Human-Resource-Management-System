import React, { useState, useEffect } from 'react';
// import eren from "../../assets/eren.png";
const EmpProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('employeeProfilePhoto') || localStorage.getItem('profilePhoto') || '');
  // const [profilePhoto] = useState(eren);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    title: '',
    department: '',
    // employeeId: 'EMP31',
    email: '',
    phone: '',
    location: '',
    hireDate: '',
    manager: '',
    bio: '',
    skills: [],
    experience: [],
    education: [],
    // profilePhoto: 'https://i.pinimg.com/1200x/38/79/47/387947599416cc6f6e64bd57936d730f.jpg'
  });
  const [editFormData, setEditFormData] = useState({ ...userData });
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState(false);

  // Load the logged-in employee's profile from the database
  useEffect(() => {
    const loadProfile = async () => {
      let storedUser = {};

      try {
        storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      } catch (error) {
        console.error('Unable to read saved user data:', error);
      }

      const token =
        localStorage.getItem('employeeAuthToken') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        storedUser.token ||
        storedUser.authToken ||
        localStorage.getItem('hams_token');

      if (!token) {
        setProfileError(true);
        setProfileMessage('Your session token was not found. Please log in again.');
        setProfileLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/users/profile/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load your profile.');
        }

        const profile = result.profile || result.user || result.data?.profile || result.data?.user || result.data || result;

        const savedPhoto =
          profile.profilePhoto ||
          profile.profile_photo ||
          profile.photo ||
          profile.profilePicture ||
          profile.profile_picture ||
          localStorage.getItem('employeeProfilePhoto') ||
          localStorage.getItem('profilePhoto') ||
          '';

        const loadedUserData = {
          ...userData,
          name: profile.name || '',
          title: profile.position || profile.title || '',
          department: profile.department || profile.position || profile.title || '',
          email: profile.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          hireDate: profile.created_at
            ? new Date(profile.created_at).toLocaleDateString()
            : userData.hireDate,
          manager: profile.manager || '',
          bio: profile.bio || '',
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          experience: Array.isArray(profile.experience) ? profile.experience : [],
          education: Array.isArray(profile.education) ? profile.education : [],
          profilePhoto: savedPhoto,
        };

        setUserData(loadedUserData);
        setEditFormData(loadedUserData);

        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
          localStorage.setItem('employeeProfilePhoto', savedPhoto);
          localStorage.setItem('profilePhoto', savedPhoto);
          window.dispatchEvent(new CustomEvent('employeeProfilePhotoUpdated', {
            detail: { profilePhoto: savedPhoto },
          }));
        }

        if (profile.emergency_contact) {
          setEmergencyContact({
            name: profile.emergency_contact.name || '',
            relationship: profile.emergency_contact.relationship || '',
            phone: profile.emergency_contact.phone || '',
          });
        }

        setProfileMessage('');
      } catch (error) {
        setProfileError(true);
        setProfileMessage(error.message || 'Unable to connect to the server.');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
    // Load the profile once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle input changes for edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Handle emergency contact changes
  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setEmergencyContact({
      ...emergencyContact,
      [name]: value,
    });
  };

  // Handle skill level changes
  const handleSkillChange = (index, value) => {
    const updatedSkills = [...editFormData.skills];
    updatedSkills[index] = { ...updatedSkills[index], level: parseInt(value, 10) || 0 };
    setEditFormData({ ...editFormData, skills: updatedSkills });
  };

  // Handle skill name changes
  const handleSkillNameChange = (index, value) => {
    const updatedSkills = [...editFormData.skills];
    updatedSkills[index] = { ...updatedSkills[index], name: value };
    setEditFormData({ ...editFormData, skills: updatedSkills });
  };

  // Add a skill
  const handleAddSkill = () => {
    setEditFormData({
      ...editFormData,
      skills: [...editFormData.skills, { name: '', level: 50 }],
    });
  };

  // Remove a skill
  const handleRemoveSkill = (index) => {
    setEditFormData({
      ...editFormData,
      skills: editFormData.skills.filter((_, skillIndex) => skillIndex !== index),
    });
  };

  // Handle experience changes
  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...editFormData.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setEditFormData({ ...editFormData, experience: updatedExperience });
  };

  // Add experience
  const handleAddExperience = () => {
    setEditFormData({
      ...editFormData,
      experience: [
        ...editFormData.experience,
        {
          id: Date.now(),
          title: '',
          company: '',
          period: '',
          description: '',
        },
      ],
    });
  };

  // Remove experience
  const handleRemoveExperience = (index) => {
    setEditFormData({
      ...editFormData,
      experience: editFormData.experience.filter((_, experienceIndex) => experienceIndex !== index),
    });
  };

  // Handle education changes
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...editFormData.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setEditFormData({ ...editFormData, education: updatedEducation });
  };

  // Add education
  const handleAddEducation = () => {
    setEditFormData({
      ...editFormData,
      education: [
        ...editFormData.education,
        {
          id: Date.now(),
          degree: '',
          institution: '',
          year: '',
        },
      ],
    });
  };

  // Remove education
  const handleRemoveEducation = (index) => {
    setEditFormData({
      ...editFormData,
      education: editFormData.education.filter((_, educationIndex) => educationIndex !== index),
    });
  };

  // Handle profile photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError(true);
        setProfileMessage('Please select a valid image file.');
        e.target.value = '';
        return;
      }

      const maxSize = 2 * 1024 * 1024;

      if (file.size > maxSize) {
        setProfileError(true);
        setProfileMessage('Please select an image smaller than 2 MB.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const photo = event.target.result;

        setEditFormData((previousData) => ({
          ...previousData,
          profilePhoto: photo,
        }));

        setProfileMessage('Photo selected. Click Save Changes to store it in your profile.');
        setProfileError(false);
      };

      reader.readAsDataURL(file);
    }
  };

  // Save edited data
  const handleSave = async () => {
    setProfileMessage('');
    setProfileError(false);

    let storedUser = {};

    try {
      storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (error) {
      console.error('Unable to read saved user data:', error);
    }

    const token =
      localStorage.getItem('employeeAuthToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      storedUser.token ||
      storedUser.authToken ||
      localStorage.getItem('hams_token');

    if (!token) {
      setProfileError(true);
      setProfileMessage('Your session token was not found. Please log in again.');
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
          profilePhoto: editFormData.profilePhoto || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to save your profile.');
      }

      const profile = result.profile || result.user || result.data?.profile || result.data?.user || result.data || result;

      const savedUserData = {
        ...editFormData,
        name: profile.name ?? editFormData.name,
        title: profile.position ?? profile.title ?? editFormData.title,
        department: profile.department || profile.position || editFormData.department,
        email: profile.email ?? editFormData.email,
        phone: profile.phone ?? editFormData.phone,
        location: profile.location ?? editFormData.location,
        bio: profile.bio ?? editFormData.bio,
        skills: Array.isArray(profile.skills) ? profile.skills : editFormData.skills,
        experience: Array.isArray(profile.experience)
          ? profile.experience
          : editFormData.experience,
        education: Array.isArray(profile.education) ? profile.education : editFormData.education,
        profilePhoto:
          profile.profilePhoto ||
          profile.profile_photo ||
          profile.photo ||
          editFormData.profilePhoto ||
          localStorage.getItem('employeeProfilePhoto') ||
          localStorage.getItem('profilePhoto') ||
          '',
      };

      setUserData(savedUserData);
      setEditFormData(savedUserData);

      if (savedUserData.profilePhoto) {
        setProfilePhoto(savedUserData.profilePhoto);
        localStorage.setItem('employeeProfilePhoto', savedUserData.profilePhoto);
        localStorage.setItem('profilePhoto', savedUserData.profilePhoto);

        window.dispatchEvent(new CustomEvent('employeeProfilePhotoUpdated', {
          detail: { profilePhoto: savedUserData.profilePhoto },
        }));

        window.dispatchEvent(new StorageEvent('storage', {
          key: 'employeeProfilePhoto',
          newValue: savedUserData.profilePhoto,
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
    setEditFormData({ ...userData });
    setIsEditing(false);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError(false);

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError(true);
      setPasswordMessage('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(true);
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError(true);
      setPasswordMessage('Your new password must be different from your current password.');
      return;
    }

    let storedUser = {};

    try {
      storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (error) {
      console.error('Unable to read saved user data:', error);
    }

    const token =
      localStorage.getItem('employeeAuthToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      storedUser.token ||
      storedUser.authToken ||
      localStorage.getItem('hams_token');

    if (!token) {
      setPasswordError(true);
      setPasswordMessage('Your session token was not found. Please log in again.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to change password.');
      }

      setPasswordMessage(result.message || 'Password changed successfully.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(true);
      setPasswordMessage(error.message || 'Unable to connect to the server.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mt-8 min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {profileLoading && (
          <p className="mb-4 text-sm text-gray-600" role="status">
            Loading your profile...
          </p>
        )}

        {profileMessage && (
          <p
            className={`mb-4 text-sm ${profileError ? 'text-red-600' : 'text-green-600'}`}
            role="status"
          >
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
                  src={editFormData.profilePhoto || profilePhoto || undefined}
                  alt="Profile"
                />
                <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-2 border-white bg-green-500"></div>
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
                    <h1 className="mt-6 text-3xl font-bold text-gray-900">{userData.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">{userData.title}</p>
                  </>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start">
                  <span className="rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                    {userData.department}
                  </span>
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
                  <>
                    <button
                      className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </button>
                  </>
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
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  ) : (
                    <p className="text-gray-900">{userData.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  ) : (
                    <p className="text-gray-900">{userData.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  ) : (
                    <p className="text-gray-900">{userData.location}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="text-gray-900">{userData.hireDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="text-gray-900">{userData.manager}</p>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Skills & Expertise</h2>
              <div className="space-y-5">
                {(isEditing ? editFormData.skills : userData.skills).map((skill, index) => (
                  <div key={skill.id || index}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={skill.name || ''}
                          onChange={(e) => handleSkillNameChange(index, e.target.value)}
                          placeholder="Skill name"
                          aria-label={`Skill ${index + 1} name`}
                          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {Number(skill.level) || 0}%
                      </span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {isEditing && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Number(skill.level) || 0}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        aria-label={`${skill.name || `Skill ${index + 1}`} proficiency`}
                        className="w-full cursor-pointer accent-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        style={{ background: `linear-gradient(to right, #eab308 0%, #eab308 ${Math.min(100, Math.max(0, Number(skill.level) || 0))}%, #e5e7eb ${Math.min(100, Math.max(0, Number(skill.level) || 0))}%, #e5e7eb 100%)` }}
                      />
                    )}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-2.5 rounded-full bg-yellow-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, Number(skill.level) || 0))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
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
                      <textarea
                        name="bio"
                        value={editFormData.bio}
                        onChange={handleInputChange}
                        className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : (
                      <p className="text-gray-700">{userData.bio}</p>
                    )}
                    <h2 className="mb-4 mt-6 text-lg font-semibold text-gray-900">
                      Emergency Contact
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={emergencyContact.name}
                            onChange={handleEmergencyContactChange}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <p className="text-gray-900">{emergencyContact.name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Relationship</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="relationship"
                            value={emergencyContact.relationship}
                            onChange={handleEmergencyContactChange}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <p className="text-gray-900">{emergencyContact.relationship}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={emergencyContact.phone}
                            onChange={handleEmergencyContactChange}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <p className="text-gray-900">{emergencyContact.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    {(isEditing ? editFormData.experience : userData.experience).map(
                      (exp, index) => (
                        <div key={exp.id || index} className="border-l-4 border-yellow-500 py-1 pl-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={exp.title || ''}
                                onChange={(e) =>
                                  handleExperienceChange(index, 'title', e.target.value)
                                }
                                placeholder="Job title"
                                aria-label="Job title"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                              <input
                                type="text"
                                value={exp.company || ''}
                                onChange={(e) =>
                                  handleExperienceChange(index, 'company', e.target.value)
                                }
                                placeholder="Company"
                                aria-label="Company"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                              <input
                                type="text"
                                value={exp.period || ''}
                                onChange={(e) =>
                                  handleExperienceChange(index, 'period', e.target.value)
                                }
                                placeholder="Period (e.g. 2022 - Present)"
                                aria-label="Employment period"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                              <textarea
                                value={exp.description || ''}
                                onChange={(e) =>
                                  handleExperienceChange(index, 'description', e.target.value)
                                }
                                placeholder="Describe your responsibilities and achievements"
                                aria-label="Experience description"
                                className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveExperience(index)}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remove experience
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                              <p className="text-gray-600">
                                {exp.company} • {exp.period}
                              </p>
                              <p className="mt-2 text-gray-700">{exp.description}</p>
                            </>
                          )}
                        </div>
                      )
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        + Add Experience
                      </button>
                    )}
                    {!isEditing && userData.experience.length === 0 && (
                      <p className="text-sm text-gray-500">No experience added yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    {(isEditing ? editFormData.education : userData.education).map((edu, index) => (
                      <div key={edu.id || index} className="border-l-4 border-yellow-500 py-1 pl-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={edu.degree || ''}
                              onChange={(e) =>
                                handleEducationChange(index, 'degree', e.target.value)
                              }
                              placeholder="Degree / qualification"
                              aria-label="Degree or qualification"
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <input
                              type="text"
                              value={edu.institution || ''}
                              onChange={(e) =>
                                handleEducationChange(index, 'institution', e.target.value)
                              }
                              placeholder="Institution / university"
                              aria-label="Institution or university"
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <input
                              type="text"
                              value={edu.year || ''}
                              onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                              placeholder="Year"
                              aria-label="Graduation year"
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveEducation(index)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove education
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                            <p className="text-gray-600">
                              {edu.institution} • {edu.year}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        + Add Education
                      </button>
                    )}
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
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>

                  {passwordMessage && (
                    <p
                      className={`text-sm ${passwordError ? 'text-red-600' : 'text-green-600'}`}
                      role="status"
                    >
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
