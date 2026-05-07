import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import { Dashboard } from "./components/Dashboard";
import { Profile } from "./components/Profile";
import { Institute } from "./components/Institute";
import { InstituteDetail } from "./components/InstituteDetail";
import { DepartmentDetail } from "./components/DepartmentDetail";
import { ProgramDetail } from "./components/ProgramDetail";
import InstituteWizard from "./components/InstituteWizard";
import Unauthorized from "./components/Unauthorized";
import RequireAuth from "./components/RequiredAuth";
import CreateDepartments from "./components/CreateDepartments";
import { CreateProgram } from "./components/CreateProgram";
import { Tasks } from "./components/Tasks";
import { Users } from "./components/Users";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Routes accessible to all authenticated users */}
      <Route
        element={
          <RequireAuth
            allowedRoles={[
              "ROLE_ADMIN",
              "ROLE_PRINCIPAL",
              "ROLE_NBA_COORDINATOR",
              "ROLE_HOD",
              "ROLE_NBA_COORDINATOR_DEPT",
              "ROLE_FACULTY",
            ]}
          />
        }
      >
        <Route path="/" element={<Home />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin-only routes */}
      <Route element={<RequireAuth allowedRoles={["ROLE_ADMIN"]} />}>
        <Route path="/" element={<Home />}>
          <Route path="institute" element={<Institute />} />
          <Route path="institute/:instituteId" element={<InstituteDetail />} />
          <Route path="department/:departmentId" element={<DepartmentDetail />} />
          <Route path="program/:programId" element={<ProgramDetail />} />
          <Route path="users" element={<Users />} />
          <Route path="create-institute" element={<InstituteWizard />} />
          <Route path="create-departments/:instituteId" element={<CreateDepartments />} />
          <Route path="create-program" element={<CreateProgram />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
