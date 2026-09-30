import { useEffect, useState } from "react";
import "./Tables.css";

function Tables({ user, onBack }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/tables"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load tables."
        );
      }

      setTables(data.tables);
    } catch (error) {
      console.error("Tables error:", error);

      setError(
        "Unable to load tables. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "table-available";

      case "OCCUPIED":
        return "table-occupied";

      case "RESERVED":
        return "table-reserved";

      case "CLEANING":
        return "table-cleaning";

      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "Available";

      case "OCCUPIED":
        return "Occupied";

      case "RESERVED":
        return "Reserved";

      case "CLEANING":
        return "Cleaning";

      default:
        return status;
    }
  };

  const availableCount = tables.filter(
    (table) => table.status === "AVAILABLE"
  ).length;

  const occupiedCount = tables.filter(
    (table) => table.status === "OCCUPIED"
  ).length;

  const reservedCount = tables.filter(
    (table) => table.status === "RESERVED"
  ).length;

  return (
    <div className="tables-page">

      {/* Header */}

      <header className="tables-header">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div className="tables-title">
          <h1>Tables</h1>
          <span>
            {user?.name || "Waiter"}
          </span>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadTables}
          disabled={loading}
        >
          ↻
        </button>

      </header>

      {/* Summary */}

      <section className="table-summary">

        <div className="summary-item">
          <span className="summary-number">
            {tables.length}
          </span>

          <span className="summary-label">
            Total
          </span>
        </div>

        <div className="summary-item available-summary">
          <span className="summary-number">
            {availableCount}
          </span>

          <span className="summary-label">
            Available
          </span>
        </div>

        <div className="summary-item occupied-summary">
          <span className="summary-number">
            {occupiedCount}
          </span>

          <span className="summary-label">
            Occupied
          </span>
        </div>

        <div className="summary-item reserved-summary">
          <span className="summary-number">
            {reservedCount}
          </span>

          <span className="summary-label">
            Reserved
          </span>
        </div>

      </section>

      {/* Loading */}

      {loading && (
        <div className="tables-message">
          Loading tables...
        </div>
      )}

      {/* Error */}

      {!loading && error && (
        <div className="tables-error">

          <p>{error}</p>

          <button
            type="button"
            onClick={loadTables}
          >
            Try Again
          </button>

        </div>
      )}

      {/* Tables */}

      {!loading && !error && (
        <main className="tables-grid">

          {tables.map((table) => (

            <button
              key={table._id}
              type="button"
              className={`table-card ${getStatusClass(
                table.status
              )}`}
            >

              <div className="table-card-top">

                <span className="table-icon">
                  🪑
                </span>

                <span className="table-status">
                  {getStatusLabel(table.status)}
                </span>

              </div>

              <div className="table-number">
                {table.tableNumber}
              </div>

              <div className="table-name">
                {table.name}
              </div>

              <div className="table-capacity">
                👥 {table.capacity} seats
              </div>

            </button>

          ))}

        </main>
      )}

    </div>
  );
}

export default Tables;