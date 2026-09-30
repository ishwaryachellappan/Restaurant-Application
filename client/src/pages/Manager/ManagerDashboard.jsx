import { useEffect, useRef, useState } from "react";
import "./ManagerDashboard.css";

function ManagerDashboard({
  user,
  onLogout,
  onOpenOrders,
  onOpenSales,
  onOpenStaff,
  onOpenMenu,
}) {
  
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
const dateInputRef = useRef(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        ordersResponse,
        tablesResponse,
        kitchenResponse,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/orders"),
        fetch("http://localhost:5000/api/tables"),
        fetch("http://localhost:5000/api/kitchen/orders"),
      ]);

      const ordersData = await ordersResponse.json();
      const tablesData = await tablesResponse.json();
      const kitchenData = await kitchenResponse.json();

      if (
        !ordersResponse.ok ||
        !ordersData.success
      ) {
        throw new Error(
          ordersData.message ||
          "Unable to load orders."
        );
      }

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
        !kitchenResponse.ok ||
        !kitchenData.success
      ) {
        throw new Error(
          kitchenData.message ||
          "Unable to load kitchen data."
        );
      }

      setOrders(ordersData.orders || []);
      setTables(tablesData.tables || []);
      setKitchenOrders(
        kitchenData.orders || []
      );
    } catch (error) {
      console.error(
        "Manager dashboard error:",
        error
      );

      setError(
        "Unable to load dashboard data. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getLocalDateString = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(
      d.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      d.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = new Date();

  const todayString =
    getLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const yesterdayString =
    getLocalDateString(yesterday);

  const selectedDate =
    dateFilter === "today"
      ? todayString
      : dateFilter === "yesterday"
        ? yesterdayString
        : customDate;

  const filteredOrders = orders.filter(
    (order) => {
      if (!selectedDate) return false;

      return (
        getLocalDateString(
          order.createdAt
        ) === selectedDate
      );
    }
  );

  const totalOrders =
    filteredOrders.length;

  const completedOrders =
    filteredOrders.filter(
      (order) =>
        order.status === "COMPLETED"
    ).length;

  const pendingPaymentOrders =
    filteredOrders.filter(
      (order) =>
        order.status === "READY"
    ).length;

  const activeOrders =
    filteredOrders.filter(
      (order) =>
        [
          "SENT_TO_KITCHEN",
          "PREPARING",
          "READY",
        ].includes(order.status)
    ).length;

  const totalRevenue =
    filteredOrders
      .filter(
        (order) =>
          order.status === "COMPLETED"
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

  const occupiedTables =
    tables.filter(
      (table) =>
        table.status === "OCCUPIED"
    ).length;

  const availableTables =
    tables.filter(
      (table) =>
        table.status === "AVAILABLE"
    ).length;

  const kitchenPreparing =
    kitchenOrders.filter(
      (order) =>
        order.status === "PREPARING"
    ).length;

  const kitchenReady =
    kitchenOrders.filter(
      (order) =>
        order.status === "READY"
    ).length;

  const recentOrders =
    [...filteredOrders]
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 6);

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "completed";

      case "READY":
        return "ready";

      case "PREPARING":
        return "preparing";

      case "SENT_TO_KITCHEN":
        return "sent";

      case "CANCELLED":
        return "cancelled";

      default:
        return "default";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="manager-app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="manager-sidebar">

        <div className="manager-brand">

          <div className="manager-brand-icon">
            🍽
          </div>

          <div>
            <strong>Restaurant</strong>
            <span>POS SYSTEM</span>
          </div>

        </div>

        <div className="manager-sidebar-section">

          <span className="manager-sidebar-title">
            MANAGEMENT
          </span>

          <button className="manager-nav-item active">
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
  onClick={() => onOpenStaff()}
>
  👥
  <span>Staff</span>
</button>

<button
  className="manager-nav-item"
  onClick={() => {
    console.log("MENU BUTTON CLICKED");
    onOpenMenu();
  }}
  type="button"
>
  <span>🍽️</span>
  Menu Management
</button>

<button
  className="manager-nav-item"
  onClick={loadDashboard}
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
                ?.toUpperCase() || "M"}
            </div>

            <div className="manager-user-info">

              <strong>
                {user?.name ||
                  "Restaurant Manager"}
              </strong>

              <span>Manager</span>

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
              <strong>Management</strong>
            </div>

            <h1>
              Manager Dashboard
            </h1>

            <p>
              Monitor restaurant operations and
              sales activity.
            </p>

<div className="manager-date-filter">

  <button
    type="button"
    className={
      dateFilter === "today"
        ? "active"
        : ""
    }
    onClick={() => {
      setDateFilter("today");
      setCustomDate("");
    }}
  >
    Today
  </button>

  <button
    type="button"
    className={
      dateFilter === "yesterday"
        ? "active"
        : ""
    }
    onClick={() => {
      setDateFilter("yesterday");
      setCustomDate("");
    }}
  >
    Yesterday
  </button>

  <button
    type="button"
    className={`manager-custom-date ${
      dateFilter === "custom"
        ? "active"
        : ""
    }`}
    onClick={() => {
      if (dateInputRef.current) {
        if (
          typeof dateInputRef.current
            .showPicker === "function"
        ) {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.click();
        }
      }
    }}
  >
    <span className="manager-calendar-icon">
      📅
    </span>

    <span className="manager-custom-date-text">
      {customDate
        ? new Date(
            `${customDate}T00:00:00`
          ).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }
          )
        : "Select date"}
    </span>

    <input
      ref={dateInputRef}
      type="date"
      value={customDate}
      onChange={(event) => {
        const selectedDate =
          event.target.value;

        if (!selectedDate) {
          return;
        }

        setCustomDate(selectedDate);
        setDateFilter("custom");
      }}
      className="manager-hidden-date-input"
      aria-label="Select custom date"
    />
  </button>

