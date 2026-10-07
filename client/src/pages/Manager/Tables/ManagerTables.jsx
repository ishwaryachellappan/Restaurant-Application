import { useEffect, useMemo, useState } from "react";
import "./ManagerTables.css";
import { useRestaurantBranding } from "../../../context/RestaurantBrandingContext";

const ManagerTables = ({
  user,
  onBack,
  onOpenOrders,
  onOpenSales,
  onOpenStaff,
  onOpenMenu,
  onOpenInventory,
  onOpenSettings,
  onLogout,
}) => {
  const {
    restaurantName,
    restaurantLogo,
  } = useRestaurantBranding();

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showMergeModal, setShowMergeModal] = useState(false);
  const [primaryTableId, setPrimaryTableId] = useState("");
  const [secondaryTableId, setSecondaryTableId] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [mergeSuccess, setMergeSuccess] = useState("");

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

      const [tablesResponse, ordersResponse] =
        await Promise.all([
          fetch("http://localhost:5000/api/tables"),
          fetch("http://localhost:5000/api/orders"),
        ]);

      const tablesData =
        await tablesResponse.json();

      const ordersData =
        await ordersResponse.json();

      if (
        !tablesResponse.ok ||
        !tablesData.success
      ) {
        throw new Error(
          tablesData.message ||
            "Unable to load tables."
        );
      }

      if (
        !ordersResponse.ok ||
        !ordersData.success
      ) {
        throw new Error(
          ordersData.message ||
            "Unable to load orders."
        );
      }

      setTables(tablesData.tables || []);
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error(
        "Manager table management error:",
        error
      );

      setError(
        "Unable to load table information. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const getTableOrder = (table) => {
    if (!table.currentOrder) {
      return null;
    }

    return (
      orders.find(
        (order) =>
          String(order._id) ===
          String(table.currentOrder)
      ) || null
    );
  };

  const filteredTables = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return tables.filter((table) => {
      const matchesSearch =
        !searchValue ||
        String(table.tableNumber)
          .toLowerCase()
          .includes(searchValue) ||
        String(table.name || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        table.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    tables,
    search,
    statusFilter,
  ]);

  const availableTables =
    tables.filter(
      (table) =>
        table.status === "AVAILABLE" &&
        !table.mergedInto
    );

  const occupiedTables =
    tables.filter(
      (table) =>
        table.status === "OCCUPIED"
    );

  const reservedTables =
    tables.filter(
      (table) =>
        table.status === "RESERVED"
    );

  const cleaningTables =
    tables.filter(
      (table) =>
        table.status === "CLEANING"
    );

  const mergedTables =
    tables.filter(
      (table) =>
        table.mergedInto ||
        (table.mergedWith &&
          table.mergedWith.length > 0)
    );

  const primaryTable =
    tables.find(
      (table) =>
        String(table._id) ===
        String(primaryTableId)
    );

  const secondaryTable =
    tables.find(
      (table) =>
        String(table._id) ===
        String(secondaryTableId)
    );

  const openMergeModal = () => {
    setPrimaryTableId("");
    setSecondaryTableId("");
    setMergeError("");
    setMergeSuccess("");
    setShowMergeModal(true);
  };

  const closeMergeModal = () => {
    if (mergeLoading) {
      return;
    }

    setShowMergeModal(false);
    setPrimaryTableId("");
    setSecondaryTableId("");
    setMergeError("");
    setMergeSuccess("");
  };

  const handleMerge = async () => {
    setMergeError("");
    setMergeSuccess("");

    if (!primaryTableId) {
      setMergeError(
        "Please select the primary table."
      );
      return;
    }

    if (!secondaryTableId) {
      setMergeError(
        "Please select the table to merge."
      );
      return;
    }

    if (
      primaryTableId ===
      secondaryTableId
    ) {
      setMergeError(
        "Please select two different tables."
      );
      return;
    }

    if (
      !primaryTable?.currentOrder
    ) {
      setMergeError(
        "The primary table must have an active order."
      );
      return;
    }

    if (
      secondaryTable?.currentOrder
    ) {
      setMergeError(
        "The secondary table already has an active order."
      );
      return;
    }

    try {
      setMergeLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/tables/merge",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            primaryTableId,
            secondaryTableId,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to merge tables."
        );
      }

      setMergeSuccess(
        data.message ||
          "Tables merged successfully."
      );

      await loadTables();

      setTimeout(() => {
        setShowMergeModal(false);
        setPrimaryTableId("");
        setSecondaryTableId("");
        setMergeSuccess("");
      }, 1200);
    } catch (error) {
      console.error(
        "Merge table error:",
        error
      );

      setMergeError(
        error.message ||
          "Failed to merge tables."
      );
    } finally {
      setMergeLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "available";

      case "OCCUPIED":
        return "occupied";

      case "RESERVED":
        return "reserved";

      case "CLEANING":
        return "cleaning";

      default:
        return "available";
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

  const formatAmount = (amount) => {
    return Number(
      amount || 0
    ).toFixed(2);
  };

  return (
    <div className="manager-app manager-tables-page">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="manager-sidebar">

        <div className="manager-brand">

          <div className="manager-brand-icon">
            {restaurantLogo ? (
              <img
                src={restaurantLogo}
                alt={restaurantName}
              />
            ) : (
              "🍽"
            )}
          </div>

          <div>
            <strong>
              {restaurantName}
            </strong>
          </div>

        </div>

        <div className="manager-sidebar-section">

          <span className="manager-sidebar-title">
            MANAGEMENT
          </span>

          <button
            className="manager-nav-item"
            onClick={onBack}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="manager-nav-item"
            onClick={onOpenOrders}
          >
            <span>▤</span>
            Orders
          </button>

          <button
            className="manager-nav-item"
            onClick={onOpenSales}
          >
            <span>₹</span>
            Sales & Reports
          </button>

          <button
            className="manager-nav-item"
            onClick={onOpenStaff}
          >
            <span>👥</span>
            Staff
          </button>

          <button
            className="manager-nav-item"
            onClick={onOpenMenu}
          >
            <span>🍽️</span>
            Menu Management
          </button>

          <button
            className="manager-nav-item"
            onClick={onOpenInventory}
          >
            <span>📦</span>
            Inventory
          </button>

          <button
            className="manager-nav-item active"
          >
            <span>🪑</span>
            Table Management
          </button>

          <button
            className="manager-nav-item"
            onClick={onOpenSettings}
          >
            <span>⚙️</span>
            Restaurant Settings
          </button>

          <button
            className="manager-nav-item"
            onClick={loadTables}
          >
            <span>↻</span>
            Refresh Data
          </button>

        </div>

        <div className="manager-sidebar-bottom">

          <div className="manager-user-card">

            <div className="manager-user-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "M"}
            </div>

            <div className="manager-user-info">

              <strong>
                {user?.name ||
                  "Restaurant Manager"}
              </strong>

              <span>
                Manager
              </span>

            </div>

            <span className="manager-online-dot"></span>

          </div>

          <button
            className="manager-logout"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="manager-main">

        {/* HEADER */}

        <header className="manager-header">

          <div>

            <div className="manager-breadcrumb">
              POS /{" "}
              <strong>
                Management / Tables
              </strong>
            </div>

            <h1>
              Table Management
            </h1>

            <p>
              Manage restaurant tables,
              occupancy and table operations.
            </p>

          </div>

          <div className="manager-header-actions">

            <div className="manager-system-status">
              <span></span>
              System Online
            </div>

            <button
              className="manager-refresh"
              onClick={loadTables}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

        </header>

        {/* BACK BUTTON */}

        <div className="manager-tables-back-row">

          <button
            className="manager-tables-back"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="manager-error">
            <strong>
              Table data unavailable
            </strong>

            <span>
              {error}
            </span>

            <button
              onClick={loadTables}
            >
              Try Again
            </button>
          </div>
        )}

        {/* =========================
            KPI CARDS
        ========================= */}

        {!error && (
          <>

            <section className="manager-kpis">

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon tables">
                  🪑
                </div>

                <div>
                  <span>
                    Total Tables
                  </span>

                  <strong>
                    {tables.length}
                  </strong>

                  <small>
                    Configured tables
                  </small>
                </div>

              </div>

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon active">
                  ●
                </div>

                <div>
                  <span>
                    Available
                  </span>

                  <strong>
                    {availableTables.length}
                  </strong>

                  <small>
                    Ready for seating
                  </small>
                </div>

              </div>

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon orders">
                  ●
                </div>

                <div>
                  <span>
                    Occupied
                  </span>

                  <strong>
                    {occupiedTables.length}
                  </strong>

                  <small>
                    Currently in use
                  </small>
                </div>

              </div>

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon revenue">
                  ⇄
                </div>

                <div>
                  <span>
                    Merged
                  </span>

                  <strong>
                    {mergedTables.length}
                  </strong>

                  <small>
                    Linked table records
                  </small>
                </div>

              </div>

            </section>

            {/* =========================
                TOOLBAR
            ========================= */}

            <section className="manager-tables-toolbar">

              <div className="manager-tables-search">

                <span>
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Search table..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="manager-tables-filter">

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="ALL">
                    All Status
                  </option>

                  <option value="AVAILABLE">
                    Available
                  </option>

                  <option value="OCCUPIED">
                    Occupied
                  </option>

                  <option value="RESERVED">
                    Reserved
                  </option>

                  <option value="CLEANING">
                    Cleaning
                  </option>
                </select>

              </div>

              <button
                className="manager-merge-button"
                onClick={openMergeModal}
              >
                ⇄ Merge Tables
              </button>

            </section>

            {/* =========================
                TABLE GRID
            ========================= */}

            <section className="manager-tables-panel">

              <div className="manager-panel-header">

                <div>
                  <span>
                    FLOOR
                  </span>

                  <h2>
                    Restaurant Tables
                  </h2>
                </div>

                <span className="manager-panel-count">
                  {filteredTables.length} tables
                </span>

              </div>

              {loading ? (
                <div className="manager-loading">
                  Loading tables...
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="manager-no-orders">
                  No tables found.
                </div>
              ) : (
                <div className="manager-tables-grid">

                  {filteredTables.map(
                    (table) => {

                      const order =
                        getTableOrder(
                          table
                        );

                      return (
                        <div
                          key={table._id}
                          className={`manager-table-card ${getStatusClass(
                            table.status
                          )}`}
                        >

                          <div className="manager-table-card-top">

                            <div className="manager-table-number">
                              {table.tableNumber}
                            </div>

                            <span
                              className={`manager-table-status ${getStatusClass(
                                table.status
                              )}`}
                            >
                              {getStatusLabel(
                                table.status
                              )}
                            </span>

                          </div>

                          <div className="manager-table-name">
                            {table.name ||
                              `Table ${table.tableNumber}`}
                          </div>

                          <div className="manager-table-capacity">
                            👥{" "}
                            {table.capacity} seats
                          </div>

                          {order ? (
                            <div className="manager-table-order">

                              <div>
                                <span>
                                  ACTIVE ORDER
                                </span>

                                <strong>
                                  {order.orderNumber}
                                </strong>
                              </div>

                              <strong>
                                {formatAmount(
                                  order.total
                                )}
                              </strong>

                            </div>
                          ) : (
                            <div className="manager-table-no-order">
                              {table.mergedInto
                                ? "Merged into another table"
                                : "No active order"}
                            </div>
                          )}

                          {table.mergedWith &&
                            table.mergedWith.length >
                              0 && (
                              <div className="manager-table-merged">
                                ⇄ Merged with{" "}
                                {
                                  table.mergedWith.length
                                }{" "}
                                table
                                {table.mergedWith
                                  .length !==
                                1
                                  ? "s"
                                  : ""}
                              </div>
                            )}

                          {table.mergedInto && (
                            <div className="manager-table-merged">
                              ⇄ Linked to primary table
                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </>
        )}

      </main>

      {/* =========================
          MERGE MODAL
      ========================= */}

      {showMergeModal && (
        <div
          className="manager-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeMergeModal();
            }
          }}
        >

          <div className="manager-table-modal">

            <div className="manager-table-modal-header">

              <div>
                <span>
                  TABLE OPERATIONS
                </span>

                <h2>
                  Merge Tables
                </h2>

                <p>
                  The primary table keeps
                  the active order.
                </p>
              </div>

              <button
                className="manager-modal-close"
                onClick={closeMergeModal}
                disabled={mergeLoading}
              >
                ×
              </button>

            </div>

            <div className="manager-table-modal-body">

              {mergeError && (
                <div className="manager-modal-error">
                  {mergeError}
                </div>
              )}

              {mergeSuccess && (
                <div className="manager-modal-success">
                  {mergeSuccess}
                </div>
              )}

              <div className="manager-merge-fields">

                <div className="manager-merge-field">

                  <label>
                    PRIMARY TABLE
                  </label>

                  <select
                    value={primaryTableId}
                    onChange={(event) => {
                      setPrimaryTableId(
                        event.target.value
                      );

                      if (
                        event.target.value ===
                        secondaryTableId
                      ) {
                        setSecondaryTableId("");
                      }
                    }}
                    disabled={mergeLoading}
                  >

                    <option value="">
                      Select primary table
                    </option>

                    {occupiedTables
                      .filter(
                        (table) =>
                          !table.mergedInto
                      )
                      .map((table) => (
                        <option
                          key={table._id}
                          value={table._id}
                        >
                          Table{" "}
                          {table.tableNumber}
                          {table.currentOrder
                            ? ` — ${getTableOrder(
                                table
                              )?.orderNumber || "Active Order"}`
                            : ""}
                        </option>
                      ))}
                  </select>

                  <small>
                    Must have an active order.
                  </small>

                </div>

                <div className="manager-merge-arrow">
                  ⇄
                </div>

                <div className="manager-merge-field">

                  <label>
                    SECONDARY TABLE
                  </label>

                  <select
                    value={secondaryTableId}
                    onChange={(event) =>
                      setSecondaryTableId(
                        event.target.value
                      )
                    }
                    disabled={mergeLoading}
                  >

                    <option value="">
                      Select table to merge
                    </option>

                    {availableTables
                      .filter(
                        (table) =>
                          String(table._id) !==
                          String(primaryTableId)
                      )
                      .map((table) => (
                        <option
                          key={table._id}
                          value={table._id}
                        >
                          Table{" "}
                          {table.tableNumber}
                          {" — "}
                          {table.capacity} seats
                        </option>
                      ))}
                  </select>

                  <small>
                    Must be available and have
                    no active order.
                  </small>

                </div>

              </div>

              {(primaryTable ||
                secondaryTable) && (
                <div className="manager-merge-preview">

                  <div className="manager-merge-preview-card">

                    <span>
                      PRIMARY
                    </span>

                    <strong>
                      {primaryTable
                        ? `Table ${primaryTable.tableNumber}`
                        : "Not selected"}
                    </strong>

                    {primaryTable && (
                      <small>
                        {primaryTable.capacity} seats
                        {getTableOrder(
                          primaryTable
                        )
                          ? ` • ${
                              getTableOrder(
                                primaryTable
                              ).orderNumber
                            }`
                          : ""}
                      </small>
                    )}

                  </div>

                  <div className="manager-merge-preview-plus">
                    +
                  </div>

                  <div className="manager-merge-preview-card">

                    <span>
                      SECONDARY
                    </span>

                    <strong>
                      {secondaryTable
                        ? `Table ${secondaryTable.tableNumber}`
                        : "Not selected"}
                    </strong>

                    {secondaryTable && (
                      <small>
                        {secondaryTable.capacity} seats
                      </small>
                    )}

                  </div>

                </div>
              )}

            </div>

            <div className="manager-table-modal-footer">

              <button
                className="manager-modal-secondary"
                onClick={closeMergeModal}
                disabled={mergeLoading}
              >
                Cancel
              </button>

              <button
                className="manager-modal-primary"
                onClick={handleMerge}
                disabled={mergeLoading}
              >
                {mergeLoading
                  ? "Merging..."
                  : "Merge Tables"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default ManagerTables;
