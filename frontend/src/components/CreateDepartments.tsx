import { useState } from "react";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, IconButton } from "@mui/material";
import { MdAdd, MdDelete, MdCheckCircle } from "react-icons/md";

const CREATE_DEPARTMENT_URL = "/department/create-departments";

const CreateDepartments = () => {
  const navigate = useNavigate();
  const { instituteId } = useParams();
  const id = Number(instituteId);
  const axiosPrivate = useAxiosPrivate();

  const [departments, setDepartments] = useState([
    { code: "", name: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...departments];
    updated[index] = { ...updated[index], [field]: value };
    setDepartments(updated);
  };

  const addDepartment = () => {
    setDepartments([...departments, { code: "", name: "" }]);
  };

  const removeDepartment = (index: number) => {
    const updated = departments.filter((_, i) => i !== index);
    setDepartments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await axiosPrivate.post(CREATE_DEPARTMENT_URL, {
        instituteId: id,
        createDepartments: departments,
      });

      const canonicalNames: string[] = response.data.departmentName ?? [];
      const departmentsForNav = departments.map((d, i) => ({
        code: d.code,
        name: canonicalNames[i] ?? d.name,
      }));

      setSuccess(true);
      setTimeout(() => {
        navigate('/create-program', {
          state: {
            departments: departmentsForNav,
            instituteId: response.data.instituteId,
          }
        });
      }, 1500);

      setDepartments([{ code: "", name: "" }]);
    } catch (error: any) {
      console.error(error);
      setError(error.response?.data?.message || "Error creating departments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-slate-900 mb-2">
          Create Departments
        </Typography>
        <Typography variant="body1" color="text.secondary" className="text-slate-600">
          Add departments for your institute
        </Typography>
      </div>

      <Card className="rounded-xl shadow-lg border-0 bg-white">
        <CardContent className="p-8">
          {success && (
            <Alert severity="success" className="mb-6 flex items-center gap-2">
              <MdCheckCircle size={20} />
              Departments created successfully! Redirecting...
            </Alert>
          )}

          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Departments List */}
            <div className="space-y-4">
              {departments.map((dept, index) => (
                <div
                  key={index}
                  className="flex items-end gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-400 transition-all duration-200"
                >
                  <div className="flex-1">
                    <Typography variant="caption" className="text-slate-600 font-semibold">
                      Department Code
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., CS, EC, ME"
                      value={dept.code}
                      onChange={(e) => handleChange(index, "code", e.target.value)}
                      required
                      disabled={isLoading}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </div>

                  <div className="flex-1">
                    <Typography variant="caption" className="text-slate-600 font-semibold">
                      Department Name
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., Computer Science"
                      value={dept.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      required
                      disabled={isLoading}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </div>

                  <IconButton
                    onClick={() => removeDepartment(index)}
                    disabled={isLoading || departments.length === 1}
                    className="text-red-600 hover:bg-red-50"
                    size="small"
                  >
                    <MdDelete size={20} />
                  </IconButton>
                </div>
              ))}
            </div>

            {/* Add Department Button */}
            <Button
              type="button"
              onClick={addDepartment}
              disabled={isLoading}
              startIcon={<MdAdd size={20} />}
              className="w-full py-2 text-blue-600 border-2 border-blue-300 hover:bg-blue-50 rounded-lg font-semibold transition-all duration-200"
              variant="outlined"
            >
              Add Another Department
            </Button>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || departments.some(d => !d.code.trim() || !d.name.trim())}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200"
              variant="contained"
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: 'inherit', mr: 1 }} />
                  Saving...
                </>
              ) : (
                'Save Departments'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDepartments;
