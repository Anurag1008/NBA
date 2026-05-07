# NBA Accreditation Portal — Project Documentation

> National Board of Accreditation (NBA) portal for Indian educational institutions to manage the accreditation process — tracking institutes, departments, programs, faculty, and NBA file assignments.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Schema](#6-database-schema)
7. [Authentication & Security](#7-authentication--security)
8. [API Reference](#8-api-reference)
9. [Frontend File Reference](#9-frontend-file-reference)
10. [Backend File Reference](#10-backend-file-reference)
11. [Running the Project](#11-running-the-project)

---

## 1. Project Overview

The NBA portal allows educational institutes to manage the NBA accreditation lifecycle:

- Admins create and manage institutes, departments, and programs
- Admins manage users — create with role + institute mapping, change roles inline (from the Users table or the Program detail page)
- Any authenticated user maintains their own profile (personal details + qualifications) via `/profile`
- Faculty are assigned NBA documentation files
- Admins monitor portal-wide stats (institutes, departments, users)
- Faculty see their own task/file assignment stats on the dashboard

**User Roles**

| Role | Description |
|------|-------------|
| `ROLE_ADMIN` | Full access — manage institutes, departments, programs, users |
| `ROLE_PRINCIPAL` | Institute principal (defined, not yet fully implemented) |
| `ROLE_HOD` | Head of Department |
| `ROLE_NBA_COORDINATOR` | NBA Coordinator at institute level |
| `ROLE_NBA_COORDINATOR_DEPT` | NBA Coordinator at department level |
| `ROLE_FACULTY` | Faculty member — views assigned files and tasks |

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | ~5.8 | Type safety |
| Vite | 7 | Build tool / dev server |
| Tailwind CSS | 3 | Utility-first styling |
| MUI (Material UI) | 7 | Component library |
| MUI X DataGrid | 9 | Data tables |
| React Router | 7 | Client-side routing |
| Axios | 1.11 | HTTP client |
| jwt-decode | 4 | Decode JWT tokens client-side |
| react-icons | 5 | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | Latest | Application framework |
| Spring Security | Latest | Authentication & authorization |
| Spring Data JPA | Latest | ORM / database layer |
| PostgreSQL | Latest | Relational database |
| JWT (jjwt) | Latest | Stateless auth tokens |
| Lombok | Latest | Boilerplate reduction |

---

## 3. Project Structure

```
NBA/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/               # Axios instances
│   │   ├── components/        # All page & UI components
│   │   │   └── cards/         # Reusable card components
│   │   ├── context/           # React context (Auth)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.tsx            # Route definitions
│   │   └── main.tsx           # App entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Spring Boot backend
│   └── src/main/java/com/portal/backend/
│       ├── config/            # App config, data seeder
│       ├── controller/        # REST controllers
│       ├── dto/               # Data transfer objects
│       ├── entity/            # JPA entities
│       ├── ErrorHandling/     # Error response models
│       ├── exception/         # Custom exceptions
│       ├── payload/
│       │   ├── request/       # Request body classes
│       │   └── response/      # Response body classes
│       ├── repository/        # Spring Data JPA repositories
│       ├── security/          # JWT, filters, Web Security config
│       │   ├── jwt/           # JWT utilities & filter
│       │   └── services/      # UserDetails implementations
│       └── service/           # Business logic services
│
└── Project_documentation.md
```

---

## 4. Frontend Architecture

### Routing (`App.tsx`)

```
/login                          → Login (public)
/unauthorized                   → Unauthorized page (public)

[Authenticated — any role: ADMIN, PRINCIPAL, NBA_COORDINATOR,
                            HOD, NBA_COORDINATOR_DEPT, FACULTY]
  /                             → redirects to /dashboard
  /dashboard                    → Dashboard (admin shows stats; others show shell)
  /tasks                        → Tasks (file assignments)
  /profile                      → User profile (details + qualifications)

[Admin only]
  /institute                    → Institutes grid
  /institute/:instituteId       → Institute detail
  /department/:departmentId     → Department detail
  /program/:programId           → Program detail (with inline role-change action)
  /users                        → User management
  /create-institute             → 3-step institute wizard
  /create-departments/:id       → Create departments (standalone)
  /create-program               → Create programs (standalone)
```

### Auth Flow

```
Login → POST /api/v1/auth/signin
      ← { accessToken }  +  HttpOnly cookie: refreshToken

All private requests → Authorization: Bearer <accessToken>

Token expired (403) → GET /api/v1/auth/refreshtoken (uses cookie)
                    ← { accessToken }  → retry original request

Logout → POST /api/v1/auth/signout → deletes refresh token in DB
       → clears local auth state → redirect /login
```

### State Management

- **Auth state** is held in `AuthProvider` context (email, roles, accessToken)
- No global store (Redux/Zustand) — component-level state + context
- `useAxiosPrivate` automatically attaches the Bearer token and handles 403 token refresh

### Key Components

| Component | Route | Role Access |
|-----------|-------|-------------|
| `Login` | `/login` | Public |
| `Dashboard` | `/dashboard` | All authenticated |
| `Institute` | `/institute` | Admin |
| `InstituteDetail` | `/institute/:id` | Admin |
| `DepartmentDetail` | `/department/:id` | Admin |
| `ProgramDetail` | `/program/:id` | Admin (inline role edit per user) |
| `Users` | `/users` | Admin |
| `EditRoleDialog` | shared | Admin (used by `Users` and `ProgramDetail`) |
| `InstituteWizard` | `/create-institute` | Admin |
| `Tasks` | `/tasks` | All authenticated |
| `Profile` | `/profile` | All authenticated |
| `Sidebar` | Layout | All authenticated |
| `Home` | Layout shell | All authenticated |

---

## 5. Backend Architecture

### Server Config
- **Port:** `8085`
- **Context path:** `/api/v1`
- **Full base URL:** `http://localhost:8085/api/v1`

### Package Structure

```
com.portal.backend/
├── controller/          REST API endpoints
├── entity/              JPA-mapped database tables
├── payload/
│   ├── request/         @RequestBody classes
│   └── response/        Response record/classes
├── repository/          Spring Data interfaces
├── security/
│   ├── jwt/             AuthTokenFilter, JwtUtils, AuthEntryPointJwt
│   └── services/        UserDetailsImpl, UserDetailsServiceImpl, RefreshTokenService
├── config/              AppConfig, DataSeeder
├── exception/           TokenRefreshException
└── service/             UserService
```

### Security Filter Chain (request processing order)

```
Request
  → CORS filter (WebSecurityConfig.corsConfigurationSource)
  → AuthTokenFilter (parse JWT → set SecurityContext)
  → URL authorization rules
  → Controller method
  → @PreAuthorize (method-level role check)
```

### CORS Configuration
- Allowed origin: `http://localhost:5173`
- Allowed methods: GET, POST, PUT, DELETE
- Credentials: allowed
- Headers: all

---

## 6. Database Schema

### Tables

#### `institute`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| name | VARCHAR | Unique, not null |
| code | VARCHAR | Unique |
| address_line1 | VARCHAR | |
| address_line2 | VARCHAR | |
| city | VARCHAR | |
| state | VARCHAR | |
| country | VARCHAR | |
| pincode | VARCHAR | |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | Auto-set |

#### `department`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| name | VARCHAR | Not null |
| code | VARCHAR | |
| is_active | BOOLEAN | Default true |
| institute_id | FK → institute | |

#### `programs`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| name | VARCHAR | Not null |
| level | VARCHAR | e.g. UG, PG |
| is_active | BOOLEAN | Default true |
| department_id | FK → department | |
| institute_id | FK → institute | |

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| username | VARCHAR(20) | Unique |
| email | VARCHAR(50) | Unique, not null |
| password | VARCHAR | BCrypt encoded |
| institute_id | FK → institute | |
| department_id | FK → department | |
| program_id | FK → programs | |

#### `roles`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| name | ENUM | ROLE_ADMIN, ROLE_FACULTY, etc. |

#### `user_roles` (join table)
| Column | Type |
|--------|------|
| user_id | FK → users |
| role_id | FK → roles |

#### `refresh_token`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| token | VARCHAR | UUID |
| expiry_date | TIMESTAMP | |
| user_id | FK → users | |

#### `nba_file`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| code | VARCHAR | Not null |
| title | VARCHAR | Not null |
| description | VARCHAR | |
| is_active | BOOLEAN | Not null |
| file_link | VARCHAR | Not null |
| program_id | FK → programs | |
| institute_id | FK → institute | |
| department_id | FK → department | |

#### `nba_file_assignment`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| assigned_by | BIGINT | User ID of assigner |
| assigned_at | TIME | |
| due_date | DATE | |
| status | VARCHAR | PENDING / COMPLETED / OVERDUE |
| user_id | FK → users | Faculty assigned to |
| nba_file_id | FK → nba_file | |

#### `user_info`
Shared primary-key 1:1 with `users` (id == users.id; no auto-generation).

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Same as users.id (manually assigned) |
| first_name | VARCHAR | Not null |
| date_of_birth | DATE | Not null |
| date_of_joining | DATE | Not null |
| designation | VARCHAR | Not null |
| emp_code | VARCHAR | |
| phone | VARCHAR | |
| is_active | BOOLEAN | Not null, default true |
| created_at | TIME | Set on construction |
| user_id | FK → users | |

#### `qualification`
A user can have many qualifications (one row per degree).

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated (IDENTITY) |
| degree_name | VARCHAR | Not null |
| level | VARCHAR | UG / PG / PHD / Diploma |
| year_of_completion | DATE | Not null |
| university | VARCHAR | Not null |
| user_id | FK → users | |

---

## 7. Authentication & Security

### JWT Configuration
| Property | Value |
|----------|-------|
| Access token expiry | 1 hour (3,600,000 ms) |
| Refresh token expiry | 24 hours (86,400,000 ms) |
| Refresh token storage | HttpOnly cookie (`refreshToken`) |
| Cookie SameSite | Lax |
| Cookie Secure | false (dev) |

### JWT Token Payload
```json
{
  "email": "user@example.com",
  "id": 1,
  "roles": ["ROLE_FACULTY"]
}
```

### URL-Level Security Rules
| Pattern | Rule |
|---------|------|
| `/auth/**`, `/error` | permitAll |
| `/admin/**` | hasRole(ADMIN) |
| `/api/faculty/**` | hasRole(FACULTY) (note: path mismatch — use @PreAuthorize) |
| `anyRequest` | authenticated |

> Note: Method-level `@PreAuthorize` is enabled via `@EnableMethodSecurity` and provides the primary role enforcement.

---

## 8. API Reference

**Base URL:** `http://localhost:8085/api/v1`

All authenticated endpoints require: `Authorization: Bearer <accessToken>`

---

### Auth — `/auth`

#### `POST /auth/signin`
Sign in and get access token.

**Request**
```json
{ "email": "admin@example.com", "password": "password" }
```
**Response** `200`
```json
{ "accessToken": "<jwt>" }
```
Sets HttpOnly cookie: `refreshToken=<uuid>`

---

#### `POST /auth/signup`
Create a single user. **Admin only.**

**Request**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "Password@123",
  "role": ["faculty"]
}
```
**Response** `200` `{ "message": "User registered successfully!" }`

---

#### `POST /auth/create-Multiple-Users`
Create multiple faculty users with default password. **Admin only.**

**Request**
```json
{ "user_email": ["a@x.com", "b@x.com"] }
```
**Response** `200` `{ "message": "Users registered successfully!" }`

---

#### `POST /auth/update-user-role`
Update role(s) of an existing user. **Admin only.**

**Request**
```json
{ "email": "user@x.com", "roles": ["hod"] }
```
Role values: `admin`, `principle`, `hod`, `faculty`

**Response** `200` `{ "message": "Users role updated successfully!" }`

---

#### `GET /auth/refreshtoken`
Refresh access token using the HttpOnly cookie.

**Response** `200`
```json
{ "accessToken": "<new_jwt>" }
```
Rotates the refresh token cookie.

---

#### `POST /auth/signout`
Logout — deletes refresh token from DB. **Authenticated.**

**Response** `200` `{ "message": "Log out successful!" }`

---

#### `GET /auth/users`
*(Legacy — prefer `/admin/users`)* List all users. **Admin only.**

---

### Admin — `/admin`

All endpoints require `ROLE_ADMIN`.

#### `GET /admin/stats`
Returns portal-wide counts.

**Response** `200`
```json
{ "institutes": 5, "departments": 12, "users": 48 }
```

---

#### `GET /admin/users`
List all registered users with their roles.

**Response** `200`
```json
[
  { "id": 1, "username": "john", "email": "john@x.com", "roles": ["ROLE_FACULTY"] }
]
```

---

#### `POST /admin/create-users`
Create one or more users with specified roles and default password `Default@123`. Each row may optionally bind the user to an institute.

**Request**
```json
{
  "users": [
    { "email": "alice@x.com", "role": "ROLE_FACULTY", "instituteId": 1 },
    { "email": "bob@x.com",   "role": "ROLE_HOD",     "instituteId": null }
  ]
}
```
**Role values:** `ROLE_ADMIN`, `ROLE_PRINCIPAL`, `ROLE_HOD`, `ROLE_NBA_COORDINATOR`, `ROLE_NBA_COORDINATOR_DEPT`, `ROLE_FACULTY`

`instituteId` is optional — when provided, the new user is mapped to that institute. The `Users.tsx` create dialog fetches `/institute/show-institute` and renders the choices in a per-row dropdown.

**Response** `200` `{ "message": "Users registered successfully!" }`
**Response** `400` `{ "message": "Error: Email alice@x.com is already in use!" }`
**Response** `400` `{ "message": "Error: Institute not found with id 99" }`

---

#### `PUT /admin/users/{userId}/role`
Replace a user's role. Powers the "Change Role" action in the Users table and inline on the Program Detail page.

**Request**
```json
{ "role": "ROLE_HOD" }
```
The `role` value is normalized — `HOD`, `hod`, `Hod`, and `ROLE_HOD` all resolve. Unknown values return `400`.

**Response** `200`
```json
{
  "id": 5,
  "username": "alice",
  "email": "alice@x.com",
  "roles": ["ROLE_HOD"],
  "message": "Role updated successfully"
}
```
**Response** `404` if no user matches `userId`.

The frontend prevents an admin from selecting their own row (button disabled with tooltip), but the backend does not enforce this — clients are trusted on this point.

---

### Current-User Profile — `/users/me`

All endpoints require **any authenticated user**. Each user can only read and write their own profile and qualifications.

#### `GET /users/me/details`
Fetch the current user's profile (returns `null` for fields that haven't been filled in yet).

**Response** `200`
```json
{
  "username": "alice",
  "email": "alice@x.com",
  "firstName": "Alice",
  "dateOfBirth": "1992-04-12",
  "dateOfJoining": "2020-08-01",
  "designation": "Assistant Professor",
  "empCode": "EMP123",
  "phone": "9876543210"
}
```

#### `PUT /users/me/details`
Upsert the current user's profile. The `UserInfo` row uses a shared primary key (id == users.id) so the first write seeds it, subsequent writes update it.

**Request**
```json
{
  "firstName": "Alice",
  "date_of_birth": "1992-04-12",
  "date_of_joining": "2020-08-01",
  "designation": "Assistant Professor",
  "emp_code": "EMP123",
  "phone": "9876543210"
}
```
Returns the same shape as `GET /users/me/details`.

#### `GET /users/me/qualifications`
List the current user's qualifications, ordered by completion year descending.

**Response** `200`
```json
[
  {
    "id": 12,
    "degreeName": "M.Tech CSE",
    "level": "PG",
    "yearOfCompletion": "2018-06-15",
    "university": "IIT Bombay"
  }
]
```

#### `POST /users/me/qualifications`
Add a qualification.

**Request**
```json
{
  "degreeName": "B.Tech CSE",
  "level": "UG",
  "yearOfCompletion": "2014-05-20",
  "university": "Pune University"
}
```
Returns the saved record (with auto-generated `id`).

#### `PUT /users/me/qualifications/{id}`
Update an existing qualification. Returns `404` unless the row both exists and belongs to the current user.

#### `DELETE /users/me/qualifications/{id}`
Delete an existing qualification. Same ownership check as the PUT.

**Response** `200` `{ "message": "Qualification deleted." }`

---

### Institute — `/institute`

All endpoints require `ROLE_ADMIN`.

#### `GET /institute/show-institute`
Fetch all institutes with their departments.

**Response** `200` — array of `Institute` objects (includes `departmentList`)

---

#### `POST /institute/create-institute`
Create a new institute.

**Request**
```json
{
  "name": "ABC Engineering College",
  "code": "ABC",
  "addressLine1": "123 Main St",
  "addressLine2": "",
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "411001"
}
```
**Response** `200` `{ "id": 1 }`
**Response** `400` if name or code already exists.

---

### Department — `/department`

#### `POST /department/create-departments`
Create one or more departments under an institute. **Admin only.**

**Request**
```json
{
  "instituteId": 1,
  "createDepartments": [
    { "code": "CS", "name": "Computer Science" },
    { "code": "EC", "name": "Electronics" }
  ]
}
```
**Response** `200`
```json
{ "instituteId": 1, "departmentName": ["Computer Science", "Electronics"] }
```

---

### Program — `/program`

#### `POST /program/create-programs`
Create one or more programs under a department. **Admin only.**

**Request**
```json
{
  "instituteId": 1,
  "departmentName": "Computer Science",
  "programs": [
    { "name": "B.Tech CSE", "level": "UG" },
    { "name": "M.Tech CSE", "level": "PG" }
  ]
}
```
**Response** `200` `{ "message": "Program created successfully" }`

---

### Faculty — `/faculty`

#### `GET /faculty/my-stats`
Get file assignment stats for the currently logged-in user. **Authenticated (any role).**

**Response** `200`
```json
{
  "total": 10,
  "pending": 4,
  "completed": 5,
  "overdue": 1
}
```

#### `POST /faculty/update-faculty-details`
Update profile details for the logged-in faculty. **Requires `ROLE_FACULTY`.**

**Request**
```json
{
  "firstName": "John",
  "date_of_birth": "1990-01-15",
  "date_of_joining": "2018-07-01",
  "designation": "Assistant Professor",
  "emp_code": "EMP001",
  "phone": "9876543210"
}
```
**Response** `200` `"User details updated successfully!"`

---

## 9. Frontend File Reference

### `src/api/`
| File | Purpose |
|------|---------|
| `axios.tsx` | Two Axios instances: default (public, no credentials) and `axiosPrivate` (with `Authorization` header + `withCredentials: true`) |

### `src/context/`
| File | Purpose |
|------|---------|
| `AuthProvider.tsx` | React context holding `{ auth, setAuth }`. `auth` shape: `{ email, roles[], accessToken }` |

### `src/hooks/`
| File | Purpose |
|------|---------|
| `useAuth.ts` | Consumes `AuthContext` |
| `useAxiosPrivate.tsx` | Attaches Bearer token to requests; intercepts 403 to auto-refresh token |
| `useRefreshToken.tsx` | Calls `GET /auth/refreshtoken`, updates auth context with new token |

### `src/components/`
| File | Route | Description |
|------|-------|-------------|
| `Login.tsx` | `/login` | Email + password login form |
| `Home.tsx` | `/` | Layout shell — renders `<Sidebar>` + `<Outlet>` |
| `Sidebar.tsx` | layout | Collapsible left nav; Dashboard / Tasks / Profile visible to all roles, Institutes / Users admin-only; Quick Actions block (admin only); handles logout via signout API |
| `Dashboard.tsx` | `/dashboard` | Admin: gradient hero with date + CTAs, gradient stat cards (Institutes / Departments / Users), Quick Actions row (Create Institute, View Institutes, Manage Users), Catalog Uploads, Institutes directory. Faculty: file assignment stats (total / pending / completed / overdue) |
| `Institute.tsx` | `/institute` | Searchable card grid of all institutes (admin only) |
| `InstituteDetail.tsx` | `/institute/:id` | Per-institute detail with department list (admin only) |
| `DepartmentDetail.tsx` | `/department/:id` | Per-department detail (admin only) |
| `ProgramDetail.tsx` | `/program/:id` | Per-program detail; lists assigned users with an inline "Role" button per row that opens the shared `EditRoleDialog` (admin only) |
| `InstituteWizard.tsx` | `/create-institute` | 3-step form wizard: Step 1 Create Institute → Step 2 Add Departments → Step 3 Add Programs |
| `CreateDepartments.tsx` | `/create-departments/:id` | Standalone department creation for a given institute |
| `CreateProgram.tsx` | `/create-program` | Standalone program creation |
| `Users.tsx` | `/users` | Admin user list (DataGrid with search). "Create Users" dialog has per-row Email / Role / Institute dropdown (institutes fetched from `/institute/show-institute`). Each row also has a "Role" action that opens the shared `EditRoleDialog`. Self-edit is disabled. |
| `EditRoleDialog.tsx` | shared | Reusable dialog that calls `PUT /admin/users/{id}/role`. Accepts any `{ id, username, email, roles[] }` shape, so it works in both the Users table and the Program Detail user list. Exports the `ROLES` constant used by both flows. |
| `Tasks.tsx` | `/tasks` | Faculty file assignments list with filter chips (All / Pending / Completed / Overdue) — API not yet implemented |
| `Profile.tsx` | `/profile` | Gradient hero (avatar, name, email, role), Personal Details section (`firstName`, designation, employee code, phone, DOB, joining date) with Edit Profile dialog, and Qualifications section with Add / Edit / Delete per row; level pills color-coded for UG / PG / PHD / Diploma. Backed by `/users/me/details` and `/users/me/qualifications`. |
| `Unauthorized.tsx` | `/unauthorized` | Shown when a user accesses a route they don't have permission for |
| `RequiredAuth.tsx` | — | Route guard HOC — checks auth roles, redirects to `/login` or `/unauthorized` |
| `PersistLogin.tsx` | — | Attempts token refresh on page reload to restore session |
| `types.tsx` | — | Shared TypeScript interfaces (`Institute`, `ProgramUser`, `ProgramDetail`, etc.) |

### `src/components/cards/`
| File | Purpose |
|------|---------|
| `InstituteCard.tsx` | Card UI for a single institute |
| `DepartmentCard.tsx` | Card UI for a department |
| `ProgramCard.tsx` | Card UI for a program |

---

## 10. Backend File Reference

### Controllers
| File | Base Path | Description |
|------|-----------|-------------|
| `AuthController.java` | `/auth` | Signin, signup, refresh token, signout, update user role, create multiple users |
| `AdminStatsController.java` | `/admin` | Portal stats, list users, create users with role + optional institute mapping, role update (`PUT /admin/users/{id}/role`), bulk-upload via Excel |
| `UserProfileController.java` | `/users/me` | Current-user profile (`GET/PUT /me/details`) and qualifications CRUD (`GET/POST /me/qualifications`, `PUT/DELETE /me/qualifications/{id}`); accessible to any authenticated user |
| `InstituteController.java` | `/institute` | Create, list, and per-institute detail |
| `DepartmentController.java` | `/department` | Create departments under an institute |
| `ProgramController.java` | `/program` | Create programs under a department, plus program detail endpoint used by `ProgramDetail.tsx` |
| `FacultyController.java` | `/faculty` | My file assignment stats; legacy `update-faculty-details` (use `/users/me/details` instead) |
| `CoreCatalogController.java` | `/core` | Bulk Excel upload of core departments and programs (admin-only) |
| `FileController.java` | — | Placeholder (not yet implemented) |
| `NBACoordinatorController.java` | — | Placeholder (not yet implemented) |
| `InitializeProgramFilesController.java` | — | Placeholder (not yet implemented) |

### Entities
| File | Table | Key Relations |
|------|-------|---------------|
| `Institute.java` | `institute` | Has many `Department`, `AcadmicYear` |
| `Department.java` | `department` | Belongs to `Institute`; has many `Programs` |
| `Programs.java` | `programs` | Belongs to `Department` and `Institute`; has many `NbaFile`, `Users` |
| `Users.java` | `users` | Many-to-many `Roles` (EAGER); has many `NbaFileAssignment`, `Qualification`; one `UserInfo` |
| `Roles.java` | `roles` | Enum: ROLE_ADMIN, ROLE_PRINCIPAL, ROLE_NBA_COORDINATOR, ROLE_HOD, ROLE_NBA_COORDINATOR_DEPT, ROLE_FACULTY |
| `NbaFile.java` | `nba_file` | Belongs to `Programs`, `Institute`, `Department`; has many `NbaFileAssignment` |
| `NbaFileAssignment.java` | `nba_file_assignment` | Belongs to `Users` and `NbaFile`; status: PENDING / COMPLETED / OVERDUE |
| `UserInfo.java` | `user_info` | One-to-one with `Users`; stores firstName, DOB, designation, empCode, phone |
| `RefreshToken.java` | `refresh_token` | UUID token linked to `Users` |
| `AcadmicYear.java` | `acadmic_year` | Linked to `Institute` |
| `CommonFiles.java` | `common_files` | Common NBA files |
| `Qualification.java` | `qualification` | Faculty qualification linked to `Users` |
| `ERole.java` | — | Enum of all roles |

### Repositories
| File | Entity | Notable Methods |
|------|--------|-----------------|
| `UserRepository` | `Users` | `findByEmail`, `existsByEmail`, `existsByUsername` |
| `InstituteRepository` | `Institute` | `existsByName`, `existsByCode` |
| `DepartmentRepository` | `Department` | `findByInstituteId`, `findByInstituteIdAndCodeIgnoreCase`, `findByInstituteIdAndNameIgnoreCase` |
| `ProgramRepository` | `Programs` | `findByDepartmentIdAndCodeIgnoreCase`, `findByDepartmentIdAndNameIgnoreCase` |
| `CoreDepartmentRepository` | `CoreDepartment` | Catalog dept lookup |
| `CoreProgramRepository` | `CoreProgram` | Catalog program lookup |
| `RoleRepository` | `Roles` | `findByName(ERole)` |
| `RefreshTokenRepository` | `RefreshToken` | `findByToken`, `deleteByUser` |
| `UserInfoRepository` | `UserInfo` | `findByUsersId`, `findByUsers` |
| `QualificationRepository` | `Qualification` | `findByUsersIdOrderByYearOfCompletionDesc` |
| `NbaFileAssignmentRepository` | `NbaFileAssignment` | `countByUsersEmail`, `countByUsersEmailAndStatus` |

### Security
| File | Purpose |
|------|---------|
| `WebSecurityConfig.java` | Security filter chain, CORS config, URL authorization rules |
| `AuthTokenFilter.java` | Parses JWT from `Authorization` header, sets `SecurityContextHolder` |
| `JwtUtils.java` | Generate, validate, and parse JWT tokens |
| `AuthEntryPointJwt.java` | Returns 401 JSON response for unauthenticated requests |
| `UserDetailsImpl.java` | Spring Security `UserDetails` wrapper around `Users` entity |
| `UserDetailsServiceImpl.java` | Loads `UserDetailsImpl` by email for Spring Security |
| `RefreshTokenService.java` | Create, verify expiry, and delete refresh tokens in DB |

### Payload
| File | Used By | Fields |
|------|---------|--------|
| `LoginRequest` | `POST /auth/signin` | `email`, `password` |
| `SignupRequest` | `POST /auth/signup` | `username`, `email`, `password`, `role` |
| `CreateMultipleUserRequest` | `POST /auth/create-Multiple-Users` | `user_email: List<String>` |
| `AdminCreateUsersRequest` | `POST /admin/create-users` | `users: List<{email, role, instituteId?}>` |
| `UpdateUserRoleRequest` | `PUT /admin/users/{id}/role` | `role` |
| `QualificationRequest` | `POST/PUT /users/me/qualifications` | `degreeName`, `level`, `yearOfCompletion`, `university` |
| `UpdateUserRole` | `POST /auth/update-user-role` | `email`, `roles: Set<String>` |
| `CreateInstituteRequest` | `POST /institute/create-institute` | `name`, `code`, address fields |
| `CreateDepartmentRequest` | `POST /department/create-departments` | `instituteId`, `createDepartments: [{code, name}]` |
| `CreateProgramRequest` | `POST /program/create-programs` | `instituteId`, `departmentName`, `programs: [{name, level}]` |
| `AddUserDetailRequest` | `POST /faculty/update-faculty-details` | `firstName`, `date_of_birth`, `date_of_joining`, `designation`, `emp_code`, `phone` |
| `JwtResponse` | `POST /auth/signin` response | `accessToken` |
| `TokenRefreshResponse` | `GET /auth/refreshtoken` response | `accessToken` |
| `AdminStatsResponse` | `GET /admin/stats` response | `institutes`, `departments`, `users` |
| `MessageResponse` | Generic success/error | `message` |
| `InstituteCreatedResponse` | `POST /institute/create-institute` response | `id` |
| `DepartmentCreatedResponse` | `POST /department/create-departments` response | `instituteId`, `departmentName` |

---

## 11. Running the Project

### Prerequisites
- Java 17+
- Node.js 20.19+ (or 22.12+)
- PostgreSQL running on port 5432
- Database named `NBA` created

### Backend

```bash
# From /backend directory
./mvnw spring-boot:run
# Starts on http://localhost:8085
```

**Database setup:** Spring JPA with `ddl-auto=update` auto-creates/updates tables on startup. Roles are seeded via `DataSeeder.java` on first run.

### Frontend

```bash
# From /frontend directory
npm install
npm run dev
# Starts on http://localhost:5173
```

### Default Credentials

Users created via `POST /admin/create-users` get default password: **`Default@123`**

Users created via `POST /auth/signup` use the password provided in the request.

---

## Notes & Known Issues

- `FileController`, `NBACoordinatorController`, `InitializeProgramFilesController` are stubs — not yet implemented.
- `Tasks.tsx` frontend uses a placeholder timeout; the backend task endpoints are not yet implemented.
- The security config has some URL matchers with incorrect paths (e.g. `/api/faculty/**`) — these are non-functional; rely on `@PreAuthorize` for role enforcement. `/users/me/**` falls through to `anyRequest().authenticated()` and is gated by `@PreAuthorize("isAuthenticated()")` on each handler.
- `@CrossOrigin(origins = "*")` on `AuthController` conflicts with `withCredentials: true` — admin/management endpoints have been moved to `/admin/**` to avoid this issue.
- Node.js 20.17 is below Vite's minimum (20.19) — upgrade recommended.
- `UserInfo.id` has no `@GeneratedValue` — `UserProfileController` sets `id = users.id` on first save (shared-PK 1:1 mapping). The legacy `FacultyController.updateUserDetails` does not do this and may fail on first save; prefer the `/users/me/details` endpoint.
- `Qualification.id` is now `@GeneratedValue(IDENTITY)`; if a database existed before this change, run a migration to convert the column to identity (Hibernate `ddl-auto=update` will not retro-fit identity on an existing column).
- The role-change endpoint (`PUT /admin/users/{id}/role`) does not block self-demotion server-side — the UI disables the "Role" button on the admin's own row, but a direct API call would still succeed.
