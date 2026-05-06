import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularProgress, Typography } from "@mui/material";
import {
    MdArrowBack,
    MdDownload,
    MdLibraryBooks,
    MdPeople,
    MdDomain,
    MdEmail,
    MdBadge,
} from "react-icons/md";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import type { ProgramDetail as ProgramDetailType, ProgramUser } from "./types";

export const ProgramDetail = () => {
    const { programId } = useParams<{ programId: string }>();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();

    const [data, setData] = useState<ProgramDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!programId) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axiosPrivate.get<ProgramDetailType>(
                    `/program/${programId}/detail`
                );
                if (!cancelled) setData(res.data);
            } catch {
                if (!cancelled) setError("Failed to load program details.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [axiosPrivate, programId]);

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
                    {error ?? "Program not found."}
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

    const handleDownload = () => {
        if (!data.finalFileLink) return;
        window.open(data.finalFileLink, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="w-full">
            {/* Back link */}
            <button
                onClick={() =>
                    data.departmentId
                        ? navigate(`/department/${data.departmentId}`)
                        : navigate(-1)
                }
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-4 transition-colors"
            >
                <MdArrowBack size={18} />
                Back to {data.departmentName ?? "department"}
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                        <MdLibraryBooks size={28} className="text-violet-600" />
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
                        {data.level && (
                            <p className="text-violet-600 text-xs font-semibold uppercase tracking-wide mb-2">
                                {data.level}
                            </p>
                        )}
                        {data.departmentName && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <MdDomain size={16} className="text-slate-400" />
                                <span>
                                    {data.departmentName}
                                    {data.instituteName ? ` · ${data.instituteName}` : ""}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        disabled={!data.finalFileLink}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg shrink-0"
                        title={
                            data.finalFileLink
                                ? "Download the final NBA file for this program"
                                : "No final file available yet"
                        }
                    >
                        <MdDownload size={18} />
                        {data.finalFileLink ? "Download Final File" : "No Final File"}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <StatTile
                        label="Assigned Users"
                        value={data.userCount}
                        icon={<MdPeople className="text-emerald-600" size={20} />}
                        color="bg-emerald-50"
                    />
                    <StatTile
                        label="NBA Files"
                        value={data.files.length}
                        icon={<MdLibraryBooks className="text-blue-600" size={20} />}
                        color="bg-blue-50"
                    />
                </div>
            </div>

            {/* Users list */}
            <Typography variant="h6" className="font-bold text-slate-900 mb-4">
                Users in this Program
            </Typography>

            {data.users.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdPeople size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">
                        No users explicitly assigned to this program yet.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <div className="col-span-4">User</div>
                        <div className="col-span-5">Email</div>
                        <div className="col-span-3">Roles</div>
                    </div>
                    {data.users.map((u) => (
                        <UserRow key={u.id} user={u} />
                    ))}
                </div>
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

const UserRow = ({ user }: { user: ProgramUser }) => (
    <div className="grid grid-cols-12 px-6 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors text-sm">
        <div className="col-span-4 flex items-center gap-2 min-w-0">
            <MdBadge size={16} className="text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800 truncate">{user.username}</span>
        </div>
        <div className="col-span-5 flex items-center gap-2 min-w-0">
            <MdEmail size={16} className="text-slate-400 shrink-0" />
            <span className="text-slate-600 truncate">{user.email}</span>
        </div>
        <div className="col-span-3 flex flex-wrap gap-1">
            {user.roles.map((r) => (
                <span
                    key={r}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                >
                    {r.replace("ROLE_", "")}
                </span>
            ))}
        </div>
    </div>
);

export default ProgramDetail;
