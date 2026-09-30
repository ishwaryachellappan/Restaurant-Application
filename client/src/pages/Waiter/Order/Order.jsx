import { useState } from "react";
import "./Order.css";

const menuItems = [
  {
    id: 1,
    name: "Paneer Tikka",
    category: "Starters",
    price: 220,
  },
  {
    id: 2,
    name: "Chicken 65",
    category: "Starters",
    price: 280,
  },
  {
    id: 3,
    name: "Veg Manchurian",
    category: "Starters",
    price: 200,
  },
  {
    id: 4,
    name: "Butter Chicken",
    category: "Main Course",
    price: 320,
  },
  {
    id: 5,
    name: "Paneer Butter Masala",
    category: "Main Course",
    price: 280,
  },
  {
    id: 6,
    name: "Chicken Biryani",
    category: "Main Course",
    price: 300,
  },
  {
    id: 7,
    name: "Veg Biryani",
    category: "Main Course",
    price: 240,
  },
  {
    id: 8,
    name: "Butter Naan",
    category: "Breads",
    price: 60,
  },
  {
    id: 9,
    name: "Garlic Naan",
    category: "Breads",
    price: 80,
  },
  {
    id: 10,
    name: "Tandoori Roti",
    category: "Breads",
    price: 40,
  },
  {
    id: 11,
    name: "Fresh Lime Soda",
    category: "Drinks",
    price: 90,
  },
  {
    id: 12,
    name: "Fresh Lime Water",
    category: "Drinks",
    price: 70,
  },
  {
    id: 13,
    name: "Coke",
    category: "Drinks",
    price: 60,
  },
];

function Order({
  table,
  user,
  existingOrder,
  onBack,
}) {
  const [selectedCategory, setSelectedCategory] =
    useState("Starters");

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

  const categories = [
    "Starters",
    "Main Course",
    "Breads",
    "Drinks",
  ];

  const filteredItems = menuItems.filter(
    (item) => item.category === selectedCategory
  );

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
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

  const increaseQuantity = (itemId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === itemId
          ? {
            ...item,
            quantity: item.quantity + 1,
          }
          : item
      )
    );
  };

  const decreaseQuantity = (itemId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === itemId
            ? {
              ...item,
              quantity: item.quantity - 1,
            }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (itemId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== itemId)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSendToKitchen = async () => {
  if (cart.length === 0) {
    alert("Please add at least one item to the order.");
    return;
  }

  try {
    const url = existingOrder
      ? `http://localhost:5000/api/orders/${existingOrder._id}`
      : "http://localhost:5000/api/orders";

    const method = existingOrder
      ? "PATCH"
      : "POST";

    const response = await fetch(url, {
      method,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        existingOrder
          ? {
              items: cart.map((item) => ({
                menuItemId: item.id,
                name: item.name,
                category: item.category,
                price: item.price,
                quantity: item.quantity,
              })),
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
            }
      ),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to save order."
      );
    }

    if (existingOrder) {
      alert(
        `${existingOrder.orderNumber} updated successfully.`
      );
    } else {
      alert(
        `Order ${data.order.orderNumber} sent to kitchen successfully.`
      );
    }

    setCart([]);

  } catch (error) {
    console.error("Save order error:", error);

    alert(
      error.message ||
        "Unable to save the order."
    );
  }
};

  return (
    <div className="order-page">

      {/* HEADER */}

      <header className="order-header">

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
              Table {table.tableNumber}
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
          className={`order-table-status ${existingOrder ? "occupied" : "available"
            }`}
        >
          <span></span>

          {existingOrder
            ? "OCCUPIED"
            : "AVAILABLE"}
        </div>

      </header>

      {/* MAIN */}

      <main className="order-main">

        {/* LEFT SIDE */}

        <section className="menu-section">

          <div className="section-heading">
            <h2>Menu</h2>
            <p>Select items for the customer</p>
          </div>

          {/* CATEGORIES */}

          <div className="category-list">

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}

          </div>

          {/* MENU ITEMS */}

          <div className="menu-grid">

            {filteredItems.map((item) => (
              <div
                className="menu-item"
                key={item.id}
              >

                <div className="menu-item-info">

                  <h3>
                    {item.name}
                  </h3>

                  <span>
                    ₹{item.price.toFixed(2)}
                  </span>

                </div>

                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => addToCart(item)}
                >
                  + Add
                </button>

              </div>
            ))}

          </div>

        </section>

        {/* RIGHT SIDE - CART */}

        <aside className="cart-section">

          <div className="cart-header">

            <div>
              <h2>
                {existingOrder
                  ? "Existing Order"
                  : "Current Order"}
              </h2>

              <p>
                Table {table.tableNumber}

                {existingOrder && (
                  <>
                    {" · "}
                    {existingOrder.orderNumber}
                  </>
                )}
              </p>
            </div>

            <div className="cart-count">
              {cart.reduce(
                (sum, item) =>
                  sum + item.quantity,
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

              cart.map((item) => (

                <div
                  className="cart-item"
                  key={item.id}
                >

                  <div className="cart-item-info">

                    <h3>
                      {item.name}
                    </h3>

                    <span>
                      ₹{item.price.toFixed(2)}
                    </span>

                  </div>

                  <div className="quantity-controls">

                    <button
                      type="button"
                      onClick={() =>
                        decreaseQuantity(item.id)
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
                        increaseQuantity(item.id)
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
                      removeItem(item.id)
                    }
                  >
                    ×
                  </button>

                </div>

              ))

            )}

          </div>

          {/* TOTAL */}

          <div className="cart-footer">

            <div className="total-row">

              <span>
                Total
              </span>

              <strong>
                ₹{total.toFixed(2)}
              </strong>

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

    </div>
  );
}

export default Order;