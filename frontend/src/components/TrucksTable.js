import React from "react";

const TrucksTable = ({ trucks, loading }) => {
  return (
    <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-blue-100 text-gray-900">
          <tr>
            <th className="px-4 py-3 text-left">Vehicle ID</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Current Location</th>
            <th className="px-4 py-3 text-left">Capacity (Weight)</th>
            <th className="px-4 py-3 text-left">Capacity (Volume)</th>
            <th className="px-4 py-3 text-left">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center py-6 text-gray-500">
                Loading truck data...
              </td>
            </tr>
          ) : trucks.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-6 text-gray-500">
                No truck data available.
              </td>
            </tr>
          ) : (
            trucks.map((truck, index) => (
              <tr
                key={index}
                className={
                  index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-blue-50"
                }
              >
                <td className="px-4 py-3 font-mono">{truck.vehicle_id}</td>
                <td className="px-4 py-3">{truck.status}</td>
                <td className="px-4 py-3">{truck.current_location?.city || "N/A"}</td>
                <td className="px-4 py-3">{truck.capacity_weight || "N/A"} kg</td>
                <td className="px-4 py-3">{truck.capacity_volume || "N/A"} m³</td>
                <td className="px-4 py-3">
                  {new Date(truck.last_updated).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TrucksTable;
