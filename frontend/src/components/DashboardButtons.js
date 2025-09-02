import React from "react";

const DashboardButtons = ({
  loading,
  recalculating,
  fetchShipments,
  recalculateScores,
  fetchCoordinates,
  handleOptimizeRoutes,
  handleCheckDelays,
}) => {
  return (
    <div className="flex justify-center space-x-4 mb-6">
      <button
        onClick={fetchShipments}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
      >
        {loading ? "Loading..." : "Fetch Shipments"}
      </button>
      <button
        onClick={recalculateScores}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
      >
        {recalculating ? "Recalculating..." : "Recalculate Scores"}
      </button>
      <button
        onClick={fetchCoordinates}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded shadow"
      >
        {loading ? "Loading..." : "Fetch Coordinates"}
      </button>
      <button
        onClick={handleOptimizeRoutes}
        className="bg-teal-600 hover:bg-teal-700 text-black font-semibold px-6 py-2 rounded shadow"
      >
        {loading ? "Optimizing..." : "Optimize Routes"}
      </button>
      <button
        onClick={handleCheckDelays}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded shadow"
      >
        {loading ? "Checking..." : "Check Delays"}
      </button>
    </div>
  );
};

export default DashboardButtons;