</div>

           </div>

          <div className="manager-header-actions">

            <div className="manager-system-status">
              <span></span>
              System Online
            </div>

            <button
              className="manager-refresh"
              onClick={loadDashboard}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

        </header>

        {/* ERROR */}

        {!loading && error && (
          <div className="manager-error">
            <strong>
              Dashboard data unavailable
            </strong>

            <span>{error}</span>

            <button onClick={loadDashboard}>
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

                <div className="manager-kpi-icon revenue">
                  ₹
                </div>

                <div>
                  <span>Revenue</span>

                  <strong>
                    ₹
                    {totalRevenue.toFixed(2)}
                  </strong>

                  <small>
                    Completed payments
                  </small>
                </div>

              </div>

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon orders">
                  #
                </div>

                <div>
                  <span>Total Orders</span>

                  <strong>
                    {totalOrders}
                  </strong>

                  <small>
                    All recorded orders
                  </small>
                </div>

              </div>

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon active">
                  ●
                </div>

                <div>
                  <span>Active Orders</span>

                  <strong>
                    {activeOrders}
                  </strong>

                  <small>
                    In restaurant workflow
                  </small>
                </div>

              </div>

              <div className="manager-kpi-card">

                <div className="manager-kpi-icon tables">
                  ▦
                </div>

                <div>
                  <span>Tables Occupied</span>

                  <strong>
                    {occupiedTables}
                    <small className="manager-kpi-inline">
                      {" "}
                      / {tables.length}
                    </small>
                  </strong>

                  <small>
                    {availableTables} available
                  </small>

                </div>

              </div>

            </section>

            {/* =========================
                OPERATIONS
            ========================= */}

            <section className="manager-operation-grid">

              {/* TABLE STATUS */}

              <div className="manager-panel">

                <div className="manager-panel-header">

                  <div>
                    <span>
                      FLOOR
                    </span>

                    <h2>
                      Table Status
                    </h2>
                  </div>

                  <span className="manager-panel-count">
                    {occupiedTables}/{tables.length}
                  </span>

                </div>

                <div className="manager-table-summary">

                  <div className="table-summary-item">
                    <span className="table-dot available"></span>
                    <strong>
                      {availableTables}
                    </strong>
                    <small>
                      Available
                    </small>
                  </div>

                  <div className="table-summary-item">
                    <span className="table-dot occupied"></span>
                    <strong>
                      {occupiedTables}
                    </strong>
                    <small>
                      Occupied
                    </small>
                  </div>

                </div>

                <div className="manager-table-grid">

                  {tables.map((table) => (
                    <div
                      key={table._id}
                      className={`manager-table ${table.status ===
                          "OCCUPIED"
                          ? "occupied"
                          : "available"
                        }`}
                    >
                      <strong>
                        {table.tableNumber}
                      </strong>

                      <span>
                        {table.status ===
                          "OCCUPIED"
                          ? "Busy"
                          : "Free"}
                      </span>
                    </div>
                  ))}

                </div>

              </div>

              {/* KITCHEN */}

              <div className="manager-panel">

                <div className="manager-panel-header">

                  <div>
                    <span>
                      KITCHEN
                    </span>

                    <h2>
                      Kitchen Status
                    </h2>
                  </div>

                  <span className="manager-panel-count">
                    {kitchenOrders.length}
                  </span>

                </div>

                <div className="manager-kitchen-summary">

                  <div className="kitchen-status-card preparing">

                    <span>
                      PREPARING
                    </span>

                    <strong>
                      {kitchenPreparing}
                    </strong>

                  </div>

                  <div className="kitchen-status-card ready">

                    <span>
                      READY
                    </span>

                    <strong>
                      {kitchenReady}
                    </strong>

                  </div>

                </div>

                <div className="manager-kitchen-message">

                  {kitchenOrders.length === 0 ? (
                    <>
                      <span className="kitchen-check">
                        ✓
                      </span>

                      <div>
                        <strong>
                          Kitchen queue clear
                        </strong>

                        <small>
                          No active kitchen orders.
                        </small>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="kitchen-alert">
                        !
                      </span>

                      <div>
                        <strong>
                          {kitchenOrders.length} active
                          order
                          {kitchenOrders.length !==
                            1
                            ? "s"
                            : ""}
                        </strong>

                        <small>
                          Orders are currently being
                          processed.
                        </small>
                      </div>
                    </>
                  )}

                </div>

              </div>

            </section>

            {/* =========================
                ORDER OVERVIEW
            ========================= */}

            <section className="manager-orders-panel">

              <div className="manager-panel-header">

                <div>
                  <span>
                    ORDERS
                  </span>

                  <h2>
                    Recent Orders
                  </h2>

                  <span className="manager-selected-date">
                    {dateFilter === "today"
                      ? "Today"
                      : dateFilter === "yesterday"
                        ? "Yesterday"
                        : customDate
                          ? new Date(
                            `${customDate}T00:00:00`
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                          : "Select a date"}
                  </span>

                </div>

                <div className="manager-order-stats">

                  <span>
                    {pendingPaymentOrders} ready for
                    payment
                  </span>

                  <span>
                    {completedOrders} completed
                  </span>

                </div>

              </div>

              {loading ? (
                <div className="manager-loading">
                  Loading dashboard...
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="manager-no-orders">
                  No orders recorded for this date.
                </div>
              ) : (
                <div className="manager-orders-table">

                  <div className="manager-order-row manager-order-heading">

                    <span>ORDER</span>
                    <span>TABLE</span>
                    <span>WAITER</span>
                    <span>AMOUNT</span>
                    <span>STATUS</span>
                    <span>TIME</span>

                  </div>

                  {recentOrders.map(
                    (order) => (
                      <div
                        className="manager-order-row"
                        key={order._id}
                      >

                        <strong>
                          {order.orderNumber}
                        </strong>

                        <span>
                          Table{" "}
                          {order.tableNumber}
                        </span>

                        <span>
                          {order.waiterName ||
                            "-"}
                        </span>

                        <strong>
                          ₹
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </strong>

                        <span
                          className={`manager-order-status ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status
                            ?.replaceAll(
                              "_",
                              " "
                            )}
                        </span>

                        <span>
                          {formatDate(
                            order.createdAt
                          )}
                        </span>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>

          </>
        )}

      </main>

    </div>
  );
}

export default ManagerDashboard;