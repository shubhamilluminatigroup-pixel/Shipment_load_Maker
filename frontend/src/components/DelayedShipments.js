import React from "react";

const DelayedShipments = ({ delays }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
      <h2 className="text-xl font-bold p-4 text-gray-200">Shipment Delays</h2>
      <table className="min-w-full text-sm text-gray-300">
        <thead className="bg-red-900 text-white">
          <tr>
            <th className="px-4 py-3 text-left">Shipment ID</th>
            <th className="px-4 py-3 text-left">Delay Reason</th>
          </tr>
        </thead>
        <tbody>
          {!delays || delays.length === 0 ? (
            <tr>
              <td colSpan="2" className="text-center py-6 text-gray-500">
                No delays reported or data not yet checked.
              </td>
            </tr>
          ) : (
            delays.map((delay, index) => (
              <tr
                key={index}
                className={
                  index % 2 === 0 ? "bg-gray-800" : "bg-gray-700 hover:bg-red-800 transition duration-300"
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-red-300">{delay.shipment_id}</td>
                <td className="px-4 py-3">{delay.reason}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DelayedShipments;
