import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import { Typography } from "@mui/material";
import { MdAssignment, MdCheckCircle, MdPending, MdHourglassEmpty, MdFilterList } from "react-icons/md";
import { FaDownload } from "react-icons/fa";

type TaskItem = {
    id: number;
    fileName: string;
    assignedTo: string;
    assignedBy: string;
    createdAt: string;
    submissionDate: string;
    status: "PENDING" | "COMPLETED" | "OVERDUE";
};

const statusConfig = {
    PENDING: {
        label: "Pending",
        icon: <MdPending size={14} />,
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    COMPLETED: {
        label: "Completed",
        icon: <MdCheckCircle size={14} />,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    OVERDUE: {
        label: "Overdue",
        icon: <MdHourglassEmpty size={14} />,
        className: "bg-red-50 text-red-600 border-red-200",
    },
};

export const Tasks = () => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "OVERDUE">("ALL");

    // Backend task endpoints are not yet implemented — placeholder effect
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        // When the API is ready, replace this with: axiosPrivate.get("/tasks/my-tasks")
        setTimeout(() => {
            if (!cancelled) {
                setTasks([]);
                setLoading(false);
            }
        }, 600);
        return () => { cancelled = true; };
    }, [axiosPrivate]);

    const counts = {
        ALL: tasks.length,
        PENDING: tasks.filter((t) => t.status === "PENDING").length,
        COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
        OVERDUE: tasks.filter((t) => t.status === "OVERDUE").length,
    };

    const displayed = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <Typography variant="h4" className="font-bold text-slate-900 mb-1">
                    Tasks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    NBA file assignments and accreditation documentation
                </Typography>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatsChip
                    label="Total"
                    count={counts.ALL}
                    icon={<MdAssignment size={20} className="text-blue-600" />}
                    bg="bg-blue-50"
                    active={filter === "ALL"}
                    onClick={() => setFilter("ALL")}
                />
                <StatsChip
                    label="Pending"
                    count={counts.PENDING}
                    icon={<MdPending size={20} className="text-amber-600" />}
                    bg="bg-amber-50"
                    active={filter === "PENDING"}
                    onClick={() => setFilter("PENDING")}
                />
                <StatsChip
                    label="Completed"
                    count={counts.COMPLETED}
                    icon={<MdCheckCircle size={20} className="text-emerald-600" />}
                    bg="bg-emerald-50"
                    active={filter === "COMPLETED"}
                    onClick={() => setFilter("COMPLETED")}
                />
                <StatsChip
                    label="Overdue"
                    count={counts.OVERDUE}
                    icon={<MdHourglassEmpty size={20} className="text-red-500" />}
                    bg="bg-red-50"
                    active={filter === "OVERDUE"}
                    onClick={() => setFilter("OVERDUE")}
                />
            </div>

            {/* Filter label */}
            {filter !== "ALL" && (
                <div className="flex items-center gap-2 mb-4">
                    <MdFilterList size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filter.toLowerCase()}</span> tasks
                    </span>
                    <button
                        onClick={() => setFilter("ALL")}
                        className="text-xs text-blue-600 hover:underline ml-1"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-2/5 mb-3" />
                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <EmptyTasksState userEmail={auth?.email} />
            ) : (
                <div className="space-y-3">
                    {displayed.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );
};

const StatsChip = ({
    label,
    count,
    icon,
    bg,
    active,
    onClick,
}: {
    label: string;
    count: number;
    icon: React.ReactNode;
    bg: string;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left shadow-sm ${
            active
                ? "border-blue-300 bg-blue-50 shadow-md ring-1 ring-blue-200"
                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow"
        }`}
    >
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-xl font-bold text-slate-900">{count}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    </button>
);

const TaskCard = ({ task }: { task: TaskItem }) => {
    const cfg = statusConfig[task.status];
    return (
        <div className="bg-white border border-slate-100 hover:border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <MdAssignment size={18} className="text-blue-500 shrink-0" />
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{task.fileName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span><span className="font-medium text-slate-600">Assigned to:</span> {task.assignedTo}</span>
                        <span><span className="font-medium text-slate-600">Assigned by:</span> {task.assignedBy}</span>
                        <span><span className="font-medium text-slate-600">Created:</span> {task.createdAt}</span>
                        <span><span className="font-medium text-slate-600">Due:</span> {task.submissionDate}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="text-xs text-blue-600 hover:underline font-medium">Open</button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                            <FaDownload size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmptyTasksState = ({ userEmail }: { userEmail?: string }) => (
    <div className="text-center py-28 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <MdAssignment size={32} className="text-slate-400" />
        </div>
        <h3 className="text-slate-700 font-bold text-lg mb-2">No tasks assigned</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
            NBA file assignments will appear here once they are created and assigned
            {userEmail ? ` to ${userEmail}` : " to you"}.
        </p>
    </div>
);

export default Tasks;
