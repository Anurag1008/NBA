import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { InstituteCard } from "./cards/InstituteCard";
const CREATE_INSTITUTE_URL = "/institute/show-institute";

type Institute = {
  id: number;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  createdAt: string;
  isActive: boolean;
  departmentList: any[];
  acadmicYearList: any[];
};

export const Dashboard = () => {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const axiosPrivate = useAxiosPrivate();
//   const navigate = useNavigate();

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const response = await axiosPrivate.get(CREATE_INSTITUTE_URL);

        // Ensure response.data is always an array
        const data = Array.isArray(response.data) ? response.data : [];
        setInstitutes(data);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch institutes");
        setLoading(false);
      }
    };

    fetchInstitutes();
  }, [axiosPrivate]);

  if (loading)
    return (
      <div className="w-4/5 h-4/5 bg-white flex items-center justify-center">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="w-4/5 h-4/5 bg-white flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="w-4/5 mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Institutes</h2>

      <div className="overflow-y-auto h-[800px] space-y-4">
        {institutes.map((inst) => (
          <InstituteCard key={inst.id} inst={inst} />
        ))}
      </div>
    </div>
  );
};
