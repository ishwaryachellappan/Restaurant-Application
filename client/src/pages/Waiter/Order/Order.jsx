import { useEffect, useState } from "react";
import "./Order.css";
import { useRestaurantBranding } from "../../../context/RestaurantBrandingContext";

function Order({
  table,
  user,
  existingOrder,
  onBack,
}) {
  // ------------------------------------------
  // MENU
  // ------------------------------------------

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const { restaurantName, restaurantLogo } = useRestaurantBranding();
  // ------------------------------------------
  // SUCCESS POPUP
  // ------------------------------------------

  const [showSuccessPopup, setShowSuccessPopup] =
    useState(false);

  const [successDetails, setSuccessDetails] = useState({
    orderNumber: "",
    tableNumber: "",
    itemCount: 0,
    isUpdate: false,
  });

  // ------------------------------------------
  // CATEGORY
  // ------------------------------------------

  const [selectedCategory, setSelectedCategory] =
    useState("");

  // ------------------------------------------
  // CART
  // ------------------------------------------

  const [cart, setCart] = useState(() => {
    if (!existingOrder?.items) {
      return [];
    }

    return existingOrder.items.map((item) => ({
      id: item.menuItemId,
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
    }));
  });

  // ------------------------------------------
  // TAX
  // ------------------------------------------

  const [taxRate, setTaxRate] = useState(0);

  // ------------------------------------------
  // LOAD AVAILABLE MENU
  // ------------------------------------------

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setMenuLoading(true);
        setMenuError("");

        const response = await fetch(
          "http://localhost:5000/api/menu/available"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load menu."
          );
        }

        setMenuItems(
          (data.items || []).map((item) => ({
            ...item,
            id: item._id,
          }))
        );
      } catch (error) {
        console.error(
          "Load menu error:",
          error
        );

        setMenuError(
          error.message ||
          "Unable to load menu."
        );
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenu();
  }, []);


  useEffect(() => {
    const loadTaxRate = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/tax/today"
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setTaxRate(
            Number(data.taxRate || 0)
          );
        }
      } catch (error) {
        console.error(
          "Load tax rate error:",
          error
        );

        setTaxRate(0);
      }
    };

    loadTaxRate();
  }, []);


  // ------------------------------------------
  // CATEGORIES
  // ------------------------------------------

  const categories = [
    ...new Set(
      menuItems.map(
        (item) => item.category
      )
    ),
  ];

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.includes(
        selectedCategory
      )
    ) {
      setSelectedCategory(
        categories[0]
      );
    }
  }, [
    categories,
    selectedCategory,
  ]);

  const filteredItems =
    menuItems.filter(
      (item) =>
        item.category ===
        selectedCategory
    );

  // ------------------------------------------
  // ADD ITEM
  // ------------------------------------------

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (cartItem) =>
            cartItem.id === item.id
        );

      if (existingItem) {
        return currentCart.map(
          (cartItem) =>
            cartItem.id === item.id
              ? {
                ...cartItem,
                quantity:
                  cartItem.quantity + 1,
              }
              : cartItem
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  // ------------------------------------------
  // INCREASE QUANTITY
  // ------------------------------------------

  const increaseQuantity = (
    itemId
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === itemId
          ? {
            ...item,
            quantity:
              item.quantity + 1,
          }
          : item
      )
    );
  };

  // ------------------------------------------
  // DECREASE QUANTITY
  // ------------------------------------------

  const decreaseQuantity = (
    itemId
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === itemId
            ? {
              ...item,
              quantity:
                item.quantity - 1,
            }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };

  // ------------------------------------------
  // REMOVE ITEM
  // ------------------------------------------

  const removeItem = (itemId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== itemId
      )
    );
  };

  // ------------------------------------------
  // TOTAL
  // ------------------------------------------

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const discountType = "NONE";
  const discountValue = 0;
  const discountAmount = 0;

  const taxAmount =
    (subtotal - discountAmount) *
    taxRate /
    100;

  const total =
    subtotal -
    discountAmount +
    taxAmount;

  // ------------------------------------------
  // SEND TO KITCHEN
  // ------------------------------------------

  const handleSendToKitchen =
    async () => {
      if (cart.length === 0) {
        alert(
          "Please add at least one item to the order."
        );
        return;
      }

      try {
        const url = existingOrder
          ? `http://localhost:5000/api/orders/${existingOrder._id}`
          : "http://localhost:5000/api/orders";

        const method =
          existingOrder
            ? "PATCH"
            : "POST";

        const response =
          await fetch(url, {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              existingOrder
                ? {
                  items:
                    cart.map(
                      (item) => ({
                        menuItemId:
                          item.id,
                        name:
                          item.name,
                        category:
                          item.category,
                        price:
                          item.price,
                        quantity:
                          item.quantity,
                      })
                    ),
                }
                : {
                  tableId: table._id,
                  tableNumber: table.tableNumber,

                  waiterId: user.id,
                  waiterName: user.name,

                  items: cart.map((item) => ({
                    menuItemId: item.id,
                    name: item.name,
                    category: item.category,
                    price: item.price,
                    quantity: item.quantity,
                  })),

                  discountType,
                  discountValue,
                  discountAmount,

                  taxRate,
                  taxAmount,

                  subtotal,
                  total,
                }
            ),
          });

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            "Unable to save order."
          );
        }

        // ----------------------------------
        // SUCCESS POPUP
        // ----------------------------------

        const savedOrder =
          data.order;

        const totalItems =
          cart.reduce(
            (sum, item) =>
              sum +
              item.quantity,
            0
          );

        setSuccessDetails({
          orderNumber:
            savedOrder?.orderNumber ||
            existingOrder?.orderNumber ||
            "—",

          tableNumber:
            table.tableNumber,

          itemCount:
            totalItems,

          isUpdate:
            Boolean(existingOrder),
        });

        setShowSuccessPopup(
          true
        );

        setCart([]);

      } catch (error) {
        console.error(
          "Save order error:",
          error
        );

        alert(
          error.message ||
          "Unable to save the order."
        );
      }
    };

  // ------------------------------------------
  // CLOSE SUCCESS POPUP
  // ------------------------------------------

  const handleSuccessDone =
    () => {
      setShowSuccessPopup(
        false
      );

      onBack();
    };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="order-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="order-header">
        <div className="order-branding">
          <div className="order-brand-logo">
            {restaurantLogo ? (
              <img src={restaurantLogo} alt={restaurantName} />
            ) : (
              "🍽"
            )}
          </div>

          <strong>{restaurantName}</strong>
        </div>

        <div className="order-header-left">

          <button
            type="button"
            className="order-back-button"
            onClick={onBack}
          >
            ← Tables
          </button>

          <div>

            <h1>
              Table{" "}
              {table.tableNumber}
            </h1>

            <p>
              {table.capacity} Seats ·{" "}
              {existingOrder
                ? existingOrder.orderNumber
                : "New Order"}
            </p>

          </div>

        </div>

        <div
          className={`order-table-status ${existingOrder
              ? "occupied"
              : "available"
            }`}
        >

          <span></span>

          {existingOrder
            ? "OCCUPIED"
            : "AVAILABLE"}

        </div>

      </header>

      {/* =====================================
          MAIN
      ====================================== */}

      <main className="order-main">

        {/* ===================================
            LEFT SIDE - MENU
        ==================================== */}

        <section className="menu-section">

          <div className="section-heading">

            <h2>
              Menu
            </h2>

            <p>
              Select items for the customer
            </p>

          </div>

          {/* CATEGORIES */}

          <div className="category-list">

            {categories.map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    selectedCategory ===
                      category
                      ? "category-button active"
                      : "category-button"
                  }
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                >
                  {category}
                </button>
              )
            )}

          </div>

          {/* MENU ITEMS */}

          <div className="menu-grid">

            {menuLoading ? (

              <div className="empty-cart">

                <h3>
                  Loading menu...
                </h3>

              </div>

            ) : menuError ? (

              <div className="empty-cart">

                <h3>
                  Unable to load menu
                </h3>

                <p>
                  {menuError}
                </p>

              </div>

            ) : filteredItems.length ===
              0 ? (

              <div className="empty-cart">

                <h3>
                  No items available
                </h3>

                <p>
                  No available items in
                  this category.
                </p>

              </div>

            ) : (

              filteredItems.map(
                (item) => (

                  <div
                    className="menu-item"
                    key={item.id}
                  >

                    <div className="menu-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <span>
                        ₹
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </span>

                    </div>

                    <button
                      type="button"
                      className="add-item-button"
                      onClick={() =>
                        addToCart(item)
                      }
                    >
                      + Add
                    </button>

                  </div>

                )
              )

            )}

          </div>

        </section>

        {/* ===================================
            RIGHT SIDE - CART
        ==================================== */}

        <aside className="cart-section">

          <div className="cart-header">

            <div>

              <h2>
                {existingOrder
                  ? "Existing Order"
                  : "Current Order"}
              </h2>

              <p>

                Table{" "}
                {table.tableNumber}

                {existingOrder && (
                  <>
                    {" · "}
                    {
                      existingOrder.orderNumber
                    }
                  </>
                )}

              </p>

            </div>

            <div className="cart-count">

              {cart.reduce(
                (sum, item) =>
                  sum +
                  item.quantity,
                0
              )}

            </div>

          </div>

          {/* CART ITEMS */}

          <div className="cart-items">

            {cart.length === 0 ? (

              <div className="empty-cart">

                <div className="empty-cart-icon">
                  🧾
                </div>

                <h3>
                  No items yet
                </h3>

                <p>
                  Add items from the menu.
                </p>

              </div>

            ) : (

              cart.map(
                (item) => (

                  <div
                    className="cart-item"
                    key={item.id}
                  >

                    <div className="cart-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <span>
                        ₹
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </span>

                    </div>

                    <div className="quantity-controls">

                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(
                            item.id
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(
                            item.id
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                    <div className="cart-item-total">

                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}

                    </div>

                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                    >
                      ×
                    </button>

                  </div>

                )
              )

            )}

          </div>

          {/* TOTAL */}

          <div className="cart-footer">

            <div className="order-price-summary">

              <div className="price-summary-row">
                <span>Subtotal</span>

                <strong>
                  ₹{subtotal.toFixed(2)}
                </strong>
              </div>

              <div className="price-summary-row">
                <span>Discount</span>

                <strong>
                  - ₹{discountAmount.toFixed(2)}
                </strong>
              </div>

              <div className="price-summary-row">
                <span>
                  Tax {taxRate > 0 ? `(${taxRate}%)` : ""}
                </span>

                <strong>
                  ₹{taxAmount.toFixed(2)}
                </strong>
              </div>

              <div className="price-summary-divider"></div>

              <div className="price-summary-total">
                <span>Grand Total</span>

                <strong>
                  ₹{total.toFixed(2)}
                </strong>
              </div>

            </div>

            <button
              type="button"
              className="send-kitchen-button"
              onClick={handleSendToKitchen}
            >
              {existingOrder
                ? "Update Order"
                : "Send to Kitchen"}
            </button>

          </div>

        </aside>

      </main>

      {/* =====================================
          ORDER SUCCESS POPUP
      ====================================== */}

      {showSuccessPopup && (

        <div className="order-success-overlay">

          <div className="order-success-modal">

            {/* FOOD ICON + CHECK */}

            <div className="order-success-icon-wrapper">

              <div className="order-success-icon">
                🍽️

                <span className="order-success-check">
                  ✓
                </span>

              </div>

            </div>

            {/* TITLE */}

            <h2>
              {successDetails.isUpdate
                ? "Order Updated"
                : "Order Sent to Kitchen"}
            </h2>

            <p className="order-success-subtitle">

              {successDetails.isUpdate
                ? "The order has been updated successfully"
                : "The order has been sent to the kitchen successfully"}

            </p>

            {/* ORDER AMOUNT / DETAILS */}

            <div className="order-success-number">

              {successDetails.orderNumber}

            </div>

            <div className="order-success-details">

              <div className="order-success-row">

                <span>
                  Table
                </span>

                <strong>
                  Table{" "}
                  {successDetails.tableNumber}
                </strong>

              </div>

              <div className="order-success-row">

                <span>
                  Items
                </span>

                <strong>
                  {successDetails.itemCount}{" "}
                  {successDetails.itemCount ===
                    1
                    ? "Item"
                    : "Items"}
                </strong>

              </div>

            </div>

            {/* DONE */}

            <button
              type="button"
              className="order-success-done"
              onClick={
                handleSuccessDone
              }
            >
              DONE
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Order;