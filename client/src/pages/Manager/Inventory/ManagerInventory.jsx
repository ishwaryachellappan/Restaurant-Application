import { useEffect, useMemo, useState } from "react";
import "./ManagerInventory.css";

function ManagerInventory({
  user,
  onBack,
  onOpenOrders,
  onOpenSales,
  onOpenStaff,
  onLogout,
}) {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // ==========================================
  // LOAD INVENTORY
  // ==========================================

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/inventory"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load inventory."
        );
      }

      setItems(data.items || []);
    } catch (error) {
      console.error("Manager inventory error:", error);

      setError(
        "Unable to load inventory. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD ALL MOVEMENTS
  // ==========================================

  const loadMovements = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/inventory/history/all"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load stock history."
        );
      }

      setMovements(data.movements || []);
    } catch (error) {
      console.error(
        "Manager inventory history error:",
        error
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadInventory();
    loadMovements();
  }, []);

  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories = useMemo(() => {
    return [
      ...new Set(
        items
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [items]);

  // ==========================================
  // FILTER INVENTORY
  // ==========================================

  const filteredItems = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.name
          ?.toLowerCase()
          .includes(searchValue) ||
        item.category
          ?.toLowerCase()
          .includes(searchValue) ||
        item.supplier
          ?.toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        categoryFilter === "ALL" ||
        item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    items,
    search,
    categoryFilter,
    statusFilter,
  ]);

  // ==========================================
  // KPI COUNTS
  // ==========================================

  const totalItems = items.length;

  const inStockCount = items.filter(
    (item) => item.status === "IN_STOCK"
  ).length;

  const lowStockCount = items.filter(
    (item) => item.status === "LOW_STOCK"
  ).length;

  const outOfStockCount = items.filter(
    (item) => item.status === "OUT_OF_STOCK"
  ).length;

  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "In Stock";

      case "LOW_STOCK":
        return "Low Stock";

      case "OUT_OF_STOCK":
        return "Out of Stock";

      default:
        return status || "-";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "manager-inventory-status-in";

      case "LOW_STOCK":
        return "manager-inventory-status-low";

      case "OUT_OF_STOCK":
        return "manager-inventory-status-out";

      default:
        return "";
    }
  };

  // ==========================================
  // MOVEMENT HELPERS
  // ==========================================

  const getMovementLabel = (type) => {
    switch (type) {
      case "STOCK_IN":
        return "Stock In";

      case "STOCK_OUT":
        return "Stock Out";

      case "ADJUSTMENT":
        return "Adjustment";

      default:
        return type || "-";
    }
  };

  const getMovementClass = (type) => {
    switch (type) {
      case "STOCK_IN":
        return "movement-in";

      case "STOCK_OUT":
        return "movement-out";

      case "ADJUSTMENT":
        return "movement-adjustment";

      default:
        return "";
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // OPEN ITEM HISTORY
  // ==========================================

  const openHistory = async (item) => {
    setSelectedItem(item);
    setShowHistory(true);

    try {
      setHistoryLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/inventory/${item._id}/movements`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load item history."
        );
      }

      setMovements(data.movements || []);
    } catch (error) {
      console.error(
        "Load item history error:",
        error
      );

      setMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ==========================================
  // CLOSE HISTORY
  // ==========================================

  const closeHistory = async () => {
    setShowHistory(false);
    setSelectedItem(null);

    await loadMovements();
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="manager-inventory-page">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="manager-inventory-sidebar">

        <div className="manager-inventory-brand">

          <div className="manager-inventory-brand-icon">
            🍽
          </div>

          <div className="manager-inventory-brand-text">
            <strong>
              Restaurant
            </strong>

            <span>
              MANAGEMENT
            </span>
          </div>

        </div>

        <div className="manager-inventory-sidebar-section">

          <span className="manager-inventory-sidebar-title">
            MANAGEMENT
          </span>

          <button
            className="manager-inventory-nav-item"
            onClick={onBack}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="manager-inventory-nav-item"
            onClick={onOpenOrders}
          >
            <span>▤</span>
            Orders
          </button>

          <button
            className="manager-inventory-nav-item"
            onClick={onOpenSales}
          >
            <span>₹</span>
            Sales & Reports
          </button>

          <button
            className="manager-inventory-nav-item"
            onClick={onOpenStaff}
          >
            <span>👥</span>
            Staff
          </button>

          <button
            className="manager-inventory-nav-item active"
          >
            <span>📦</span>
            Inventory
          </button>

        </div>

        <div className="manager-inventory-sidebar-bottom">

          <button
            className="manager-inventory-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="manager-inventory-main">

        {/* HEADER */}

        <header className="manager-inventory-header">

          <div>

            <div className="manager-inventory-back-row">

              <button
                className="manager-inventory-back"
                onClick={onBack}
              >
                ← Back to Dashboard
              </button>

            </div>

            <h1>
              Inventory Overview
            </h1>

            <p>
              View current restaurant inventory
              and stock movements.
            </p>

          </div>

          <div className="manager-inventory-user">

            <span>
              Manager
            </span>

            <strong>
              {user?.name || "Restaurant Manager"}
            </strong>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="manager-inventory-error">
            {error}
          </div>
        )}

        {/* KPI CARDS */}

        <section className="manager-inventory-kpis">

          <div className="manager-inventory-kpi-card">

            <div className="manager-inventory-kpi-icon">
              📦
            </div>

            <div>
              <span>Total Items</span>
              <strong>{totalItems}</strong>
            </div>

          </div>

          <div className="manager-inventory-kpi-card">

            <div className="manager-inventory-kpi-icon">
              ✓
            </div>

            <div>
              <span>In Stock</span>
              <strong>{inStockCount}</strong>
            </div>

          </div>

          <div className="manager-inventory-kpi-card">

            <div className="manager-inventory-kpi-icon">
              !
            </div>

            <div>
              <span>Low Stock</span>
              <strong>{lowStockCount}</strong>
            </div>

          </div>

          <div className="manager-inventory-kpi-card">

            <div className="manager-inventory-kpi-icon">
              ×
            </div>

            <div>
              <span>Out of Stock</span>
              <strong>{outOfStockCount}</strong>
            </div>

          </div>

        </section>

        {/* FILTERS */}

        <section className="manager-inventory-filter-card">

          <div className="manager-inventory-filter-group search">

            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Search item, category or supplier..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <div className="manager-inventory-filter-group">

            <label>
              Category
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="ALL">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

          </div>

          <div className="manager-inventory-filter-group">

            <label>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="IN_STOCK">
                In Stock
              </option>

              <option value="LOW_STOCK">
                Low Stock
              </option>

              <option value="OUT_OF_STOCK">
                Out of Stock
              </option>

            </select>

          </div>

          <button
            className="manager-inventory-refresh"
            onClick={() => {
              loadInventory();
              loadMovements();
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>

        </section>

        {/* INVENTORY TABLE */}

        <section className="manager-inventory-table-card">

          <div className="manager-inventory-section-header">

            <div>

              <span>
                INVENTORY
              </span>

              <h2>
                Current Stock
              </h2>

            </div>

            <strong>
              {filteredItems.length}{" "}
              {filteredItems.length === 1
                ? "Item"
                : "Items"}
            </strong>

          </div>

          {loading ? (

            <div className="manager-inventory-message">
              Loading inventory...
            </div>

          ) : filteredItems.length === 0 ? (

            <div className="manager-inventory-message">
              <div className="manager-inventory-empty-icon">
                📦
              </div>

              <h3>
                No Inventory Items
              </h3>

              <p>
                No inventory items match the
                selected filters.
              </p>

            </div>

          ) : (

            <div className="manager-inventory-table-wrapper">

              <table className="manager-inventory-table">

                <thead>

                  <tr>
                    <th>ITEM</th>
                    <th>CATEGORY</th>
                    <th>CURRENT STOCK</th>
                    <th>MINIMUM</th>
                    <th>MAXIMUM</th>
                    <th>SUPPLIER</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredItems.map((item) => (

                    <tr key={item._id}>

                      <td>

                        <div className="manager-inventory-item-name">

                          <strong>
                            {item.name}
                          </strong>

                          {item.notes && (
                            <small>
                              {item.notes}
                            </small>
                          )}

                        </div>

                      </td>

                      <td>
                        {item.category || "-"}
                      </td>

                      <td>

                        <strong>
                          {Number(
                            item.currentStock || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span className="manager-inventory-unit">
                          {" "}
                          {item.unit || ""}
                        </span>

                      </td>

                      <td>
                        {Number(
                          item.minimumStock || 0
                        )}{" "}
                        {item.unit || ""}
                      </td>

                      <td>
                        {Number(
                          item.maximumStock || 0
                        )}{" "}
                        {item.unit || ""}
                      </td>

                      <td>
                        {item.supplier || "-"}
                      </td>

                      <td>

                        <span
                          className={`manager-inventory-status ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(
                            item.status
                          )}
                        </span>

                      </td>

                      <td>

                        <button
                          className="manager-inventory-history-button"
                          onClick={() =>
                            openHistory(item)
                          }
                        >
                          View History
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* RECENT MOVEMENTS */}

        <section className="manager-inventory-movement-card">

          <div className="manager-inventory-section-header">

            <div>

              <span>
                STOCK ACTIVITY
              </span>

              <h2>
                Recent Stock Movements
              </h2>

            </div>

            <button
              className="manager-inventory-small-refresh"
              onClick={loadMovements}
              disabled={historyLoading}
            >
              {historyLoading
                ? "Loading..."
                : "↻ Refresh"}
            </button>

          </div>

          {historyLoading ? (

            <div className="manager-inventory-message">
              Loading stock movements...
            </div>

          ) : movements.length === 0 ? (

            <div className="manager-inventory-message">
              No stock movements recorded.
            </div>

          ) : (

            <div className="manager-inventory-movement-table-wrapper">

              <table className="manager-inventory-movement-table">

                <thead>

                  <tr>
                    <th>DATE</th>
                    <th>ITEM</th>
                    <th>TYPE</th>
                    <th>QUANTITY</th>
                    <th>STOCK</th>
                    <th>REASON</th>
                    <th>PERFORMED BY</th>
                  </tr>

                </thead>

                <tbody>

                  {movements
                    .slice(0, 20)
                    .map((movement) => (

                      <tr key={movement._id}>

                        <td>
                          {formatDate(
                            movement.createdAt
                          )}
                        </td>

                        <td>
                          <strong>
                            {movement.itemName ||
                              movement.name ||
                              "-"}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={`manager-inventory-movement-type ${getMovementClass(
                              movement.movementType
                            )}`}
                          >
                            {getMovementLabel(
                              movement.movementType
                            )}
                          </span>

                        </td>

                        <td>
                          {movement.quantity ?? "-"}
                        </td>

                        <td>
                          {movement.previousStock ??
                            "-"}{" "}
                          →{" "}
                          {movement.newStock ??
                            "-"}
                        </td>

                        <td>
                          {movement.reason || "-"}
                        </td>

                        <td>
                          {movement.performedBy ||
                            "-"}
                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

      {/* ======================================
          HISTORY MODAL
      ====================================== */}

      {showHistory && (

        <div className="manager-inventory-modal-overlay">

          <div className="manager-inventory-modal">

            <div className="manager-inventory-modal-header">

              <div>

                <span>
                  STOCK HISTORY
                </span>

                <h2>
                  {selectedItem?.name ||
                    "Inventory Item"}
                </h2>

              </div>

              <button
                className="manager-inventory-modal-close"
                onClick={closeHistory}
              >
                ×
              </button>

            </div>

            <div className="manager-inventory-modal-summary">

              <div>
                <span>Current Stock</span>

                <strong>
                  {selectedItem?.currentStock ?? 0}{" "}
                  {selectedItem?.unit || ""}
                </strong>
              </div>

              <div>
                <span>Minimum Stock</span>

                <strong>
                  {selectedItem?.minimumStock ?? 0}{" "}
                  {selectedItem?.unit || ""}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {getStatusLabel(
                    selectedItem?.status
                  )}
                </strong>
              </div>

            </div>

            {historyLoading ? (

              <div className="manager-inventory-message">
                Loading history...
              </div>

            ) : movements.length === 0 ? (

              <div className="manager-inventory-message">
                No movement history available.
              </div>

            ) : (

              <div className="manager-inventory-modal-table-wrapper">

                <table className="manager-inventory-movement-table">

                  <thead>

                    <tr>
                      <th>DATE</th>
                      <th>TYPE</th>
                      <th>QUANTITY</th>
                      <th>STOCK</th>
                      <th>REASON</th>
                      <th>PERFORMED BY</th>
                    </tr>

                  </thead>

                  <tbody>

                    {movements.map(
                      (movement) => (

                        <tr
                          key={movement._id}
                        >

                          <td>
                            {formatDate(
                              movement.createdAt
                            )}
                          </td>

                          <td>

                            <span
                              className={`manager-inventory-movement-type ${getMovementClass(
                                movement.movementType
                              )}`}
                            >
                              {getMovementLabel(
                                movement.movementType
                              )}
                            </span>

                          </td>

                          <td>
                            {movement.quantity ??
                              "-"}
                          </td>

                          <td>
                            {movement.previousStock ??
                              "-"}{" "}
                            →{" "}
                            {movement.newStock ??
                              "-"}
                          </td>

                          <td>
                            {movement.reason ||
                              "-"}
                          </td>

                          <td>
                            {movement.performedBy ||
                              "-"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

            <div className="manager-inventory-modal-footer">

              <button
                className="manager-inventory-close-button"
                onClick={closeHistory}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManagerInventory;