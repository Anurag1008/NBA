
// InstituteCard.tsx
import { useState } from "react";
import type { Institute } from "../types";
import { DepartmentCard } from "./DepartmentCard";

export const InstituteCard = ({ inst }: { inst: Institute }) => {
  const [showDepts, setShowDepts] = useState(false);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md">
      <div
        className="cursor-pointer hover:bg-yellow-100 p-2 rounded transition"
        onClick={() => setShowDepts((prev) => !prev)}
      >
        <h3 className="text-xl font-semibold">{inst.name}</h3>
        <p className="text-gray-500 mb-1">Code: {inst.code}</p>
        <p className="text-gray-600 text-sm">
          {inst.city}, {inst.state}, {inst.country}
        </p>
      </div>

      {showDepts && (
        <div className="ml-4 mt-3 space-y-2">
          {inst.departmentList.length > 0 ? (
            inst.departmentList.map((dept) => (
              <DepartmentCard key={dept.id} dept={dept} />
            ))
          ) : (
            <p className="text-gray-400 text-sm">No departments</p>
          )}
        </div>
      )}
    </div>
  );
};
