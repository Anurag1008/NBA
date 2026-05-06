// DepartmentCard.tsx
import { useState } from "react";
import type {Department} from "../types"
import { ProgramCard } from "./ProgramCard";

export const DepartmentCard = ({ dept }: { dept: Department }) => {
  const [showPrograms, setShowPrograms] = useState(false);

  return (
    <div className="p-3 border rounded bg-gray-50">
      <div
        className="cursor-pointer hover:bg-blue-100 p-2 rounded transition"
        onClick={() => setShowPrograms((prev) => !prev)}
      >
        <h4 className="text-lg font-semibold">{dept.name}</h4>
        <p className="text-gray-500">Code: {dept.code}</p>
      </div>

      {showPrograms && (
        <div className="ml-4 mt-2 space-y-1">
          {dept.programsList.length > 0 ? (
            dept.programsList.map((prog) => (
              <ProgramCard key={prog.id} prog={prog} />
            ))
          ) : (
            <p className="text-gray-400 text-sm">No programs</p>
          )}
        </div>
      )}
    </div>
  );
};
