import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, CircularProgress, Typography } from "@mui/material";
import {
    MdAdd,
    MdArrowBack,
    MdDomain,
    MdLibraryBooks,
    MdPeople,
    MdSchool,
} from "react-icons/md";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import { AddProgramDialog } from "./AddProgramDialog";
import type { DepartmentDetail as DepartmentDetailType, ProgramSummary } from "./types";

export const DepartmentDetail = () => {
    const { departmentId } = useParams<{ departmentId: string }>();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const isAdmin = auth?.roles?.includes("ROLE_ADMIN") ?? false;

    const [data, setData] = useState<DepartmentDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addProgramOpen, setAddProgramOpen] = useState(false);

    const load = useCallback(async () => {
        if (!departmentId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axiosPrivate.get<DepartmentDetailType>(
                `/department/${departmentId}/detail`
            );
            setData(res.data);
        } catch {
            setError("Failed to load department details.");
        } finally {
            setLoading(false);
        }
    }, [axiosPrivate, departmentId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <CircularProgress />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-16 bg-white rounded-xl border border-red-100 shadow-sm">
                <p className="text-red-600 font-medium mb-3">
                    {error ?? "Department not found."}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Go back
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Back link */}
            <button
                onClick={() =>
                    data.instituteId
                        ? navigate(`/institute/${data.instituteId}`)
                        : navigate(-1)
                }
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
            >
                <MdArrowBack size={18} />
                Back to {data.instituteName ?? "institute"}
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                        <MdDomain size={28} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <Typography variant="h5" className="font-bold text-slate-900">
                                {data.name}
                            </Typography>
                            <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                    data.isActive
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-600 border-red-200"
                                }`}
                            >
                                {data.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {data.code && (
                            <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wide mb-2">
                                {data.code}
                            </p>
                        )}
                        {data.instituteName && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <MdSchool size={16} className="text-slate-400" />
                                <span>{data.instituteName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <StatTile
                        label="Programs"
                        value={data.programCount}
                        icon={<MdLibraryBooks className="text-violet-600" size={20} />}
                        color="bg-violet-50"
                    />
                    <StatTile
                        label="Users"
                        value={data.userCount}
                        icon={<MdPeople className="text-emerald-600" size={20} />}
                        color="bg-emerald-50"
                    />
                </div>
            </div>

            {/* Programs grid */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <Typography variant="h6" className="font-bold text-slate-900">
                    Programs
                </Typography>
                {isAdmin && data.instituteId && (
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<MdAdd size={18} />}
                        onClick={() => setAddProgramOpen(true)}
                        sx={{ textTransform: "none", borderRadius: "0.5rem", boxShadow: "none" }}
                    >
                        Add Program
                    </Button>
                )}
            </div>

            {data.programs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdLibraryBooks size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No programs yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {data.programs.map((p) => (
                        <ProgramCard
                            key={p.id}
                            program={p}
                            onClick={() => navigate(`/program/${p.id}`)}
                        />
                    ))}
                </div>
            )}

            {data.instituteId && (
                <AddProgramDialog
                    open={addProgramOpen}
                    onClose={() => setAddProgramOpen(false)}
                    instituteId={data.instituteId}
                    department={{ name: data.name, code: data.code }}
                    onSuccess={load}
                />
            )}
        </div>
    );
};

const StatTile = ({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}) => (
    <div className="border border-slate-100 rounded-lg p-3 flex items-center gap-3">
        <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
        >
            {icon}
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
                {value.toLocaleString()}
            </p>
        </div>
    </div>
);

const ProgramCard = ({
    program,
    onClick,
}: {
    program: ProgramSummary;
    onClick: () => void;
}) => (
    <div
        onClick={onClick}
        className="group bg-white border border-slate-100 hover:border-violet-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
    >
        <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-600" />
        <div className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-violet-50 group-hover:bg-violet-600 rounded-xl flex items-center justify-center transition-colors duration-300">
                    <MdLibraryBooks
                        size={22}
                        className="text-violet-600 group-hover:text-white transition-colors duration-300"
                    />
                </div>
                <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        program.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                    }`}
                >
                    {program.isActive ? "Active" : "Inactive"}
                </span>
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-0.5 leading-snug">
                {program.name}
            </h3>
            {program.level && (
                <p className="text-violet-600 text-xs font-semibold uppercase tracking-wide mb-4">
                    {program.level}
                </p>
            )}

            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-3">
                <MdPeople size={15} className="text-slate-400" />
                <span>
                    {program.userCount} user{program.userCount !== 1 ? "s" : ""}
                </span>
            </div>
        </div>
    </div>
);

export default DepartmentDetail;
