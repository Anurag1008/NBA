
import { FaDownload } from "react-icons/fa";

type TaskProps = {
    fileName: string;
    assignedTo: string;
    assignedBy: string;
    createdAt: string;
    submissionDate: string;
    onOpen: () => void;
};

export const Task: React.FC<TaskProps> = ({
    fileName,
    assignedTo,
    assignedBy,
    createdAt,
    submissionDate,
    onOpen,
}) => {
    return (
        <div className="flex flex-row bg-white rounded-2xl shadow-md p-4 border border-gray-200 w-full space-y-2 justify-between">
            {/* File name */}
            <div className="text-lg font-semibold text-gray-800 item-center">{fileName}</div>

            {/* Details in column */}
            <div className="text-sm text-gray-600">
                <span className="font-medium">Assigned To:</span> {assignedTo}
            </div>
            <div className="text-sm text-gray-600">
                <span className="font-medium">Assigned By:</span> {assignedBy}
            </div>
            <div className="text-sm text-gray-600">
                <span className="font-medium">Created At:</span> {createdAt}
            </div>
            <div className="text-sm text-gray-600">
                <span className="font-medium">Submission Date:</span> {submissionDate}
            </div>

           

            <div className="text-sm text-gray-600">
                <span className="font-medium">Status</span> 
            </div>

             {/* Open File Button */}
            <div className="flex items-center justify-center h-full">
                <button
                    onClick={onOpen}
                    className="flex p-2 bg-blue-600 items-center justify-center text-white rounded-xl hover:bg-blue-700 transition"
                >
                    Open
                </button>
            </div> 

            {/* download file  */}
            <div className="flex items-center">
                <FaDownload />
            </div> 


        </div>
    );
};
