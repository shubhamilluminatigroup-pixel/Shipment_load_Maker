import React from "react";

const ShipmentsTable = ({ shipments }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
      <table className="min-w-full text-sm text-gray-300">
        <thead className="bg-gray-700 text-cyan-400">
          <tr>
            <th className="px-4 py-3 text-left">Shipment ID</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Priority Score</th>
            <th className="px-4 py-3 text-left">Created At</th>
            <th className="px-4 py-3 text-left">Updated At</th>
            <th className="px-4 py-3 text-left">Shelf Life</th>
            <th className="px-4 py-3 text-left">Volume</th>
            <th className="px-4 py-3 text-left">Weight</th>
            <th className="px-4 py-3 text-left">Value</th>
            <th className="px-4 py-3 text-left">Origin Lat</th>
            <th className="px-4 py-3 text-left">Origin Lng</th>
            <th className="px-4 py-3 text-left">Destination Lat</th>
            <th className="px-4 py-3 text-left">Destination Lng</th>
            <th className="px-4 py-3 text-left">Delay Analysis</th>
            <th className="px-4 py-3 text-left">Origin</th>
            <th className="px-4 py-3 text-left">Destination</th>
            <th className="px-4 py-3 text-left">Vehicle ID</th>
          </tr>
        </thead>
        <tbody>
          {shipments.length === 0 ? (
            <tr>
              <td colSpan="17" className="text-center py-6 text-gray-500">
                No shipments available.
              </td>
            </tr>
          ) : (
            shipments.map((shipment, index) => (
              <tr
                key={index}
                className={
                  index % 2 === 0 ? "bg-gray-800" : "bg-gray-700 hover:bg-gray-600 transition duration-300"
                }
              >
                <td className="px-4 py-3 font-mono text-xs">{shipment.shipment_id}</td>
                <td className="px-4 py-3">{shipment.shipment_status}</td>
                <td className="px-4 py-3 font-bold text-cyan-300">
                  {shipment.priority_score != null
                    ? shipment.priority_score.toFixed(2)
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {new Date(shipment.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">
                  {new Date(shipment.updated_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{shipment.shelf_life_days} days</td>
                <td className="px-4 py-3">
                  {shipment.volume ? shipment.volume.toFixed(2) : "N/A"} m³
                </td>
                <td className="px-4 py-3">
                  {shipment.weight ? shipment.weight.toFixed(2) : "N/A"} kg
                </td>
                <td className="px-4 py-3">
                  {shipment.value ? shipment.value.toFixed(2) : "N/A"} $
                </td>
                <td className="px-4 py-3">
                  {shipment.origin_lat ? shipment.origin_lat.toFixed(4) : "N/A"}
                </td>
                <td className="px-4 py-3">
                  {shipment.origin_lng ? shipment.origin_lng.toFixed(4) : "N/A"}
                </td>
                <td className="px-4 py-3">
                  {shipment.destination_lat
                    ? shipment.destination_lat.toFixed(4)
                    : "N/A"}
                </td>
                <td className="px-4 py-3">
                  {shipment.destination_lng
                    ? shipment.destination_lng.toFixed(4)
                    : "N/A"}
                </td>
                <td className="px-4 py-3">
                    {Array.isArray(shipment.regulatory_flags)
                    ? shipment.regulatory_flags.join(", ")
                    : shipment.regulatory_flags || "N/A"}
                </td>
                <td className="px-4 py-3">
                  {shipment.origin_address?.city || "N/A"}
                </td>
                <td className="px-4 py-3">
                  {shipment.destination_address?.city || "N/A"}
                </td>
                <td className="px-4 py-3">
                  {shipment.vehicle_id || "N/A"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ShipmentsTable;
