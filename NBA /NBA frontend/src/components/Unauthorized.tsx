// src/components/Unauthorized.tsx
const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-red-600">
        403 - You are not authorized to view this page
      </h1>
    </div>
  );
};

export default Unauthorized;