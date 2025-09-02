import React, { useState } from "react";
import axios from "axios";
import ShipmentsTable from "./components/ShipmentsTable";
import TrucksTable from "./components/TrucksTable";
import DashboardButtons from "./components/DashboardButtons";
import WeightConfig from "./components/WeightConfig";
import DelayedShipments from "./components/DelayedShipments";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function App() {
  const [shipments, setShipments] = useState([]);
  const [trucks, setTrucks] = useState([]); // New state for truck data
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [weights, setWeights] = useState({
    value: 0,
    weight: 0,
    volume: 0.25,
    shelf_life_days: 0.5,
    days_to_delivery: 0.5,
  });
  const [routes, setRoutes] = useState(null);
  const [delays, setDelays] = useState(null);
  const [activeTab, setActiveTab] = useState("shipments"); // New state for active tab

  const fetchShipments = () => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/shipments/`)
      .then((response) => {
        setShipments(response.data);
      })
      .catch((error) => {
        console.error("Error fetching shipments:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchTrucks = () => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/trucks/`)
      .then((response) => {
        setTrucks(response.data);
      })
      .catch((error) => {
        console.error("Error fetching trucks:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const recalculateScores = () => {
    setRecalculating(true);
    axios
      .post(`${API_BASE_URL}/shipments/score/`)
      .then(() => fetchShipments())
      .catch((error) => {
        console.error("Error recalculating scores:", error);
      })
      .finally(() => {
        setRecalculating(false);
      });
  };

  const updateWeights = () => {
    axios
      .post(`${API_BASE_URL}/weights/fixed/`, weights)
      .then(() => alert("Weights updated successfully!"))
      .catch((error) => {
        console.error("Error updating weights:", error);
      });
  };

  const fetchCoordinates = () => {
    setLoading(true);
    axios
      .post(`${API_BASE_URL}/shipments/fill`)
      .then(() => fetchShipments())
      .catch((error) => {
        console.error("Error fetching coordinates:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOptimizeRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/optimize-routes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setRoutes(data.optimized_routes);
    } catch (error) {
      console.error("Error optimizing routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDelays = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/delay/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setDelays(data.shipment_delays);
      fetchShipments();
    } catch (error) {
      console.error("Error checking delays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWeights((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          📦 Logistics Dashboard
        </h1>

        <WeightConfig
          weights={weights}
          handleInputChange={handleInputChange}
          updateWeights={updateWeights}
        />

        <DashboardButtons
          loading={loading}
          recalculating={recalculating}
          fetchShipments={fetchShipments}
          recalculateScores={recalculateScores}
          fetchCoordinates={fetchCoordinates}
          handleOptimizeRoutes={handleOptimizeRoutes}
          handleCheckDelays={handleCheckDelays}
        />

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("shipments")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "shipments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Shipments
            </button>
            <button
              onClick={() => {
                setActiveTab("trucks");
                fetchTrucks(); // Fetch truck data when this tab is clicked
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trucks"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Trucks
            </button>
            <button
              onClick={() => setActiveTab("delays")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "delays"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Delayed Shipments
            </button>
          </nav>
        </div>

        {activeTab === "shipments" && <ShipmentsTable shipments={shipments} />}
        {activeTab === "trucks" && <TrucksTable trucks={trucks} loading={loading} />}
        {activeTab === "delays" && <DelayedShipments delays={delays} />}
      </div>
    </div>
  );
}

export default App;
