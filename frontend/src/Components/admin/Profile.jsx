import React, { useState } from 'react';
// import itachi from "../../assets/itachi.png";
const AdminProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profilePhoto] = useState('https://i.pinimg.com/736x/0e/85/e0/0e85e0188510df676e3de7be49b35302.jpg');
//  const [profilePhoto] = useState(itachi);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Itachi Uchiha',
    title: 'Administrator',
    department: 'Engineering',
    email: 'itachi@company.com',
    phone: '+91 8464930451',
    location: 'Hyderabad, India',
    hireDate: 'september 15, 2025',
    bio: 'Experienced HR professional with 8 years in human resource management. Specialized in talent acquisition, employee relations, and organizational development. Committed to creating positive work environments and implementing effective HR strategies.',
    skills: [
      { name: 'Talent Acquisition', level: 95 },
      { name: 'Employee Relations', level: 90 },
      { name: 'HR Policies', level: 85 },
      { name: 'Performance Management', level: 80 },
      { name: 'Compensation & Benefits', level: 75 },
      { name: 'HR Analytics', level: 70 }
    ],
    experience: [
      {
        id: 1,
        title: 'HR Administrator',
        company: 'Current Company Inc.',
        period: '2020 - Present',
        description: 'Manage all HR operations including recruitment, onboarding, employee relations, and performance management. Implement HR strategies aligned with overall business strategy.'
      },
      {
        id: 2,
        title: 'HR Specialist',
        company: 'Previous Tech Corp.',
        period: '2016 - 2020',
        description: 'Handled recruitment processes, conducted interviews, and managed employee database. Assisted in developing and implementing HR policies and procedures.'
      }
    ],
    education: [
      {
        id: 1,
        degree: 'M.S. Human Resources Management',
        institution: 'Cornell University',
        year: '2016'
      },
      {
        id: 2,
        degree: 'B.S. Business Administration',
        institution: 'New York University',
        year: '2014'
      }
    ],
    profilePhoto: 'https://i.pinimg.com/736x/0e/85/e0/0e85e0188510df676e3de7be49b35302.jpg'
  });

  const [editFormData, setEditFormData] = useState({ ...userData });
  const [emergencyContact, setEmergencyContact] = useState({
    name: 'Sai ramm',
    relationship: 'Cousin',
    phone: '+91 8564735678'
  });

  // Handle input changes for edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Handle emergency contact changes
  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setEmergencyContact({
      ...emergencyContact,
      [name]: value
    });
  };

  // Handle skill level changes
  const handleSkillChange = (index, value) => {
    const updatedSkills = [...editFormData.skills];
    updatedSkills[index].level = parseInt(value);
    setEditFormData({
      ...editFormData,
      skills: updatedSkills
    });
  };

  // Handle profile photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditFormData({
          ...editFormData,
          profilePhoto: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save edited data
  const handleSave = () => {
    setUserData({ ...editFormData });
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditFormData({ ...userData });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 mr-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-32"></div>
          {/* <div className="bg-gradient-to-r from-gray-200 to-gray-400 h-32"></div> */}
            <div className="absolute bottom-0 right-4 m-4">
              <span className="bg-white text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">ADMIN</span>
            </div>
          <div className="px-6 pb-6 -mt-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-end">
              <div className="relative">
                <img
                  className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                  src={profilePhoto}
                  alt="Profile"
                />
                <div className="absolute bottom-2 right-2 bg-green-500 h-6 w-6 rounded-full border-2 border-white"></div>
                {isEditing && (
                  <label className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-center py-1 text-xs cursor-pointer">
                    Change Photo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className="text-3xl font-bold text-gray-900 bg-gray-100 rounded-md px-3 py-2 mb-2 w-full max-w-xs"
                    />
                    <input
                      type="text"
                      name="title"
                      value={editFormData.title}
                      onChange={handleInputChange}
                      className="text-lg text-gray-600 bg-gray-100 rounded-md px-3 py-2 w-full max-w-xs"
                    />
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mt-6 text-gray-900">{userData.name}</h1>
                    <p className="text-lg mt-2 text-gray-600">{userData.title}</p>
                  </>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start">
                  <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {userData.department}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-auto flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                      onClick={handleSave}
                    >
                      Save Changes
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 mr-6">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/3">
            {/* Personal Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className="text-gray-900 bg-gray-100 rounded-md px-2 py-1 w-full"
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
                      className="text-gray-900 bg-gray-100 rounded-md px-2 py-1 w-full"
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
                      className="text-gray-900 bg-gray-100 rounded-md px-2 py-1 w-full"
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h2>
              <div className="space-y-4">
                {(isEditing ? editFormData.skills : userData.skills).map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={skill.level}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          className="text-sm font-medium text-gray-900 w-14 bg-gray-100 rounded-md px-1"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{skill.level}%</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gray-700 h-2.5 rounded-full"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full lg:w-2/3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {['personal', 'experience', 'education'].map((tab) => (
                    <button
                      key={tab}
                      className={`py-4 px-6 text-center font-medium text-sm ${
                        activeTab === tab
                          ? 'text-gray-700 border-b-2 border-gray-700'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={editFormData.bio}
                        onChange={handleInputChange}
                        className="text-gray-700 bg-gray-100 rounded-md px-2 py-1 w-full h-32"
                      />
                    ) : (
                      <p className="text-gray-700">{userData.bio}</p>
                    )}

                    <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Emergency Contact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={emergencyContact.name}
                            onChange={handleEmergencyContactChange}
                            className="text-gray-900 bg-gray-100 rounded-md px-2 py-1 w-full"
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
                            className="text-gray-900 bg-gray-100 rounded-md px-2 py-1 w-full"
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
                            className="text-gray-900 bg-gray-100 rounded-md px-2 py-1 w-full"
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
                    {userData.experience.map(exp => (
                      <div key={exp.id} className="border-l-4 border-gray-700 pl-4 py-1">
                        <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-600">{exp.company} • {exp.period}</p>
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    {userData.education.map(edu => (
                      <div key={edu.id} className="border-l-4 border-green-500 pl-4 py-1">
                        <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                        <p className="text-gray-600">{edu.institution} • {edu.year}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Approved vacation request for John Doe</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-gray-200 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Added new employee to the system</p>
                    <p className="text-sm text-gray-500">Yesterday</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Updated company policies document</p>
                    <p className="text-sm text-gray-500">2 days ago</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;