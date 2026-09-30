import { useEffect, useState } from "react";
import "./Tables.css";

function Tables({ user, onBack, onTableSelect }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/tables"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load tables."
        );
      }

      setTables(data.tables || data || []);
    } catch (error) {
      console.error("Load tables error:", error);

      setError(
        "Unable to load restaurant tables. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tables-page">

      {/* HEADER */}

      <header className="tables-header">

        <div className="tables-header-left">

          <button
            type="button"
            className="back-button"
            onClick={onBack}
          >
            ← Back
          </button>

          <div>
            <h1>Restaurant Tables</h1>

            <p>
              Select a table to start an order
            </p>
          </div>

        </div>

        <div className="tables-user">
          <strong>
            {user?.name || "Waiter"}
          </strong>

          <span>
            {user?.role || "WAITER"}
          </span>
        </div>

      </header>

      {/* CONTENT */}

      <main className="tables-content">

        <div className="tables-title-row">

          <div>
            <h2>Tables</h2>

            <p>
              Choose a table for the customer order.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadTables}
          >
            ↻ Refresh
          </button>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="tables-message">
            Loading tables...
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="tables-error">
            {error}

            <button
              type="button"
              onClick={loadTables}
            >
              Try Again
            </button>
          </div>
        )}

        {/* TABLES */}

        {!loading && !error && (
          <div className="tables-grid">

            {tables.map((table) => {

              const status =
                table.status?.toUpperCase() ||
                "AVAILABLE";

              return (
                <button
                  key={table._id}
                  type="button"
                  className={`table-card ${status.toLowerCase()}`}
                  onClick={() => onTableSelect(table)}
                >

                  <div className="table-icon">
                    🪑
                  </div>

                  <div className="table-number">
                    Table {table.tableNumber}
                  </div>

                  <div className="table-capacity">
                    {table.capacity} Seats
                  </div>

                  <div
                    className={`table-status ${status.toLowerCase()}`}
                  >
                    {status}
                  </div>

                </button>
              );
            })}

          </div>
        )}

        {/* NO TABLES */}

        {!loading &&
          !error &&
          tables.length === 0 && (
            <div className="tables-message">
              No restaurant tables found.
            </div>
          )}

      </main>

    </div>
  );
}

export default Tables;