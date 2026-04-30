import { useState } from "react";
// import { useSearchParams } from "react-router-dom";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";

const CREATE_DEPARTMENT_URL = "/department/create-departments";

const CreateDepartments = () => {
  // const [searchParams] = useSearchParams();
  // const instituteId = Number(searchParams.get("instituteId")); // ensure number
  const navigate = useNavigate();
  const { instituteId } = useParams();
  const id = Number(instituteId);
  const axiosPrivate = useAxiosPrivate();

  const [departments, setDepartments] = useState([
    { code: "", name: "" },
  ]);

  // Handle input change per row
  const handleChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...departments];
    updated[index] = { ...updated[index], [field]: value };
    setDepartments(updated);
  };

  // Add new row
  const addDepartment = () => {
    setDepartments([...departments, { code: "", name: "" }]);
  };

  // Remove row
  const removeDepartment = (index: number) => {
    const updated = departments.filter((_, i) => i !== index);
    setDepartments(updated);
  };

  // Submit all departments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosPrivate.post(CREATE_DEPARTMENT_URL, {
        instituteId: id,
        createDepartments: departments, // ✅ matches backend DTO
      });
      // const departmentId = response.data.departmentId;
      console.log(response);
      alert("Departments created successfully!");
      navigate('/create-program', { state: { departmentNames : response.data.departmentName, instituteId : response.data.instituteId} });
      setDepartments([{ code: "", name: "" }]);
    } catch (error) {
      console.error(error);
      alert("Error creating departments");
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6 mt-10">
      <h2 className="text-xl font-bold mb-4">Create Departments</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {departments.map((dept, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 border p-2 rounded-lg"
          >
            <input
              type="text"
              placeholder="Department Code"
              value={dept.code}
              onChange={(e) => handleChange(index, "code", e.target.value)}
              required
              className="flex-1 border rounded-lg p-2"
            />
            <input
              type="text"
              placeholder="Department Name"
              value={dept.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
              required
              className="flex-1 border rounded-lg p-2"
            />
            <button
              type="button"
              onClick={() => removeDepartment(index)}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addDepartment}
          className="bg-gray-200 rounded-lg px-3 py-1 hover:bg-gray-300"
        >
          + Add Department
        </button>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700"
        >
          Save All
        </button>
      </form>
    </div>
  );
};

export default CreateDepartments;
