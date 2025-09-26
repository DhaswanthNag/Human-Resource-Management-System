# HRMS App Directory Structure

This document outlines the directory structure of the HRMS application.
<pre>
hrms-app/
├─ .github/
│  └─ workflows/ci.yml
├─ public/
│  ├─ index.html
│  ├─ manifest.json               # PWA manifest
│  ├─ icons/
│  │  ├─ icon-192.png
│  │  └─ icon-512.png
│  └─ robots.txt
├─ src/
│  ├─ assets/                     # static assets: logos, seed images, fonts
│  │  ├─ logo.svg
│  │  └─ fonts/
│  ├─ components/                 # generic, app-wide reusable UI components
│  │  ├─ ui/
│  │  │  ├─ Button/
│  │  │  │  ├─ Button.jsx
│  │  │  │  └─ Button.module.css
│  │  │  ├─ Modal/
│  │  │  └─ Table/
│  │  └─ layout/
│  │     ├─ AppShell.jsx          # top-level layout: header + sidebar + footer
│  │     ├─ Header.jsx
│  │     └─ Sidebar.jsx
│  ├─ features/                   # feature/domain-driven folders
│  │  ├─ auth/
│  │  │  ├─ components/           # LoginForm, ForgotPassword
│  │  │  ├─ hooks/
│  │  │  ├─ authSlice.js
│  │  │  └─ authAPI.js
│  │  ├─ employees/
│  │  │  ├─ components/           # EmployeeCard, EmployeeForm
│  │  │  ├─ pages/                # EmployeesListPage.jsx, EmployeeDetailPage.jsx
│  │  │  ├─ employees.api.js
│  │  │  └─ employees.slice.js
│  │  ├─ attendance/
│  │  │  ├─ components/           # Timesheet, CalendarView, PunchButton
│  │  │  ├─ pages/
│  │  │  │  ├─ AttendanceDashboard.jsx
│  │  │  │  └─ MyTimesheet.jsx
│  │  │  └─ attendance.api.js
│  │  ├─ payroll/
│  │  │  ├─ components/           # PayslipPreview, SalarySetupForm
│  │  │  ├─ pages/                # PayrollDashboard, PayrollRunPage
│  │  │  └─ payroll.api.js
│  │  ├─ recruitment/
│  │  │  ├─ components/           # JobList, CandidateCard, InterviewScheduler
│  │  │  ├─ pages/
│  │  │  └─ recruitment.api.js
│  │  ├─ reports/
│  │  │  ├─ components/           # Charts, Filters
│  │  │  ├─ pages/
│  │  │  └─ reports.api.js
│  │  ├─ notifications/
│  │  │  ├─ push.js               # client push subscription helpers
│  │  │  └─ notifications.api.js
│  │  ├─ settings/
│  │  │  ├─ pages/
│  │  │  └─ settings.api.js
│  │  └─ notes/
│  │     ├─ components/           # NoteList, NoteDetail
│  │     ├─ pages/                # NotesPage.jsx
│  │     └─ notes.api.js
│  ├─ pages/                      # top-level route pages (composed from features)
│  │  ├─ Dashboard/
│  │  │  └─ AdminDashboard.jsx
│  │  ├─ Profile/
│  │  │  └─ ProfilePage.jsx
│  │  └─ NotFound.jsx
│  ├─ services/                   # cross-feature services (api client, auth util)
│  │  ├─ api.js                   # axios instance + interceptors
│  │  ├─ authService.js
│  │  └─ fileService.js
│  ├─ store/                      # Redux Toolkit (or Zustand) configuration
│  │  ├─ index.js                 # configureStore
│  │  └─ rootReducer.js
│  ├─ hooks/                      # app-level reusable hooks
│  │  ├─ useDebounce.js
│  │  └─ useFetch.js
│  ├─ contexts/                   # small scoped contexts (Theme, Modal)
│  │  └─ ThemeContext.jsx
│  ├─ routes/
│  │  └─ AppRoutes.jsx            # route definitions + auth guards
│  ├─ utils/                      # helpers, validators, formatters
│  │  ├─ validators.js
│  │  └─ dateUtils.js
│  ├─ constants/                  # app-wide constants and enums
│  │  └─ roles.js
│  ├─ types/                      # (optional) TypeScript types or PropTypes
│  ├─ i18n/                       # localization
│  ├─ styles/                     # global css / material-theme overrides
│  │  └─ theme.js                 # MUI theme overrides
│  ├─ App.jsx                     # providers, theme, layout wrapper
│  ├─ main.jsx                    # bootstrapping, service-worker registration
│  ├─ service-worker.js           # PWA service worker (caching + push handler)
│  └─ setupTests.js
├─ .env
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
├─ vite.config.js (or cra config)
└─ README.md
</pre>

## Notes
- **Feature-Driven Structure**: The app is organized by features for scalability and maintainability.
- **Reusable Components**: Generic UI components are placed in `src/components/ui`.
- **Global State Management**: Redux Toolkit (or Zustand) is used for state management.
- **Localization**: The `i18n/` folder is used for internationalization.
- **PWA Support**: Includes a service worker and manifest for Progressive Web App functionality.

Feel free to update this structure as your project

