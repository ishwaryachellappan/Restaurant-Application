import { useEffect, useState } from "react";
import "./CashierDashboard.css";
import Receipt from "./Receipt/Receipt";
import TaxConfiguration from "./TaxConfiguration/TaxConfiguration";
import { useRestaurantBranding } from "../../context/RestaurantBrandingContext";

function CashierDashboard({
  user,
  onLogout,
  onPaymentHistory,
  onTaxConfiguration,
}) {
  // ------------------------------------------
  // RESTAURANT BRANDING
  // ------------------------------------------

  const {
    restaurantName,
    restaurantLogo,
  } = useRestaurantBranding();

  // ------------------------------------------
  // PAYMENT METHOD SETTINGS
  // ------------------------------------------

  const [
    enabledPaymentMethods,
    setEnabledPaymentMethods,
  ] = useState({
    cash: true,
    card: true,
    upi: true,
  });

  const [
    paymentSettingsLoading,
    setPaymentSettingsLoading,
  ] = useState(true);

  // ------------------------------------------
  // ORDERS
  // ------------------------------------------

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ------------------------------------------
  // PAYMENT
  // ------------------------------------------

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  // ------------------------------------------
  // PAYMENT SUCCESS
  // ------------------------------------------

  const [paymentSuccess, setPaymentSuccess] =
    useState(null);

  const [receiptData, setReceiptData] =
    useState(null);

  const [showReceipt, setShowReceipt] =
    useState(false);

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/cashier/orders"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load cashier orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(
        "Cashier orders error:",
        error
      );

      setError(
        "Unable to load orders. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD PAYMENT SETTINGS
  // =========================================================

  const loadPaymentSettings = async () => {
    try {
      setPaymentSettingsLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/settings/restaurant"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load payment settings."
        );
      }

      const configuredMethods =
        data.settings?.paymentMethods || {};

      setEnabledPaymentMethods({
        cash:
          configuredMethods.cash !== false,

        card:
          configuredMethods.card !== false,

        upi:
          configuredMethods.upi !== false,
      });
    } catch (error) {
      console.error(
        "Load payment settings error:",
        error
      );

      /*
       * If the settings API cannot be reached,
       * keep all payment methods available so
       * Cashier is not blocked.
       */
      setEnabledPaymentMethods({
        cash: true,
        card: true,
        upi: true,
      });
    } finally {
      setPaymentSettingsLoading(false);
    }
  };

  // =========================================================
  // REFRESH EVERYTHING
  // =========================================================

  const refreshCashierData = async () => {
    await Promise.all([
      loadOrders(),
      loadPaymentSettings(),
    ]);
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    refreshCashierData();
  }, []);

  // =========================================================
  // CLEAR SELECTED PAYMENT METHOD
  // IF MANAGER DISABLED IT
  // =========================================================

  useEffect(() => {
    if (
      paymentMethod === "CASH" &&
      !enabledPaymentMethods.cash
    ) {
      setPaymentMethod("");
    }

    if (
      paymentMethod === "CARD" &&
      !enabledPaymentMethods.card
    ) {
      setPaymentMethod("");
    }

    if (
      paymentMethod === "UPI" &&
      !enabledPaymentMethods.upi
    ) {
      setPaymentMethod("");
    }
  }, [
    enabledPaymentMethods,
    paymentMethod,
  ]);

  // =========================================================
  // VIEW BILL
  // =========================================================

  const handleViewBill = (order) => {
    setSelectedOrder(order);
    setPaymentMethod("");
    setPaymentError("");
  };

  // =========================================================
  // CLOSE BILL
  // =========================================================

  const handleCloseBill = () => {
    if (paymentLoading) return;

    setSelectedOrder(null);
    setPaymentMethod("");
    setPaymentError("");
  };

  // =========================================================
  // CONFIRM PAYMENT
  // =========================================================

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    if (!paymentMethod) {
      setPaymentError(
        "Please select a payment method."
      );
      return;
    }

    /*
     * Extra protection:
     * Do not allow a payment method that
     * has been disabled in Restaurant Settings.
     */

    if (
      paymentMethod === "CASH" &&
      !enabledPaymentMethods.cash
    ) {
      setPaymentError(
        "Cash payment is currently disabled."
      );
      return;
    }

    if (
      paymentMethod === "CARD" &&
      !enabledPaymentMethods.card
    ) {
      setPaymentError(
        "Card payment is currently disabled."
      );
      return;
    }

    if (
      paymentMethod === "UPI" &&
      !enabledPaymentMethods.upi
    ) {
      setPaymentError(
        "UPI payment is currently disabled."
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError("");

      const response = await fetch(
        `http://localhost:5000/api/cashier/orders/${selectedOrder._id}/pay`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            paymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Payment failed."
        );
      }

      // ------------------------------------------
      // PAYMENT SUCCESS DATA
      // ------------------------------------------

      setPaymentSuccess({
        amount: Number(
          selectedOrder.total || 0
        ),

        paymentMethod,

        orderNumber:
          selectedOrder.orderNumber,

        tableNumber:
          selectedOrder.tableNumber,
      });

      // ------------------------------------------
      // RECEIPT DATA
      // ------------------------------------------

      setReceiptData({
        order: {
          ...selectedOrder,
        },

        paymentMethod,

        paidAt:
          data.order?.paidAt ||
          new Date().toISOString(),
      });

      setShowReceipt(false);

      // ------------------------------------------
      // CLOSE PAYMENT MODAL
      // ------------------------------------------

      setSelectedOrder(null);
      setPaymentMethod("");

      // ------------------------------------------
      // REFRESH ORDERS
      // ------------------------------------------

      await loadOrders();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setPaymentError(
        error.message ||
          "Unable to complete payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========================================================
  // CLOSE SUCCESS POPUP
  // =========================================================

  const handleCloseSuccess = () => {
    setPaymentSuccess(null);
  };

  // =========================================================
  // TOTAL PENDING
  // =========================================================

  const totalPendingAmount =
    orders.reduce(
      (sum, order) =>
        sum +
        Number(order.total || 0),
      0
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="cashier-app">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="cashier-sidebar">

        {/* BRANDING */}

        <div className="cashier-branding">

          <div className="cashier-brand-logo">

            {restaurantLogo ? (
              <img
                src={restaurantLogo}
                alt={restaurantName}
              />
            ) : (
              "🍽"
            )}

          </div>

          <div className="cashier-brand-name">
            <strong>
              {restaurantName}
            </strong>
          </div>

        </div>


        {/* NAVIGATION */}

        <div className="cashier-sidebar-section">

          <span className="cashier-sidebar-title">
            CASHIER
          </span>


          {/* DASHBOARD */}

          <button
            className="cashier-nav-item active"
          >
            <span className="nav-icon">
              ▣
            </span>

            Dashboard
          </button>


          {/* REFRESH ORDERS */}

          <button
            className="cashier-nav-item"
            onClick={refreshCashierData}
            disabled={
              loading ||
              paymentSettingsLoading
            }
          >
            <span className="nav-icon">
              ↻
            </span>

            Refresh Orders
          </button>


          {/* PAYMENT HISTORY */}

          <button
            className="cashier-nav-item"
            onClick={onPaymentHistory}
          >
            <span className="nav-icon">
              ₹
            </span>

            Payment History
          </button>


          {/* TAX CONFIGURATION */}

          <button
            className="cashier-nav-item"
            onClick={onTaxConfiguration}
          >
            <span className="nav-icon">
              %
            </span>

            Tax Configuration
          </button>

        </div>


        {/* USER */}

        <div className="cashier-sidebar-section cashier-sidebar-bottom">

          <div className="cashier-user-card">

            <div className="cashier-user-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "C"}
            </div>

            <div className="cashier-user-info">

              <strong>
                {user?.name || "Cashier"}
              </strong>

              <span>
                Cashier
              </span>

            </div>

            <span className="cashier-online-dot"></span>

          </div>


          <button
            className="cashier-logout"
            onClick={onLogout}
          >
            <span>
              ↪
            </span>

            Logout
          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN AREA
      ================================================= */}

      <main className="cashier-main">

        {/* TOP BAR */}

        <header className="cashier-topbar">

          <div>

            <div className="cashier-breadcrumb">
              POS /{" "}
              <strong>
                Cashier
              </strong>
            </div>

            <h1>
              Cashier Dashboard
            </h1>

            <p>
              Manage payments and complete
              customer orders.
            </p>

          </div>


          <div className="cashier-topbar-right">

            <div className="cashier-status">

              <span></span>

              System Online

            </div>


            <button
              className="cashier-refresh"
              onClick={
                refreshCashierData
              }
              disabled={
                loading ||
                paymentSettingsLoading
              }
            >
              <span>
                ↻
              </span>

              Refresh
            </button>

          </div>

        </header>


        {/* =================================================
            KPI CARDS
        ================================================= */}

        <section className="cashier-kpis">

          <div className="cashier-kpi-card">

            <div className="cashier-kpi-icon pending">
              ₹
            </div>

            <div className="cashier-kpi-content">

              <span>
                Pending Orders
              </span>

              <strong>
                {orders.length}
              </strong>

              <small>
                Waiting for payment
              </small>

            </div>

          </div>


          <div className="cashier-kpi-card">

            <div className="cashier-kpi-icon amount">
              ₹
            </div>

            <div className="cashier-kpi-content">

              <span>
                Amount Pending
              </span>

              <strong>
                ₹
                {totalPendingAmount.toFixed(
                  2
                )}
              </strong>

              <small>
                To be collected
              </small>

            </div>

          </div>


          <div className="cashier-kpi-card">

            <div className="cashier-kpi-icon ready">
              ✓
            </div>

            <div className="cashier-kpi-content">

              <span>
                Kitchen Status
              </span>

              <strong>
                Ready
              </strong>

              <small>
                Orders available for billing
              </small>

            </div>

          </div>

        </section>


        {/* =================================================
            ORDERS
        ================================================= */}

        <section className="cashier-orders-section">

          <div className="cashier-section-heading">

            <div>

              <span className="cashier-section-label">
                PAYMENT QUEUE
              </span>

              <h2>
                Orders Ready for Payment
              </h2>

              <p>
                Review the bill and collect
                payment from the customer.
              </p>

            </div>


            <div className="cashier-order-count">

              {orders.length}

              <span>
                orders
              </span>

            </div>

          </div>


          {/* LOADING */}

          {loading && (
            <div className="cashier-state-card">

              <div className="cashier-spinner"></div>

              <span>
                Loading payment queue...
              </span>

            </div>
          )}


          {/* ERROR */}

          {!loading &&
            error && (
              <div className="cashier-state-card error">

                <div className="state-icon">
                  !
                </div>

                <strong>
                  Unable to load orders
                </strong>

                <span>
                  {error}
                </span>

                <button
                  onClick={
                    refreshCashierData
                  }
                >
                  Try Again
                </button>

              </div>
            )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            orders.length === 0 && (
              <div className="cashier-empty-state">

                <div className="cashier-empty-icon">
                  ✓
                </div>

                <h3>
                  Payment queue is clear
                </h3>

                <p>
                  There are currently no
                  orders waiting for payment.
                </p>

                <button
                  onClick={
                    refreshCashierData
                  }
                  className="cashier-empty-refresh"
                >
                  ↻ Check for New Orders
                </button>

              </div>
            )}


          {/* ORDERS */}

          {!loading &&
            !error &&
            orders.length > 0 && (
              <div className="cashier-orders">

                {orders.map((order) => (

                  <article
                    className="cashier-order"
                    key={order._id}
                  >

                    {/* ORDER TOP */}

                    <div className="cashier-order-top">

                      <div className="cashier-order-identity">

                        <div className="cashier-table-badge">
                          T
                          {order.tableNumber}
                        </div>

                        <div>

                          <span>
                            ORDER
                          </span>

                          <h3>
                            {order.orderNumber}
                          </h3>

                        </div>

                      </div>


                      <div className="cashier-ready-status">

                        <span></span>

                        READY

                      </div>

                    </div>


                    {/* ORDER ITEMS */}

                    <div className="cashier-order-items">

                      <div className="cashier-items-heading">

                        <span>
                          ITEM
                        </span>

                        <span>
                          QTY
                        </span>

                        <span>
                          AMOUNT
                        </span>

                      </div>


                      {order.items.map(
                        (item, index) => (

                          <div
                            className="cashier-order-item"
                            key={`${item.menuItemId}-${index}`}
                          >

                            <div className="cashier-item-name">

                              <strong>
                                {item.name}
                              </strong>

                              <span>
                                {item.category}
                              </span>

                            </div>


                            <span className="cashier-item-qty">
                              {item.quantity}
                            </span>


                            <strong className="cashier-item-price">
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


                    {/* ORDER TOTAL */}

                    <div className="cashier-order-bottom">

                      <div className="cashier-total-label">

                        <span>
                          Total Amount
                        </span>

                        <small>
                          {order.items.length}{" "}
                          item
                          {order.items.length !==
                          1
                            ? "s"
                            : ""}
                        </small>

                      </div>


                      <strong className="cashier-total">
                        ₹
                        {Number(
                          order.total || 0
                        ).toFixed(2)}
                      </strong>

                    </div>


                    {/* ACTION */}

                    <button
                      className="cashier-collect-button"
                      onClick={() =>
                        handleViewBill(order)
                      }
                    >

                      <span>
                        VIEW & COLLECT PAYMENT
                      </span>

                      <span className="collect-arrow">
                        →
                      </span>

                    </button>

                  </article>

                ))}

              </div>
            )}

        </section>

      </main>


      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      {selectedOrder && (
        <div className="cashier-modal-overlay">

          <div className="cashier-payment-modal">

            {/* HEADER */}

            <div className="payment-modal-header">

              <div>

                <span className="payment-modal-label">
                  PAYMENT
                </span>

                <h2>
                  Table{" "}
                  {selectedOrder.tableNumber}
                </h2>

                <p>
                  {selectedOrder.orderNumber}
                </p>

              </div>


              <button
                className="payment-close"
                onClick={
                  handleCloseBill
                }
                disabled={
                  paymentLoading
                }
              >
                ×
              </button>

            </div>


            {/* BILL */}

            <div className="payment-bill">

              <div className="payment-bill-heading">

                <span>
                  ORDER SUMMARY
                </span>

                <span>
                  AMOUNT
                </span>

              </div>


              {selectedOrder.items.map(
                (item, index) => (

                  <div
                    className="payment-bill-item"
                    key={`${item.menuItemId}-${index}`}
                  >

                    <div>

                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        ₹
                        {Number(
                          item.price || 0
                        ).toFixed(2)}

                        {" × "}

                        {item.quantity}
                      </span>

                    </div>


                    <strong>
                      ₹
                      {Number(
                        item.itemTotal || 0
                      ).toFixed(2)}
                    </strong>

                  </div>

                )
              )}


              <div className="payment-total">

                <span>
                  Amount Due
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedOrder.total || 0
                  ).toFixed(2)}
                </strong>

              </div>

            </div>


            {/* =================================================
                PAYMENT METHODS
            ================================================= */}

            <div className="payment-method-section">

              <span className="payment-method-label">
                SELECT PAYMENT METHOD
              </span>


              <div
                className={`payment-method-grid ${
                  paymentSettingsLoading
                    ? "payment-methods-loading"
                    : ""
                }`}
              >

                {paymentSettingsLoading ? (

                  <div className="payment-settings-loading">
                    Loading payment methods...
                  </div>

                ) : (

                  <>

                    {/* CASH */}

                    {enabledPaymentMethods.cash && (
                      <button
                        type="button"
                        className={`payment-method-card ${
                          paymentMethod ===
                          "CASH"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setPaymentMethod(
                            "CASH"
                          )
                        }
                        disabled={
                          paymentLoading
                        }
                      >

                        <span className="payment-icon">
                          💵
                        </span>

                        <strong>
                          Cash
                        </strong>

                        <small>
                          Cash payment
                        </small>

                      </button>
                    )}


                    {/* CARD */}

                    {enabledPaymentMethods.card && (
                      <button
                        type="button"
                        className={`payment-method-card ${
                          paymentMethod ===
                          "CARD"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setPaymentMethod(
                            "CARD"
                          )
                        }
                        disabled={
                          paymentLoading
                        }
                      >

                        <span className="payment-icon">
                          💳
                        </span>

                        <strong>
                          Card
                        </strong>

                        <small>
                          Debit / Credit
                        </small>

                      </button>
                    )}


                    {/* UPI */}

                    {enabledPaymentMethods.upi && (
                      <button
                        type="button"
                        className={`payment-method-card ${
                          paymentMethod ===
                          "UPI"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setPaymentMethod(
                            "UPI"
                          )
                        }
                        disabled={
                          paymentLoading
                        }
                      >

                        <span className="payment-icon">
                          📱
                        </span>

                        <strong>
                          UPI
                        </strong>

                        <small>
                          Scan & Pay
                        </small>

                      </button>
                    )}

                  </>

                )}

              </div>

            </div>


            {/* PAYMENT ERROR */}

            {paymentError && (
              <div className="payment-error">

                <span>
                  !
                </span>

                {paymentError}

              </div>
            )}


            {/* ACTIONS */}

            <div className="payment-actions">

              <button
                className="payment-cancel"
                onClick={
                  handleCloseBill
                }
                disabled={
                  paymentLoading
                }
              >
                Cancel
              </button>


              <button
                className="payment-confirm"
                onClick={
                  handleConfirmPayment
                }
                disabled={
                  paymentLoading ||
                  paymentSettingsLoading ||
                  !paymentMethod
                }
              >
                {paymentLoading
                  ? "Processing..."
                  : `COLLECT ₹${Number(
                      selectedOrder.total ||
                        0
                    ).toFixed(2)}`}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          PAYMENT SUCCESS MODAL
      ================================================= */}

      {paymentSuccess && (
        <div className="cashier-success-overlay">

          <div className="cashier-success-modal">

            {/* SUCCESS ICON */}

            <div className="cashier-success-icon">

              <div className="cashier-success-icon-inner">
                ✓
              </div>

            </div>


            {/* TITLE */}

            <h2>
              Payment Successful
            </h2>

            <p className="cashier-success-subtitle">
              Payment has been recorded
              successfully
            </p>


            {/* AMOUNT */}

            <div className="cashier-success-amount">
              ₹
              {paymentSuccess.amount.toFixed(
                2
              )}
            </div>


            {/* PAYMENT DETAILS */}

            <div className="cashier-success-details">

              <div className="cashier-success-detail">

                <span>
                  Payment Method
                </span>

                <strong>
                  {
                    paymentSuccess.paymentMethod
                  }
                </strong>

              </div>


              <div className="cashier-success-detail">

                <span>
                  Order
                </span>

                <strong>
                  {
                    paymentSuccess.orderNumber
                  }
                </strong>

              </div>


              <div className="cashier-success-detail">

                <span>
                  Table
                </span>

                <strong>
                  Table{" "}
                  {
                    paymentSuccess.tableNumber
                  }
                </strong>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="payment-success-actions">

              <button
                type="button"
                className="payment-success-print"
                onClick={() => {
                  setPaymentSuccess(
                    null
                  );

                  setShowReceipt(true);
                }}
              >
                🖨 PRINT RECEIPT
              </button>


              <button
                type="button"
                className="payment-success-done"
                onClick={() => {
                  setPaymentSuccess(
                    null
                  );

                  setShowReceipt(false);
                  setReceiptData(null);
                }}
              >
                DONE
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          RECEIPT
      ================================================= */}

      {receiptData && !showReceipt && (
        <Receipt
          order={receiptData.order}
          paymentMethod={
            receiptData.paymentMethod
          }
          paidAt={
            receiptData.paidAt
          }
          onClose={() =>
            setReceiptData(null)
          }
        />
      )}


      {showReceipt && receiptData && (
        <Receipt
          order={receiptData.order}
          paymentMethod={
            receiptData.paymentMethod
          }
          paidAt={
            receiptData.paidAt
          }
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }}
        />
      )}

    </div>
  );
}

export default CashierDashboard;