import React, { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const EMPTY_PROFILE = {
  user_id: '',
  name: '',
  title: 'HR',
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
  emergencyContact: { name: '', relationship: '', phone: '' },
  profilePhoto: ''
};

const getToken = () => {
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch (error) {
    console.error('Unable to read saved user data:', error);
  }
  return localStorage.getItem('hrAuthToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    storedUser.token ||
    storedUser.authToken ||
    '';
};

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const normalizeProfile = (data = {}) => {
  let emergencyContact = data.emergency_contact ?? data.emergencyContact ?? {};
  if (typeof emergencyContact === 'string') {
    try {
      emergencyContact = JSON.parse(emergencyContact);
    } catch {
      emergencyContact = {};
    }
  }

  let skills = data.skills ?? [];
  let experience = data.experience ?? [];
  let education = data.education ?? [];

  if (typeof skills === 'string') {
    try { skills = JSON.parse(skills); } catch { skills = []; }
  }
  if (typeof experience === 'string') {
    try { experience = JSON.parse(experience); } catch { experience = []; }
  }
  if (typeof education === 'string') {
    try { education = JSON.parse(education); } catch { education = []; }
  }

  return {
    ...EMPTY_PROFILE,
    ...data,
    name: data.name || '',
    title: data.position || data.title || 'HR',
    department: data.department || '',
    email: data.email || '',
    phone: data.phone || '',
    location: data.location || '',
    hireDate: data.hireDate || data.hire_date || data.created_at || '',
    manager: data.manager || '',
    bio: data.bio || '',
    skills: Array.isArray(skills) ? skills : [],
    experience: Array.isArray(experience) ? experience : [],
    education: Array.isArray(education) ? education : [],
    emergencyContact: {
      name: emergencyContact.name || '',
      relationship: emergencyContact.relationship || '',
      phone: emergencyContact.phone || ''
    },
    profilePhoto: data.profilePhoto || data.profile_photo || ''
  };
};

const inputClass = 'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500';
const labelClass = 'block text-sm font-medium text-gray-600';

const HRProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [userData, setUserData] = useState(EMPTY_PROFILE);
  const [editFormData, setEditFormData] = useState(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/users/profile/me`, {
        headers: getHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Unable to load your HR profile.');
      }
      const profile = normalizeProfile(result.profile || result.user || result.data?.profile || result.data?.user || result.data || result);
      setUserData(profile);
      setEditFormData(profile);
    } catch (err) {
      setError(err.message || 'Unable to load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleEmergencyContactChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((previous) => ({
      ...previous,
      emergencyContact: { ...previous.emergencyContact, [name]: value }
    }));
  };

  // Handle skill level changes
  const handleSkillChange = (index, value) => {
    const level = Math.max(0, Math.min(100, Number(value) || 0));
    setEditFormData((previous) => ({
      ...previous,
      skills: previous.skills.map((skill, skillIndex) =>
        skillIndex === index ? { ...skill, level } : skill
      )
    }));
  };

  // Handle skill name changes
  const handleSkillNameChange = (index, name) => {
    setEditFormData((previous) => ({
      ...previous,
      skills: previous.skills.map((skill, skillIndex) =>
        skillIndex === index ? { ...skill, name } : skill
      )
    }));
  };

  // Add a skill
  const addSkill = () => {
    setEditFormData((previous) => ({
      ...previous,
      skills: [...previous.skills, { name: '', level: 50 }]
    }));
  };

  // Remove a skill
  const removeSkill = (index) => {
    setEditFormData((previous) => ({
      ...previous,
      skills: previous.skills.filter((_, skillIndex) => skillIndex !== index)
    }));
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
    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image size must be 2 MB or less.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditFormData((previous) => ({ ...previous, profilePhoto: reader.result }));
      setNotice('Photo selected. Click Save Changes to store it in your profile.');
    };
    reader.onerror = () => setPhotoError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  };

  // Save edited data
  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        position: editFormData.title,
        phone: editFormData.phone,
        location: editFormData.location,
        bio: editFormData.bio,
        skills: editFormData.skills,
        experience: editFormData.experience,
        education: editFormData.education,
        emergency_contact: editFormData.emergencyContact,
        profilePhoto: editFormData.profilePhoto
      };
      const response = await fetch(`${API_URL}/users/profile/me`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Unable to save your profile.');
      }
      const savedProfile = normalizeProfile(
        result.profile || result.user || result.data?.profile || result.data?.user || result.data || {
          ...editFormData,
          ...payload
        }
      );
      setUserData(savedProfile);
      setEditFormData(savedProfile);
      setIsEditing(false);
      setNotice(result.message || 'Profile updated successfully.');
      window.dispatchEvent(new CustomEvent('hrProfilePhotoUpdated', {
        detail: { profilePhoto: savedProfile.profilePhoto }
      }));
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
        detail: { profilePhoto: savedProfile.profilePhoto }
      }));
    } catch (err) {
      setError(err.message || 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditFormData(userData);
    setIsEditing(false);
    setPhotoError('');
    setError('');
    setNotice('');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('Your new password must be different from your current password.');
      return;
    }

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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setNotice(result.message || 'Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Unable to change password.');
    }
  };

  const displayDate = (value) => {
    if (!value) return 'Not provided';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600">Loading your HR profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {error && (
          <p role="status" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-4 text-sm text-green-600">
            {notice}
          </p>
        )}

        {/* Header Section */}
        <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-md">
          <div className="h-32 bg-gradient-to-r from-yellow-500 to-yellow-300"></div>
          <div className="px-6 pb-6 -mt-16">
            <div className="flex flex-col items-center sm:flex-row sm:items-end">
              <div className="relative shrink-0">
                <img
                  className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                  src={isEditing ? editFormData.profilePhoto || 'https://ui-avatars.com/api/?name=HR&background=e5e7eb&color=374151' : userData.profilePhoto || 'https://ui-avatars.com/api/?name=HR&background=e5e7eb&color=374151'}
                  alt="HR profile"
                />
                <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-2 border-white bg-green-500"></div>
                {isEditing && (
                  <label className="absolute bottom-0 left-0 right-0 cursor-pointer bg-black/70 py-1 text-center text-xs text-white">
                    Change Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>
              <div className="mt-4 text-center sm:ml-6 sm:mt-0 sm:text-left">
                {isEditing ? (
                  <>
                    <input name="name" value={editFormData.name} onChange={handleInputChange} className="mb-2 w-full max-w-xs rounded-md bg-gray-100 px-3 py-2 text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Full name" />
                    <input name="title" value={editFormData.title} onChange={handleInputChange} className={inputClass} placeholder="Job title" />
                  </>
                ) : (
                  <>
                    <h1 className="mt-6 text-3xl font-bold text-gray-900">{userData.name || 'HR User'}</h1>
                    <p className="mt-2 text-lg text-gray-600">{userData.title || 'HR'}</p>
                  </>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {/* <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{userData.department || 'Human Resources'}</span> */}
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">HR</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-3 sm:ml-auto sm:mt-0">
                {isEditing ? (
                  <>
                    <button disabled={isSaving} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" onClick={handleSave}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                    <button className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500" onClick={handleCancel}>Cancel</button>
                  </>
                ) : (
                  <button className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" onClick={() => { setError(''); setNotice(''); setIsEditing(true); }}>Edit Profile</button>
                )}
              </div>
            </div>
            {photoError && <p className="mt-3 text-sm text-red-600">{photoError}</p>}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Sidebar */}
          <div className="w-full space-y-6 lg:w-1/3">
            {/* Personal Info Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
              <div className="space-y-4">
                {[
                  ['email', 'Email', 'email'],
                  ['phone', 'Phone', 'tel'],
                  ['location', 'Location', 'text']
                ].map(([name, label, type]) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    {isEditing ? (
                      <input type={type} name={name} value={editFormData[name] || ''} onChange={handleInputChange} className={inputClass} />
                    ) : (
                      <p className="break-words text-gray-900">{userData[name] || 'Not provided'}</p>
                    )}
                  </div>
                ))}
                <div>
                  <p className={labelClass}>Hire Date</p>
                  <p className="text-gray-900">{displayDate(userData.hireDate)}</p>
                </div>
                <div>
                  <p className={labelClass}>Manager</p>
                  {isEditing ? <input name="manager" value={editFormData.manager || ''} onChange={handleInputChange} className={inputClass} /> : <p className="text-gray-900">{userData.manager || 'Not provided'}</p>}
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Skills & Expertise</h2>
                {isEditing && <button type="button" onClick={addSkill} className="text-sm font-semibold text-gray-800 hover:text-yellow-700">+ Add skill</button>}
              </div>
              <div className="space-y-5">
                {(isEditing ? editFormData.skills : userData.skills).map((skill, index) => {
                  const level = Math.min(100, Math.max(0, Number(skill.level) || 0));
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
                            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                        )}
                        <span className="shrink-0 text-sm font-medium text-gray-900">{level}%</span>
                        {isEditing && (
                          <button type="button" onClick={() => removeSkill(index)} aria-label={`Remove ${skill.name || `skill ${index + 1}`}`} className="text-sm text-red-600 hover:text-red-800">
                            Remove
                          </button>
                        )}
                      </div>
                      {isEditing && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={level}
                          onChange={(event) => handleSkillChange(index, event.target.value)}
                          aria-label={`${skill.name || `Skill ${index + 1}`} proficiency`}
                          className="mb-3 w-full cursor-pointer accent-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          style={{
                            background: `linear-gradient(to right, #eab308 0%, #eab308 ${level}%, #e5e7eb ${level}%, #e5e7eb 100%)`
                          }}
                        />
                      )}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-2.5 rounded-full bg-yellow-500 transition-all duration-300"
                          style={{ width: `${level}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {isEditing && (
                  <button type="button" onClick={addSkill} className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
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
                <nav className="flex -mb-px" aria-label="Profile sections">
                  {['personal', 'experience', 'education'].map((tab) => (
                    <button key={tab} className={`border-b-2 px-6 py-4 text-center text-sm font-medium focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeTab === tab ? 'border-yellow-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`} onClick={() => setActiveTab(tab)}>
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
                    {isEditing ? <textarea name="bio" value={editFormData.bio || ''} onChange={handleInputChange} className={`${inputClass} h-32`} /> : <p className="whitespace-pre-wrap text-gray-700">{userData.bio || 'No bio added yet.'}</p>}

                    <h2 className="mb-4 mt-6 text-lg font-semibold text-gray-900">Emergency Contact</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        ['name', 'Name', 'text'],
                        ['relationship', 'Relationship', 'text'],
                        ['phone', 'Phone', 'tel']
                      ].map(([name, label, type]) => (
                        <div key={name}>
                          <label className={labelClass}>{label}</label>
                          {isEditing ? <input type={type} name={name} value={editFormData.emergencyContact[name] || ''} onChange={handleEmergencyContactChange} className={inputClass} /> : <p className="text-gray-900">{userData.emergencyContact[name] || 'Not provided'}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    {isEditing && <button type="button" onClick={() => addArrayItem('experience', { title: '', company: '', period: '', description: '' })} className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">+ Add Experience</button>}
                    {(isEditing ? editFormData.experience : userData.experience).map((exp, index) => (
                      <div key={exp.id || index} className="border-l-4 border-yellow-500 py-1 pl-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input value={exp.title || ''} onChange={(event) => updateArrayItem('experience', index, 'title', event.target.value)} className={inputClass} placeholder="Job title" />
                            <input value={exp.company || ''} onChange={(event) => updateArrayItem('experience', index, 'company', event.target.value)} className={inputClass} placeholder="Company" />
                            <input value={exp.period || ''} onChange={(event) => updateArrayItem('experience', index, 'period', event.target.value)} className={inputClass} placeholder="Period" />
                            <textarea value={exp.description || ''} onChange={(event) => updateArrayItem('experience', index, 'description', event.target.value)} className={inputClass} placeholder="Description" />
                            <button type="button" onClick={() => removeArrayItem('experience', index)} className="text-sm text-red-600">Remove experience</button>
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
                    {userData.experience.length === 0 && !isEditing && <p className="text-sm text-gray-500">No experience added yet.</p>}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    {isEditing && <button type="button" onClick={() => addArrayItem('education', { degree: '', institution: '', year: '' })} className="rounded-md bg-yellow-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">+ Add Education</button>}
                    {(isEditing ? editFormData.education : userData.education).map((edu, index) => (
                      <div key={edu.id || index} className="border-l-4 border-yellow-500 py-1 pl-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input value={edu.degree || ''} onChange={(event) => updateArrayItem('education', index, 'degree', event.target.value)} className={inputClass} placeholder="Degree" />
                            <input value={edu.institution || ''} onChange={(event) => updateArrayItem('education', index, 'institution', event.target.value)} className={inputClass} placeholder="Institution" />
                            <input value={edu.year || ''} onChange={(event) => updateArrayItem('education', index, 'year', event.target.value)} className={inputClass} placeholder="Year" />
                            <button type="button" onClick={() => removeArrayItem('education', index)} className="text-sm text-red-600">Remove education</button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                            <p className="text-gray-600">{edu.institution}{edu.year ? ` • ${edu.year}` : ''}</p>
                          </>
                        )}
                      </div>
                    ))}
                    {userData.education.length === 0 && !isEditing && <p className="text-sm text-gray-500">No education added yet.</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                <button type="button" onClick={() => { setShowPasswordForm((previous) => !previous); setError(''); setNotice(''); }} className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input type="password" autoComplete="current-password" required value={passwordData.currentPassword} onChange={(event) => setPasswordData((previous) => ({ ...previous, currentPassword: event.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" autoComplete="new-password" minLength="8" required value={passwordData.newPassword} onChange={(event) => setPasswordData((previous) => ({ ...previous, newPassword: event.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input type="password" autoComplete="new-password" minLength="8" required value={passwordData.confirmPassword} onChange={(event) => setPasswordData((previous) => ({ ...previous, confirmPassword: event.target.value }))} className={inputClass} />
                  </div>
                  <button type="submit" className="rounded-md bg-yellow-500 px-4 py-2 font-medium text-gray-900 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">Update Password</button>
                </form>
              )}
            </div>

            {/* Additional Info Card */}
            {/* <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="mr-3 rounded-full bg-yellow-100 p-2">
                    <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Approved vacation request for John Doe</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 rounded-full bg-gray-100 p-2">
                    <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Added new employee to the system</p>
                    <p className="text-sm text-gray-500">Yesterday</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 rounded-full bg-yellow-100 p-2">
                    <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Updated company policies document</p>
                    <p className="text-sm text-gray-500">2 days ago</p>
                  </div>
                </li>
              </ul>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRProfilePage;