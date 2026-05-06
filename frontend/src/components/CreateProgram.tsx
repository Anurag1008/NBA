import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, Autocomplete } from "@mui/material";
import { MdAdd, MdDelete, MdCheckCircle } from "react-icons/md";

interface DepartmentOption {
  code: string;
  name: string;
}

interface CoreProgramOption {
  programName: string;
  programCode: string;
}

interface Program {
  name: string;
  code: string;
  level: string;
  isActive: boolean;
}

const CREATE_PROGRAM_URL = "/program/create-programs";

export const CreateProgram = () => {
  const location = useLocation();
  const state = location.state || {};
  const instituteId: number | undefined = state.instituteId;
  const departments: DepartmentOption[] = state.departments
    ?? (state.departmentNames ?? []).map((n: string) => ({ code: "", name: n }));
  const axiosPrivate = useAxiosPrivate();

  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentOption | null>(null);
  const [coreProgramOptions, setCoreProgramOptions] = useState<CoreProgramOption[]>([]);
  const [loadingCorePrograms, setLoadingCorePrograms] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program>({
    name: "",
    code: "",
    level: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!selectedDepartment?.code) {
      setCoreProgramOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingCorePrograms(true);
    axiosPrivate
      .get<CoreProgramOption[]>(`/core/departments/${encodeURIComponent(selectedDepartment.code)}/programs`)
      .then((res) => {
        if (!cancelled) setCoreProgramOptions(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load core programs:", err);
          setCoreProgramOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCorePrograms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDepartment, axiosPrivate]);

  const handleAddProgram = () => {
    if (!currentProgram.name.trim() || !currentProgram.code.trim() || !currentProgram.level.trim()) return;
    setPrograms([...programs, currentProgram]);
    setCurrentProgram({ name: "", code: "", level: "", isActive: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedDepartment) {
      setError("Please select a department first!");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        instituteId,
        departmentName: selectedDepartment.name,
        programs,
      };

      await axiosPrivate.post(CREATE_PROGRAM_URL, payload);
      setSuccess(true);
      setPrograms([]);
      setCurrentProgram({ name: "", code: "", level: "", isActive: true });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error: any) {
      console.error("Failed to create program:", error);
      setError(error.response?.data?.message || "Failed to create programs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const levelOptions = ["UG", "PG", "PhD", "Diploma", "Certificate"];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-slate-900 mb-2">
          Create Programs
        </Typography>
        <Typography variant="body1" color="text.secondary" className="text-slate-600">
          Add academic programs for your department
        </Typography>
      </div>

      <Card className="rounded-xl shadow-lg border-0 bg-white">
        <CardContent className="p-8">
          {success && (
            <Alert severity="success" className="mb-6 flex items-center gap-2">
              <MdCheckCircle size={20} />
              Programs created successfully! Redirecting to dashboard...
            </Alert>
          )}

          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Selection */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Typography variant="subtitle2" className="font-semibold text-slate-700">
                Select Department *
              </Typography>
              <Autocomplete
                options={departments}
                getOptionLabel={(opt) => (opt.code ? `${opt.name} (${opt.code})` : opt.name)}
                isOptionEqualToValue={(a, b) => a.code === b.code && a.name === b.name}
                value={selectedDepartment}
                onChange={(_, value) => {
                  setSelectedDepartment(value);
                  setCurrentProgram({ name: "", code: "", level: "", isActive: true });
                }}
                disabled={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search and select department"
                    size="small"
                  />
                )}
              />
            </div>

            {/* Add Program Section */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <Typography variant="subtitle2" className="font-semibold text-slate-700">
                Add Program
              </Typography>

              <Autocomplete
                options={coreProgramOptions}
                getOptionLabel={(opt) => `${opt.programName} (${opt.programCode})`}
                isOptionEqualToValue={(a, b) => a.programCode === b.programCode}
                value={
                  currentProgram.code
                    ? coreProgramOptions.find((o) => o.programCode === currentProgram.code) ?? null
                    : null
                }
                onChange={(_, value) =>
                  setCurrentProgram({
                    ...currentProgram,
                    name: value?.programName ?? "",
                    code: value?.programCode ?? "",
                  })
                }
                disabled={isLoading || !selectedDepartment || loadingCorePrograms}
                loading={loadingCorePrograms}
                noOptionsText={
                  !selectedDepartment
                    ? "Select a department first"
                    : loadingCorePrograms
                    ? "Loading…"
                    : "No programs available for this department"
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Program *"
                    placeholder="Select a program"
                    size="small"
                  />
                )}
              />

              <Autocomplete
                options={levelOptions}
                value={currentProgram.level}
                onChange={(_, value) => setCurrentProgram({ ...currentProgram, level: value || "" })}
                disabled={isLoading}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level (UG/PG/PhD) *"
                    placeholder="Select or type level"
                    size="small"
                  />
                )}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleAddProgram}
                disabled={
                  isLoading ||
                  !currentProgram.name.trim() ||
                  !currentProgram.code.trim() ||
                  !currentProgram.level.trim()
                }
                startIcon={<MdAdd size={20} />}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                Add Program
              </Button>
            </div>

            {/* Programs List */}
            {programs.length > 0 && (
              <Card className="rounded-lg border-0 bg-slate-50">
                <CardContent className="p-4">
                  <Typography variant="subtitle2" className="font-semibold mb-4 text-slate-700">
                    Added Programs ({programs.length})
                  </Typography>
                  <div className="space-y-2">
                    {programs.map((program, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all duration-200"
                      >
                        <div className="flex-1">
                          <Typography variant="body2" className="font-semibold text-slate-800">
                            {program.name} ({program.code})
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="text-slate-500">
                            Level: {program.level}
                          </Typography>
                        </div>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setPrograms(programs.filter((_, i) => i !== idx))}
                          disabled={isLoading}
                          startIcon={<MdDelete size={16} />}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !selectedDepartment || programs.length === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-3 font-semibold rounded-lg"
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: 'inherit', mr: 1 }} />
                  Creating Programs...
                </>
              ) : (
                'Create Programs'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
