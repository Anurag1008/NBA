import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import { Dashboard } from "./components/Dashboard";
import {Profile} from "./components/Profile";
import {Institute} from "./components/Institute"
import CreateInstitute from "./components/CreateInstitute"
import Unauthorized from "./components/Unauthorized";
import RequireAuth from "./components/RequiredAuth";
import CreateDepartments from "./components/CreateDepartments";
import {CreateProgram}  from "./components/CreateProgram";

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      
      {/* <Route path="/" element={<Home />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="institute" element={<Institute />} />
        <Route path="profile" element={<Profile />} />
        <Route path="create-institute" element={<CreateInstitute />} />
      </Route> */ }
      

      {/* Protected routes */}
      <Route element={<RequireAuth allowedRoles={["ROLE_ADMIN","ROLE_FACULTY"]} />}>
        <Route path="/" element={<Home />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRoles={["ROLE_ADMIN"]} />}>
        <Route path="/" element={<Home />}>
          <Route path="institute" element={<Institute />} />
          <Route path="create-institute" element={<CreateInstitute />} />
          <Route path="create-departments/:instituteId" element={<CreateDepartments/>}/> 
          <Route path="create-program" element={<CreateProgram />} />
        </Route>
      </Route>

    </Routes>
  );
}

export default App;
