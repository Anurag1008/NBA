import { useState } from "react";
import { useLocation  } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

interface Program {
  name: string;
  level: string;
  isActive: boolean;
}

const CREATE_PROGRAM_URL = "/program/create-programs";

export const CreateProgram = () => {
  const location = useLocation();
//   const navigate = useNavigate();
  const { instituteId, departmentNames } = location.state || {};

  const axiosPrivate = useAxiosPrivate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program>({
    name: "",
    level: "",
    isActive: true,
  });

  // --- Handle department search ---
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setSuggestions([]);
    } else {
      const filtered = departmentNames.filter((name: string) =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  // --- Select department ---
  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    setSelectedDepartment(name);
    setSuggestions([]);
  };

  // --- Handle program input ---
  const handleProgramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentProgram((prev) => ({ ...prev, [name]: value }));
  };

  // --- Add current program to list ---
  const handleAddProgram = () => {
    if (!currentProgram.name.trim() || !currentProgram.level.trim()) return;

    setPrograms([...programs, currentProgram]);
    setCurrentProgram({ name: "", level: "", isActive: true });
  };

  // --- Submit all programs ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartment) {
      alert("Please select a department first!");
      return;
    }

    try {
      const payload = {
        instituteId: instituteId ,
        departmentName: selectedDepartment,
        programs,
      };

      await axiosPrivate.post(CREATE_PROGRAM_URL, payload);

      alert("Programs created successfully!");
      setPrograms([]);
      setCurrentProgram({ name: "", level: "", isActive: true });
    } catch (error) {
      console.error("Failed to create program:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg relative">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Create Program
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Department Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search Department"
            value={query}
            onChange={handleDepartmentChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
            required
          />

          {suggestions.length > 0 && (
            <ul className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto z-20">
              {suggestions.map((name, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(name)}
                  className="p-3 hover:bg-yellow-100 cursor-pointer"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Program Inputs */}
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <input
            type="text"
            name="name"
            placeholder="Program Name"
            value={currentProgram.name}
            onChange={handleProgramChange}
            className="w-full border border-gray-300 p-3 rounded-lg"
          />

          <input
            type="text"
            name="level"
            placeholder="Level (e.g., UG, PG, PhD)"
            value={currentProgram.level}
            onChange={handleProgramChange}
            className="w-full border border-gray-300 p-3 rounded-lg"
          />

          <button
            type="button"
            onClick={handleAddProgram}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            ➕ Add Program
          </button>
        </div>

        {/* List of added programs */}
        {programs.length > 0 && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">
              Added Programs:
            </h3>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              {programs.map((prog, i) => (
                <li key={i}>
                  {prog.name} — <span className="italic">{prog.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          ✅ Save All Programs
        </button>
      </form>
    </div>
  );
};
