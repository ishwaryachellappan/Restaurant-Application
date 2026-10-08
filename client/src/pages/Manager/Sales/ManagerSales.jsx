import { useEffect, useMemo, useRef, useState } from "react";
import "./ManagerSales.css";
import { useRestaurantBranding } from "../../../context/RestaurantBrandingContext";

function ManagerSales({
  user,
  onBack,
  onOrders,
  onLogout,
  embedded = false,
}) {

    const { restaurantName, restaurantLogo } =
    useRestaurantBranding();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");

  const dateInputRef = useRef(null);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load sales data."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(
        "Sales data error:",
        error
      );

      setError(
        "Unable to load sales data. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
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

  /*
   * Sales are based on payment date,
   * not order creation date.
   */
  const paidOrders = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.status === "COMPLETED"
      )
      .filter((order) => {
        const paymentDate =
          order.paidAt ||
          order.createdAt;

        if (!selectedDate) {
          return false;
        }

        return (
          getLocalDateString(
            paymentDate
          ) === selectedDate
        );
      })
      .sort(
        (a, b) =>
          new Date(
            b.paidAt ||
              b.createdAt
          ) -
          new Date(
            a.paidAt ||
              a.createdAt
          )
      );
  }, [
    orders,
    selectedDate,
  ]);

  const revenue = paidOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const orderCount =
    paidOrders.length;

  const averageOrder =
    orderCount > 0
      ? revenue / orderCount
      : 0;

  const cashOrders =
    paidOrders.filter(
      (order) =>
        order.paymentMethod === "CASH"
    );

  const cardOrders =
    paidOrders.filter(
      (order) =>
        order.paymentMethod === "CARD"
    );

  const upiOrders =
    paidOrders.filter(
      (order) =>
        order.paymentMethod === "UPI"
    );

  const cashTotal = cashOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const cardTotal = cardOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const upiTotal = upiOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const recordedPaymentTotal =
    cashTotal +
    cardTotal +
    upiTotal;

  const unrecordedPaymentTotal =
    revenue - recordedPaymentTotal;

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

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

  const displaySelectedDate = () => {
    if (dateFilter === "today") {
      return "Today";
    }

    if (dateFilter === "yesterday") {
      return "Yesterday";
    }

    if (customDate) {
      return new Date(
        `${customDate}T00:00:00`
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    }

    return "Select date";
  };

  const paymentPercentage = (amount) => {
    if (revenue <= 0) return 0;

    return Math.round(
      (amount / revenue) * 100
    );
  };

  return (
<div
  className={
    embedded
      ? "manager-sales-app manager-sales-embedded"
      : "manager-sales-app"
  }
>

      {/* SIDEBAR */}
{!embedded && (
      <aside className="manager-sales-sidebar">

        <div className="manager-sales-brand">

  <div className="manager-sales-brand-icon">
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

        <div className="manager-sales-nav">

          <span className="manager-sales-nav-title">
            MANAGEMENT
          </span>

          <button
            className="manager-sales-nav-item"
            onClick={onBack}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="manager-sales-nav-item"
            onClick={onOrders}
          >
            <span>▤</span>
            Orders
          </button>

          <button className="manager-sales-nav-item active">
            <span>₹</span>
            Sales & Reports
          </button>

        </div>

        <div className="manager-sales-sidebar-bottom">

          <div className="manager-sales-user">

            <div className="manager-sales-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "M"}
            </div>

            <div>
              <strong>
                {user?.name ||
                  "Restaurant Manager"}
              </strong>

              <span>
                Manager
              </span>
            </div>

            <i></i>

          </div>

          <button
            className="manager-sales-logout"
            onClick={onLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>
)}
      {/* MAIN */}

      <main className="manager-sales-main">

        <header className="manager-sales-header">

          <div>

            <div className="manager-sales-breadcrumb">
              POS / Management /{" "}
              <strong>
                Sales & Reports
              </strong>
            </div>

            <h1>
              Sales & Reports
            </h1>

            <p>
              Review revenue and payment activity.
            </p>

          </div>

          <div className="manager-sales-header-actions">

            <div className="manager-sales-online">
              <i></i>
              System Online
            </div>

            <button
              className="manager-sales-refresh"
              onClick={loadSales}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

        </header>

        {/* DATE FILTER */}

        <div className="manager-sales-date-filter">

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
              setDateFilter(
                "yesterday"
              );
              setCustomDate("");
            }}
          >
            Yesterday
          </button>

          <button
            type="button"
            className={`manager-sales-custom-date ${
              dateFilter === "custom"
                ? "active"
                : ""
            }`}
            onClick={() => {
              if (
                dateInputRef.current
              ) {
                if (
                  typeof dateInputRef
                    .current
                    .showPicker ===
                  "function"
                ) {
                  dateInputRef.current.showPicker();
                } else {
                  dateInputRef.current.click();
                }
              }
            }}
          >
            <span>
              📅
            </span>

            <span>
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
                const value =
                  event.target.value;

                if (!value) return;

                setCustomDate(value);
                setDateFilter("custom");
              }}
              className="manager-sales-hidden-date"
            />
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="manager-sales-error">
            {error}

            <button onClick={loadSales}>
              Try Again
            </button>
          </div>
        )}

        {/* KPI CARDS */}

        <section className="manager-sales-kpis">

          <div className="manager-sales-kpi">

            <div className="manager-sales-kpi-icon revenue">
              ₹
            </div>

            <div>
              <span>
                REVENUE
              </span>

              <strong>
                {formatMoney(revenue)}
              </strong>

              <small>
                Completed payments
              </small>
            </div>

          </div>

          <div className="manager-sales-kpi">

            <div className="manager-sales-kpi-icon orders">
              #
            </div>

            <div>
              <span>
                PAID ORDERS
              </span>

              <strong>
                {orderCount}
              </strong>

              <small>
                {displaySelectedDate()}
              </small>
            </div>

          </div>

          <div className="manager-sales-kpi">

            <div className="manager-sales-kpi-icon average">
              ₹
            </div>

            <div>
              <span>
                AVERAGE ORDER
              </span>

              <strong>
                {formatMoney(
                  averageOrder
                )}
              </strong>

              <small>
                Per paid order
              </small>
            </div>

          </div>

          <div className="manager-sales-kpi">

            <div className="manager-sales-kpi-icon paid">
              ✓
            </div>

            <div>
              <span>
                PAYMENT RECORDED
              </span>

              <strong>
                {formatMoney(
                  recordedPaymentTotal
                )}
              </strong>

              <small>
                Cash + Card + UPI
              </small>
            </div>

          </div>

        </section>

        {/* PAYMENT BREAKDOWN */}

        <section className="manager-sales-content-grid">

          <div className="manager-sales-card">

            <div className="manager-sales-card-header">

              <div>
                <span>
                  PAYMENTS
                </span>

                <h2>
                  Payment Breakdown
                </h2>
              </div>

              <strong>
                {formatMoney(revenue)}
              </strong>

            </div>

            <div className="manager-payment-list">

              {/* CASH */}

              <div className="manager-payment-row">

                <div className="manager-payment-label">

                  <div className="manager-payment-icon cash">
                    ₹
                  </div>

                  <div>
                    <strong>
                      Cash
                    </strong>

                    <span>
                      {cashOrders.length}{" "}
                      orders
                    </span>
                  </div>

                </div>

                <div className="manager-payment-value">

                  <strong>
                    {formatMoney(
                      cashTotal
                    )}
                  </strong>

                  <span>
                    {paymentPercentage(
                      cashTotal
                    )}
                    %
                  </span>

                </div>

                <div className="manager-payment-bar">
                  <div
                    style={{
                      width: `${paymentPercentage(
                        cashTotal
                      )}%`,
                    }}
                  ></div>
                </div>

              </div>

              {/* CARD */}

              <div className="manager-payment-row">

                <div className="manager-payment-label">

                  <div className="manager-payment-icon card">
                    ▣
                  </div>

                  <div>
                    <strong>
                      Card
                    </strong>

                    <span>
                      {cardOrders.length}{" "}
                      orders
                    </span>
                  </div>

                </div>

                <div className="manager-payment-value">

                  <strong>
                    {formatMoney(
                      cardTotal
                    )}
                  </strong>

                  <span>
                    {paymentPercentage(
                      cardTotal
                    )}
                    %
                  </span>

                </div>

                <div className="manager-payment-bar">
                  <div
                    style={{
                      width: `${paymentPercentage(
                        cardTotal
                      )}%`,
                    }}
                  ></div>
                </div>

              </div>

              {/* UPI */}

              <div className="manager-payment-row">

                <div className="manager-payment-label">

                  <div className="manager-payment-icon upi">
                    U
                  </div>

                  <div>
                    <strong>
                      UPI
                    </strong>

                    <span>
                      {upiOrders.length}{" "}
                      orders
                    </span>
                  </div>

                </div>

                <div className="manager-payment-value">

                  <strong>
                    {formatMoney(
                      upiTotal
                    )}
                  </strong>

                  <span>
                    {paymentPercentage(
                      upiTotal
                    )}
                    %
                  </span>

                </div>

                <div className="manager-payment-bar">
                  <div
                    style={{
                      width: `${paymentPercentage(
                        upiTotal
                      )}%`,
                    }}
                  ></div>
                </div>

              </div>

            </div>

            {unrecordedPaymentTotal >
              0 && (
              <div className="manager-unrecorded-payment">
                <span>
                  ⚠
                </span>

                <div>
                  <strong>
                    {formatMoney(
                      unrecordedPaymentTotal
                    )}{" "}
                    not assigned to a payment method
                  </strong>

                  <small>
                    This can happen for payments recorded before payment-method tracking was added.
                  </small>
                </div>
              </div>
            )}

          </div>

          {/* SALES SUMMARY */}

          <div className="manager-sales-card">

            <div className="manager-sales-card-header">

              <div>
                <span>
                  SUMMARY
                </span>

                <h2>
                  Sales Overview
                </h2>
              </div>

            </div>

            <div className="manager-sales-overview">

              <div>
                <span>
                  Gross Sales
                </span>

                <strong>
                  {formatMoney(
                    revenue
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Paid Orders
                </span>

                <strong>
                  {orderCount}
                </strong>
              </div>

              <div>
                <span>
                  Average Bill
                </span>

                <strong>
                  {formatMoney(
                    averageOrder
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Recorded Methods
                </span>

                <strong>
                  {
                    cashOrders.length +
                    cardOrders.length +
                    upiOrders.length
                  }
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* PAYMENT HISTORY */}

        <section className="manager-sales-history">

          <div className="manager-sales-history-header">

            <div>
              <span>
                TRANSACTIONS
              </span>

              <h2>
                Payment History
              </h2>

              <p>
                Completed payments for{" "}
                {displaySelectedDate()}.
              </p>
            </div>

            <strong>
              {paidOrders.length} payments
            </strong>

          </div>

          {loading ? (
            <div className="manager-sales-empty">
              Loading sales...
            </div>
          ) : paidOrders.length === 0 ? (
            <div className="manager-sales-empty">

              <div className="manager-sales-empty-icon">
                ✓
              </div>

              <strong>
                No payments found
              </strong>

              <span>
                There are no completed payments for this date.
              </span>

            </div>
          ) : (
            <div className="manager-sales-table">

              <div className="manager-sales-table-row manager-sales-table-header">

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
                  PAYMENT
                </span>

                <span>
                  AMOUNT
                </span>

                <span>
                  PAID AT
                </span>

              </div>

              {paidOrders.map(
                (order) => (
                  <div
                    className="manager-sales-table-row"
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

                    <span
                      className={`manager-payment-method ${
                        order.paymentMethod
                          ?.toLowerCase() ||
                        "unknown"
                      }`}
                    >
                      {order.paymentMethod ||
                        "Not recorded"}
                    </span>

                    <strong>
                      {formatMoney(
                        order.total
                      )}
                    </strong>

                    <span>
                      {formatDate(
                        order.paidAt ||
                          order.createdAt
                      )}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default ManagerSales;