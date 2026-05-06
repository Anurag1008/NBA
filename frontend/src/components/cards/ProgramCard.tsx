// ProgramCard.tsx
import type { Program } from "../types";

export const ProgramCard = ({ prog }: { prog: Program }) => {
  return (
    <div className="p-2 border rounded bg-white shadow-sm">
      <h5 className="font-medium">{prog.name}</h5>
      <p className="text-gray-500 text-sm">Code: {prog.code}</p>
      <p
        className={`text-xs font-semibold ${
          prog.isActive ? "text-green-600" : "text-red-600"
        }`}
      >
        {prog.isActive ? "Active" : "Inactive"}
      </p>
    </div>
  );
};
