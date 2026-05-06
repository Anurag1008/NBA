import { useState } from "react";


import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const CREATE_INSTITUTE_URL = "/institute/create-institute"; // http://localhost:8085/api/v1/institute/create-institute
const CreateInstitute = () => {

  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axiosPrivate.post(CREATE_INSTITUTE_URL, formData);
      const instituteId = response.data.instituteId;
      alert("Institute created successfully!");
      setFormData({
        name: "",
        code: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      });

      navigate(`/create-departments/${instituteId}`);
    } catch (error) {
      console.error(error);
      alert("Error creating institute");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4"
    >
      <h2 className="text-xl font-bold mb-4">Create Institute</h2>

      <input
        type="text"
        name="name"
        placeholder="Name *"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="code"
        placeholder="Code"
        value={formData.code}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="addressLine1"
        placeholder="Address Line 1"
        value={formData.addressLine1}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="addressLine2"
        placeholder="Address Line 2"
        value={formData.addressLine2}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={formData.pincode}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Create
      </button>
    </form>
  );
};

export default CreateInstitute;
