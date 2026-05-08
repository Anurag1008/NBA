import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    CardContent,
    MenuItem,
    Skeleton,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
    MdAssignmentInd,
    MdDownload,
    MdEdit,
    MdPeople,
    MdSchool,
} from "react-icons/md";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import {
    EditUserRolesDialog,
    type PrincipalEditableUser,
} from "./EditUserRolesDialog";
import { AssignUserDialog, type AssignableUser } from "./AssignUserDialog";

type DepartmentRow = {
    id: number;
    name: string;
    code?: string;
    isActive?: boolean;
    userCount?: number;
    programCount?: number;
};

type ProgramRow = {
    id: number;
    name: string;
    code?: string;
    level?: string;
    isActive?: boolean;
    userCount?: number;
};

type UserRow = {
    id: number;
    username: string;
    email: string;
    roles: string[];
    departmentId: number | null;
    departmentName: string | null;
    programId: number | null;
    programName: string | null;
    editable: boolean;
    assignable: boolean;
};

type Context = {
    instituteId: number;
    instituteName: string;
    instituteCode?: string;
};

export const PrincipalUsers = () => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const currentEmail = auth?.email?.toLowerCase() ?? "";

    const [ctx, setCtx] = useState<Context | null>(null);
    const [departments, setDepartments] = useState<DepartmentRow[]>([]);
    const [programs, setPrograms] = useState<ProgramRow[]>([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [departmentId, setDepartmentId] = useState<string>("");
    const [programId, setProgramId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<PrincipalEditableUser | null>(null);
    const [assigningUser, setAssigningUser] = useState<AssignableUser | null>(null);
    const [downloading, setDownloading] = useState(false);

    /* Initial load: context + departments */
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([
            axiosPrivate.get<Context>("/principal/me/context"),
            axiosPrivate.get<DepartmentRow[]>("/principal/departments"),
        ])
            .then(([ctxRes, deptRes]) => {
                if (cancelled) return;
                setCtx(ctxRes.data);
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
            })
            .catch((err) => {
                if (cancelled) return;
                const msg =
                    err?.response?.data?.message ?? "Failed to load institute information.";
                setError(msg);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [axiosPrivate]);

    /* Load programs when department changes */
    useEffect(() => {
        if (!departmentId) {
            setPrograms([]);
            setProgramId("");
            return;
        }
        let cancelled = false;
        axiosPrivate
            .get<ProgramRow[]>(`/principal/departments/${departmentId}/programs`)
            .then((res) => {
                if (!cancelled) setPrograms(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => {
                if (!cancelled) setPrograms([]);
            });
        setProgramId("");
        return () => {
            cancelled = true;
        };
    }, [axiosPrivate, departmentId]);

    /* Load users (filtered) */
    const fetchUsers = () => {
        setUsersLoading(true);
        const params: Record<string, string> = {};
        if (programId) params.programId = programId;
        else if (departmentId) params.departmentId = departmentId;

        axiosPrivate
            .get<UserRow[]>("/principal/users", { params })
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => setUsers([]))
            .finally(() => setUsersLoading(false));
    };

    useEffect(() => {
        if (!ctx) return;
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx, departmentId, programId]);

    /* Download programs file for the selected department */
    const downloadProgramsFile = async () => {
        if (!departmentId) return;
        setDownloading(true);
        try {
            const res = await axiosPrivate.get(
                `/principal/departments/${departmentId}/programs-file`,
                { responseType: "blob" }
            );
            const dept = departments.find((d) => String(d.id) === departmentId);
            const fallback = `programs_dept_${departmentId}.csv`;
            const safeCode =
                dept?.code && dept.code.trim() !== ""
                    ? dept.code.replace(/[^A-Za-z0-9_-]/g, "_")
                    : null;
            const filename = safeCode ? `programs_${safeCode}.csv` : fallback;

            const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setError("Failed to download programs file.");
        } finally {
            setDownloading(false);
        }
    };

    /* Filtered/derived rows */
    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered =
            q.length === 0
                ? users
                : users.filter(
                      (u) =>
                          u.username?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.roles?.some((r) => r.toLowerCase().includes(q)) ||
                          u.departmentName?.toLowerCase().includes(q) ||
                          u.programName?.toLowerCase().includes(q)
                  );
        return filtered.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            department: u.departmentName ?? "—",
            program: u.programName ?? "—",
            roles: u.roles.map((r) => r.replace("ROLE_", "")).join(", "),
            _raw: u,
        }));
    }, [users, search]);

    const columns = useMemo<GridColDef[]>(
        () => [
            { field: "username", headerName: "Username", flex: 1, minWidth: 140 },
            { field: "email", headerName: "Email", flex: 1.5, minWidth: 200 },
            { field: "department", headerName: "Department", flex: 1, minWidth: 140 },
            { field: "program", headerName: "Program", flex: 1, minWidth: 140 },
            {
                field: "roles",
                headerName: "Role(s)",
                flex: 1,
                minWidth: 160,
                renderCell: (params) => (
                    <div className="flex gap-1 flex-wrap items-center h-full">
                        {String(params.value || "")
                            .split(", ")
                            .filter(Boolean)
                            .map((role: string, i: number) => (
                                <span
                                    key={i}
                                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                                >
                                    {role}
                                </span>
                            ))}
                    </div>
                ),
            },
            {
                field: "actions",
                headerName: "Actions",
                width: 220,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: (params) => {
                    const raw = (params.row as { _raw: UserRow })._raw;
                    const isSelf =
                        !!currentEmail && raw.email?.toLowerCase() === currentEmail;
                    const blocked = !raw.editable || isSelf;
                    const tip = isSelf
                        ? "You cannot edit your own account"
                        : !raw.editable
                        ? "Admin / Principal users can't be edited here"
                        : null;
                    return (
                        <div className="flex items-center gap-1.5 h-full">
                            <Tooltip title={tip ?? "Change roles"}>
                                <span>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<MdEdit size={16} />}
                                        disabled={blocked}
                                        onClick={() =>
                                            setEditingUser({
                                                id: raw.id,
                                                username: raw.username,
                                                email: raw.email,
                                                roles: raw.roles,
                                            })
                                        }
                                        sx={{
                                            borderRadius: "0.5rem",
                                            textTransform: "none",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Roles
                                    </Button>
                                </span>
                            </Tooltip>
                            {raw.assignable && (
                                <Tooltip title={tip ?? "Assign department / program"}>
                                    <span>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={<MdAssignmentInd size={16} />}
                                            disabled={blocked}
                                            onClick={() =>
                                                setAssigningUser({
                                                    id: raw.id,
                                                    username: raw.username,
                                                    email: raw.email,
                                                    departmentId: raw.departmentId,
                                                    departmentName: raw.departmentName,
                                                    programId: raw.programId,
                                                    programName: raw.programName,
                                                })
                                            }
                                            sx={{
                                                borderRadius: "0.5rem",
                                                textTransform: "none",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Assign
                                        </Button>
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                    );
                },
            },
        ],
        [currentEmail]
    );

    const selectedDept = departments.find((d) => String(d.id) === departmentId);
    const selectedProgram = programs.find((p) => String(p.id) === programId);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                        <MdPeople size={22} className="text-violet-600" />
                    </div>
                    <div>
                        <Typography variant="h5" className="font-bold text-slate-900">
                            Institute Users
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {loading ? (
                                <Skeleton width={180} />
                            ) : ctx ? (
                                <>
                                    {ctx.instituteName}
                                    {ctx.instituteCode ? ` (${ctx.instituteCode})` : ""}
                                </>
                            ) : (
                                "—"
                            )}
                        </Typography>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Departments overview */}
            <Card className="rounded-xl shadow-sm border border-slate-100 bg-white">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <MdSchool size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <Typography variant="h6" className="font-bold text-slate-900">
                                Departments
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Click a department to view its users; download its programs file
                                anytime.
                            </Typography>
                        </div>
                    </div>

                    {loading ? (
                        <Skeleton variant="rectangular" height={120} />
                    ) : departments.length === 0 ? (
                        <div className="text-sm text-slate-500 italic">
                            No departments are added to your institute yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {departments.map((d) => {
                                const active = String(d.id) === departmentId;
                                return (
                                    <div
                                        key={d.id}
                                        className={`rounded-lg border p-4 transition-all ${
                                            active
                                                ? "border-blue-400 bg-blue-50/40 shadow-sm"
                                                : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <button
                                                onClick={() => {
                                                    setDepartmentId(
                                                        active ? "" : String(d.id)
                                                    );
                                                }}
                                                className="flex-1 text-left"
                                            >
                                                <p className="font-semibold text-slate-900 text-sm leading-tight">
                                                    {d.name}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {d.code ?? "—"}
                                                    {" · "}
                                                    {d.userCount ?? 0} users
                                                    {" · "}
                                                    {d.programCount ?? 0} programs
                                                </p>
                                            </button>
                                            <Tooltip title="Download programs file">
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<MdDownload size={14} />}
                                                        disabled={downloading && active}
                                                        onClick={async () => {
                                                            setDepartmentId(String(d.id));
                                                            setProgramId("");
                                                            await new Promise((r) =>
                                                                setTimeout(r, 0)
                                                            );
                                                            // call download with the just-set id
                                                            const blobRes = await axiosPrivate
                                                                .get(
                                                                    `/principal/departments/${d.id}/programs-file`,
                                                                    { responseType: "blob" }
                                                                )
                                                                .catch(() => null);
                                                            if (!blobRes) {
                                                                setError(
                                                                    "Failed to download programs file."
                                                                );
                                                                return;
                                                            }
                                                            const safeCode =
                                                                d.code && d.code.trim() !== ""
                                                                    ? d.code.replace(
                                                                          /[^A-Za-z0-9_-]/g,
                                                                          "_"
                                                                      )
                                                                    : null;
                                                            const filename = safeCode
                                                                ? `programs_${safeCode}.csv`
                                                                : `programs_dept_${d.id}.csv`;
                                                            const blob = new Blob(
                                                                [blobRes.data],
                                                                {
                                                                    type:
                                                                        "text/csv;charset=utf-8",
                                                                }
                                                            );
                                                            const url = window.URL.createObjectURL(
                                                                blob
                                                            );
                                                            const a = document.createElement(
                                                                "a"
                                                            );
                                                            a.href = url;
                                                            a.download = filename;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            a.remove();
                                                            window.URL.revokeObjectURL(url);
                                                        }}
                                                        sx={{
                                                            borderRadius: "0.5rem",
                                                            textTransform: "none",
                                                            fontWeight: 600,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        File
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Users table */}
            <Card className="rounded-xl shadow-sm border border-slate-100 bg-white">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-5">
                        <div className="flex-1">
                            <Typography variant="h6" className="font-bold text-slate-900">
                                Users
                                {selectedDept ? ` · ${selectedDept.name}` : ""}
                                {selectedProgram ? ` › ${selectedProgram.name}` : ""}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {usersLoading ? (
                                    <Skeleton width={120} />
                                ) : (
                                    `${users.length} user${users.length !== 1 ? "s" : ""}`
                                )}
                            </Typography>
                        </div>

                        <TextField
                            select
                            size="small"
                            label="Department"
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            sx={{
                                minWidth: 200,
                                "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" },
                            }}
                        >
                            <MenuItem value="">
                                <em className="text-slate-400">All departments</em>
                            </MenuItem>
                            {departments.map((d) => (
                                <MenuItem key={d.id} value={String(d.id)}>
                                    {d.name}
                                    {d.code ? ` (${d.code})` : ""}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            size="small"
                            label="Program"
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            disabled={!departmentId}
                            helperText={
                                !departmentId
                                    ? "Select a department first"
                                    : programs.length === 0
                                    ? "No programs in this department"
                                    : undefined
                            }
                            sx={{
                                minWidth: 200,
                                "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" },
                            }}
                        >
                            <MenuItem value="">
                                <em className="text-slate-400">All programs</em>
                            </MenuItem>
                            {programs.map((p) => (
                                <MenuItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                    {p.code ? ` (${p.code})` : ""}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            size="small"
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{
                                minWidth: 200,
                                "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" },
                            }}
                        />

                        {departmentId && (
                            <Button
                                variant="outlined"
                                startIcon={<MdDownload size={16} />}
                                onClick={downloadProgramsFile}
                                disabled={downloading}
                                sx={{
                                    borderRadius: "0.5rem",
                                    textTransform: "none",
                                    fontWeight: 600,
                                }}
                            >
                                {downloading ? "Downloading…" : "Programs file"}
                            </Button>
                        )}
                    </div>

                    <div style={{ height: 520 }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            loading={usersLoading}
                            disableRowSelectionOnClick
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                            }}
                            sx={{
                                border: 0,
                                "& .MuiDataGrid-columnHeaders": {
                                    backgroundColor: "rgba(15,23,42,0.04)",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                },
                                "& .MuiDataGrid-row:hover": {
                                    backgroundColor: "rgba(59,130,246,0.04)",
                                },
                                "& .MuiDataGrid-cell": {
                                    borderColor: "rgba(15,23,42,0.05)",
                                },
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <EditUserRolesDialog
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSuccess={() => {
                    setEditingUser(null);
                    fetchUsers();
                }}
            />

            <AssignUserDialog
                user={assigningUser}
                departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
                onClose={() => setAssigningUser(null)}
                onSuccess={() => {
                    setAssigningUser(null);
                    fetchUsers();
                }}
            />
        </div>
    );
};

export default PrincipalUsers;
