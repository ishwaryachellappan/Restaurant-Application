import { useEffect, useMemo, useState } from "react";
import "./ManagerOrders.css";
import { useRestaurantBranding } from "../../../context/RestaurantBrandingContext";

function ManagerOrders({
  user,
  onBack,
  onOpenSales,
  onOpenStaff,
  onLogout,
}) {
    const { restaurantName, restaurantLogo } = useRestaurantBranding();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error("Manager orders error:", error);

      setError(
        "Unable to load orders. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
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

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const searchText =
          search.trim().toLowerCase();

        if (!searchText) {
          return true;
        }

        return (
          order.orderNumber
            ?.toLowerCase()
            .includes(searchText) ||
          String(order.tableNumber)
            .toLowerCase()
            .includes(searchText) ||
          order.waiterName
            ?.toLowerCase()
            .includes(searchText)
        );
      })
      .filter((order) => {
        if (statusFilter === "ALL") {
          return true;
        }

        return order.status === statusFilter;
      })
      .filter((order) => {
        if (dateFilter === "ALL") {
          return true;
        }

        const orderDate =
          getLocalDateString(
            order.createdAt
          );

        if (dateFilter === "TODAY") {
          return orderDate === todayString;
        }

        if (dateFilter === "YESTERDAY") {
          return (
            orderDate === yesterdayString
          );
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );
  }, [
    orders,
    search,
    statusFilter,
    dateFilter,
    todayString,
    yesterdayString,
  ]);

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

      case "SERVED":
        return "served";

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
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFilter("ALL");
  };

  return (
    <div className="manager-orders-app">

      {/* SIDEBAR */}

      <aside className="manager-orders-sidebar">

      <div className="manager-orders-brand">

  <div className="manager-orders-brand-icon">
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
    <strong>{restaurantName}</strong>
  </div>

</div>

        <div className="manager-orders-nav-section">

  <span className="manager-orders-nav-title">
    MANAGEMENT
  </span>

  <button
    className="manager-orders-nav-item"
    onClick={onBack}
    type="button"
  >
    <span>▦</span>
    Dashboard
  </button>

  <button
    className="manager-orders-nav-item active"
    type="button"
  >
    <span>▤</span>
    Orders
  </button>

  <button
    className="manager-orders-nav-item"
    onClick={onOpenSales}
    type="button"
  >
    <span>₹</span>
    Sales & Reports
  </button>

  <button
    className="manager-orders-nav-item"
    onClick={onOpenStaff}
    type="button"
  >
    <span>👥</span>
    Staff
  </button>

</div>

        <div className="manager-orders-sidebar-bottom">

          <div className="manager-orders-user">

            <div className="manager-orders-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "M"}
            </div>

            <div>
              <strong>
                {user?.name ||
                  "Restaurant Manager"}
              </strong>

              <span>Manager</span>
            </div>

            <i></i>

          </div>

          <button
            className="manager-orders-logout"
            onClick={onLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="manager-orders-main">

        <header className="manager-orders-header">

          <div>

            <div className="manager-orders-breadcrumb">
              POS / Management /{" "}
              <strong>Orders</strong>
            </div>

            <h1>
              Orders
            </h1>

            <p>
              View and monitor all restaurant orders.
            </p>

          </div>

          <button
            className="manager-orders-refresh"
            onClick={loadOrders}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </header>

        {/* FILTER BAR */}

        <section className="manager-orders-filter-card">

          <div className="manager-orders-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search order, table or waiter..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="SENT_TO_KITCHEN">
              Sent to Kitchen
            </option>

            <option value="PREPARING">
              Preparing
            </option>

            <option value="READY">
              Ready
            </option>

            <option value="SERVED">
              Served
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Dates
            </option>

            <option value="TODAY">
              Today
            </option>

            <option value="YESTERDAY">
              Yesterday
            </option>
          </select>

          <button
            className="manager-orders-clear"
            onClick={clearFilters}
          >
            Clear
          </button>

        </section>

        {/* SUMMARY */}

        <div className="manager-orders-summary">

          <div>
            <span>ORDERS FOUND</span>
            <strong>
              {filteredOrders.length}
            </strong>
          </div>

          <div>
            <span>COMPLETED</span>
            <strong>
              {
                filteredOrders.filter(
                  (order) =>
                    order.status ===
                    "COMPLETED"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>READY</span>
            <strong>
              {
                filteredOrders.filter(
                  (order) =>
                    order.status === "READY"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>TOTAL VALUE</span>
            <strong>
              ₹
              {filteredOrders
                .reduce(
                  (sum, order) =>
                    sum +
                    Number(
                      order.total || 0
                    ),
                  0
                )
                .toFixed(2)}
            </strong>
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="manager-orders-error">
            {error}

            <button onClick={loadOrders}>
              Try Again
            </button>
          </div>
        )}

        {/* ORDERS */}

        <section className="manager-orders-card">

          {loading ? (
            <div className="manager-orders-empty">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="manager-orders-empty">

              <div className="manager-orders-empty-icon">
                ✓
              </div>

              <strong>
                No orders found
              </strong>

              <span>
                Try changing your filters.
              </span>

            </div>
          ) : (
            <div className="manager-orders-table">

              <div className="manager-orders-row manager-orders-table-header">

                <span>ORDER</span>
                <span>TABLE</span>
                <span>WAITER</span>
                <span>AMOUNT</span>
                <span>STATUS</span>
                <span>TIME</span>
                <span></span>

              </div>

              {filteredOrders.map(
                (order) => (
                  <div
                    className="manager-orders-row"
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
                      className={`manager-orders-status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status?.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <span>
                      {formatDate(
                        order.createdAt
                      )}
                    </span>

                    <button
                      className="manager-orders-view"
                      onClick={() =>
                        setSelectedOrder(
                          order
                        )
                      }
                    >
                      View
                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </main>

      {/* ORDER DETAILS MODAL */}

      {selectedOrder && (
        <div
          className="manager-order-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="manager-order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="manager-order-modal-header">

              <div>
                <span>
                  ORDER DETAILS
                </span>

                <h2>
                  {selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                ×
              </button>

            </div>

            <div className="manager-order-meta">

              <div>
                <span>TABLE</span>
                <strong>
                  Table{" "}
                  {selectedOrder.tableNumber}
                </strong>
              </div>

              <div>
                <span>WAITER</span>
                <strong>
                  {selectedOrder.waiterName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong
                  className={`manager-orders-status ${getStatusClass(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status?.replaceAll(
                    "_",
                    " "
                  )}
                </strong>
              </div>

            </div>

            <div className="manager-order-items">

              <div className="manager-order-items-heading">
                <span>ITEM</span>
                <span>QTY</span>
                <span>AMOUNT</span>
              </div>

              {selectedOrder.items?.map(
                (item, index) => (
                  <div
                    className="manager-order-item"
                    key={
                      item.menuItemId ||
                      index
                    }
                  >

                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.category}
                      </span>
                    </div>

                    <span>
                      × {item.quantity}
                    </span>

                    <strong>
                      ₹
                      {Number(
                        item.itemTotal ||
                          0
                      ).toFixed(2)}
                    </strong>

                  </div>
                )
              )}

            </div>

            <div className="manager-order-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {Number(
                  selectedOrder.total ||
                    0
                ).toFixed(2)}
              </strong>

            </div>

            <div className="manager-order-created">
              Created{" "}
              {formatDate(
                selectedOrder.createdAt
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default ManagerOrders;