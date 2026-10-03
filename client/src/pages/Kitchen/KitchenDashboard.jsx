import { useEffect, useState } from "react";
import "./KitchenDashboard.css";
import KitchenInventory from "./KitchenInventory";
import {
  useRestaurantBranding,
} from "../../context/RestaurantBrandingContext";

function KitchenDashboard({ user, onLogout }) {
  const {
    restaurantName,
    restaurantLogo,
  } = useRestaurantBranding();

  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);

  const [showInventory, setShowInventory] = useState(false);

  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [completedError, setCompletedError] =
    useState("");

  const [updatingOrderId, setUpdatingOrderId] =
    useState(null);

  // ------------------------------------------
  // LOAD ACTIVE KITCHEN ORDERS
  // ------------------------------------------

  const loadOrders = async () => {
    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/kitchen/orders"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load kitchen orders"
        );
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error(
        "Kitchen orders error:",
        err
      );

      setError(
        err.message ||
          "Failed to load kitchen orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // LOAD TODAY'S COMPLETED ORDERS
  // ------------------------------------------

  const loadCompletedOrders = async () => {
    try {
      setCompletedError("");

      const response = await fetch(
        "http://localhost:5000/api/kitchen/completed"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load completed orders"
        );
      }

      setCompletedOrders(data.orders || []);
    } catch (err) {
      console.error(
        "Completed orders error:",
        err
      );

      setCompletedError(
        err.message ||
          "Failed to load completed orders"
      );
    } finally {
      setCompletedLoading(false);
    }
  };

  // ------------------------------------------
  // LOAD EVERYTHING
  // ------------------------------------------

  const loadKitchenData = async () => {
    setLoading(true);
    setCompletedLoading(true);

    await Promise.all([
      loadOrders(),
      loadCompletedOrders(),
    ]);
  };

  // ------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------

  useEffect(() => {
    loadKitchenData();
  }, []);

  // ------------------------------------------
  // UPDATE ORDER STATUS
  // ------------------------------------------

  const updateOrderStatus = async (
    orderId,
    action
  ) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/kitchen/orders/${orderId}/${action}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update order"
        );
      }

      console.log(
        "Kitchen order updated:",
        data.order
      );

      // Refresh both active and completed lists
      await loadKitchenData();
    } catch (err) {
      console.error(
        "Kitchen status update error:",
        err
      );

      setError(
        err.message ||
          "Failed to update order"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="kitchen-page">

      {/* =================================================
          INVENTORY PAGE
          ================================================= */}

      {showInventory ? (
        <KitchenInventory
          onBack={() => setShowInventory(false)}
        />
      ) : (

        <>
          {/* =================================================
              HEADER
              ================================================= */}

          <header className="kitchen-header">

            {/* RESTAURANT BRANDING */}

            <div className="kitchen-branding">

              <div className="kitchen-brand-logo">
                {restaurantLogo ? (
                  <img
                    src={restaurantLogo}
                    alt={restaurantName}
                  />
                ) : (
                  "🍽"
                )}
              </div>

              <div className="kitchen-brand-name">
                <strong>
                  {restaurantName}
                </strong>
              </div>

            </div>

            {/* DASHBOARD TITLE */}

            <div className="kitchen-header-title">

              <h1>
                Kitchen Dashboard
              </h1>

              <p>
                Welcome,{" "}
                {user?.name || "Kitchen Staff"}
              </p>

            </div>

            {/* HEADER ACTIONS */}

            <div className="kitchen-header-actions">

              <button
                className="kitchen-inventory-button"
                onClick={() =>
                  setShowInventory(true)
                }
              >
                📦 Inventory
              </button>

              <button
                className="kitchen-logout"
                onClick={onLogout}
              >
                Logout
              </button>

            </div>

          </header>

          {/* =================================================
              CONTENT
              ================================================= */}

          <main className="kitchen-content">

            {/* =================================================
                ACTIVE ORDERS TITLE
                ================================================= */}

            <div className="kitchen-title-row">

              <div>

                <h2>
                  Kitchen Orders
                </h2>

                <p>
                  {orders.length} active order
                  {orders.length !== 1
                    ? "s"
                    : ""}
                </p>

              </div>

              <button
                className="refresh-button"
                onClick={loadKitchenData}
                disabled={
                  loading ||
                  completedLoading
                }
              >
                {loading ||
                completedLoading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

            {/* =================================================
                ACTIVE ERROR
                ================================================= */}

            {error && (
              <div className="kitchen-error">
                {error}
              </div>
            )}

            {/* =================================================
                ACTIVE LOADING
                ================================================= */}

            {loading && (
              <div className="kitchen-message">
                Loading kitchen orders...
              </div>
            )}

            {/* =================================================
                ACTIVE EMPTY
                ================================================= */}

            {!loading &&
              !error &&
              orders.length === 0 && (
                <div className="kitchen-empty">

                  <h3>
                    No active orders
                  </h3>

                  <p>
                    New orders sent by
                    waiters will appear
                    here.
                  </p>

                </div>
              )}

            {/* =================================================
                ACTIVE ORDERS
                ================================================= */}

            {!loading &&
              !error &&
              orders.length > 0 && (

                <div className="kitchen-orders-grid">

                  {orders.map((order) => {

                    const isUpdating =
                      updatingOrderId ===
                      order._id;

                    return (
                      <div
                        className={`kitchen-order-card ${order.status.toLowerCase()}`}
                        key={order._id}
                      >

                        {/* ORDER HEADER */}

                        <div className="order-card-header">

                          <div>

                            <span className="table-label">
                              TABLE{" "}
                              {order.tableNumber}
                            </span>

                            <h3>
                              {order.orderNumber}
                            </h3>

                          </div>

                          <span
                            className={`order-status ${order.status.toLowerCase()}`}
                          >
                            {order.status.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                        </div>

                        {/* ITEMS */}

                        <div className="order-items">

                          {order.items.map(
                            (item, index) => (

                              <div
                                className="kitchen-item"
                                key={`${item.menuItemId}-${index}`}
                              >

                                <span className="item-name">
                                  {item.name}
                                </span>

                                <span className="item-quantity">
                                  ×{" "}
                                  {item.quantity}
                                </span>

                              </div>

                            )
                          )}

                        </div>

                        {/* FOOTER */}

                        <div className="order-card-footer">

                          <span>
                            Waiter:{" "}
                            {order.waiterName}
                          </span>

                          <strong>
                            ₹{order.total}
                          </strong>

                        </div>

                        {/* ACTIONS */}

                        {order.status ===
                          "SENT_TO_KITCHEN" && (
                          <button
                            className="kitchen-action-button start-button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateOrderStatus(
                                order._id,
                                "start"
                              )
                            }
                          >
                            {isUpdating
                              ? "Starting..."
                              : "START PREPARING"}
                          </button>
                        )}

                        {order.status ===
                          "PREPARING" && (
                          <button
                            className="kitchen-action-button ready-button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateOrderStatus(
                                order._id,
                                "ready"
                              )
                            }
                          >
                            {isUpdating
                              ? "Updating..."
                              : "MARK READY"}
                          </button>
                        )}

                        {order.status ===
                          "READY" && (
                          <div className="ready-message">
                            ✓ Order Ready
                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>
              )}

            {/* =================================================
                TODAY'S COMPLETED ORDERS
                ================================================= */}

            <section className="completed-orders-section">

              <div className="completed-orders-header">

                <div>

                  <h2>
                    Today's Completed Orders
                  </h2>

                  <p>
                    {completedOrders.length} completed
                    order
                    {completedOrders.length !==
                    1
                      ? "s"
                      : ""}
                  </p>

                </div>

              </div>

              {/* COMPLETED ERROR */}

              {completedError && (
                <div className="kitchen-error">
                  {completedError}
                </div>
              )}

              {/* COMPLETED LOADING */}

              {completedLoading && (
                <div className="kitchen-message">
                  Loading completed orders...
                </div>
              )}

              {/* COMPLETED EMPTY */}

              {!completedLoading &&
                !completedError &&
                completedOrders.length ===
                  0 && (
                  <div className="kitchen-empty">

                    <h3>
                      No completed orders today
                    </h3>

                    <p>
                      Orders completed today
                      will appear here.
                    </p>

                  </div>
                )}

              {/* COMPLETED ORDERS TABLE */}

              {!completedLoading &&
                !completedError &&
                completedOrders.length >
                  0 && (
                  <div className="completed-orders-table">

                    <div className="completed-table-header">

                      <span>
                        ORDER
                      </span>

                      <span>
                        TABLE
                      </span>

                      <span>
                        WAITER
                      </span>

                      <span>
                        ITEMS
                      </span>

                      <span>
                        TOTAL
                      </span>

                      <span>
                        STATUS
                      </span>

                    </div>

                    {completedOrders.map(
                      (order) => (

                        <div
                          className="completed-table-row"
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
                            {order.waiterName}
                          </span>

                          <span>
                            {order.items.reduce(
                              (sum, item) =>
                                sum +
                                item.quantity,
                              0
                            )}
                          </span>

                          <strong>
                            ₹{order.total}
                          </strong>

                          <span className="completed-status">
                            COMPLETED
                          </span>

                        </div>

                      )
                    )}

                  </div>
                )}

            </section>

          </main>
        </>

      )}

    </div>
  );
}

export default KitchenDashboard;