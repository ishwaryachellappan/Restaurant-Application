import { useEffect, useMemo, useState } from "react";
import "./ManagerMenu.css";
import { useRestaurantBranding } from "../../../context/RestaurantBrandingContext";

function ManagerMenu({
  user,
  onBack,
  onOpenOrders,
  onOpenSales,
  onOpenStaff,
  onLogout,
  embedded = false,
}) {

    const { restaurantName, restaurantLogo } =
    useRestaurantBranding();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    foodType: "VEG",
    available: true,
  });

  // ==========================================
  // LOAD MENU
  // ==========================================

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/menu"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load menu."
        );
      }

      setItems(data.items || []);
    } catch (error) {
      console.error("Load menu error:", error);
      setError("Unable to load menu items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
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
  // FILTER ITEMS
  // ==========================================

  const filteredItems = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.name?.toLowerCase().includes(searchValue) ||
        item.category
          ?.toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        categoryFilter === "ALL" ||
        item.category === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "ALL" ||
        (availabilityFilter === "AVAILABLE" &&
          item.available === true) ||
        (availabilityFilter === "UNAVAILABLE" &&
          item.available === false);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [
    items,
    search,
    categoryFilter,
    availabilityFilter,
  ]);

  // ==========================================
  // OPEN ADD
  // ==========================================

  const openAddModal = () => {
    setEditingItem(null);

    setForm({
      name: "",
      category: "",
      price: "",
      description: "",
      foodType: "VEG",
      available: true,
    });

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEditModal = (item) => {
    setEditingItem(item);

    setForm({
      name: item.name || "",
      category: item.category || "",
      price: item.price ?? "",
      description: item.description || "",
      foodType: item.foodType || "VEG",
      available: item.available !== false,
    });

    setShowModal(true);
  };

  // ==========================================
  // SAVE ITEM
  // ==========================================

  const saveItem = async () => {
    if (!form.name.trim()) {
      alert("Please enter the item name.");
      return;
    }

    if (!form.category.trim()) {
      alert("Please enter the category.");
      return;
    }

    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        foodType: form.foodType,
        available: form.available,
      };

      const url = editingItem
        ? `http://localhost:5000/api/menu/${editingItem._id}`
        : "http://localhost:5000/api/menu";

      const response = await fetch(url, {
        method: editingItem ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save menu item."
        );
      }

      if (editingItem) {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item._id === editingItem._id
              ? data.item
              : item
          )
        );
      } else {
        setItems((currentItems) => [
          ...currentItems,
          data.item,
        ]);
      }

      setShowModal(false);
    } catch (error) {
      console.error("Save menu error:", error);

      alert(
        error.message ||
          "Unable to save menu item."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TOGGLE AVAILABILITY
  // ==========================================

  const toggleAvailability = async (item) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/menu/${item._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            available: !item.available,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update availability."
        );
      }

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem._id === item._id
            ? data.item
            : currentItem
        )
      );
    } catch (error) {
      console.error(
        "Availability update error:",
        error
      );

      alert(
        error.message ||
          "Unable to update availability."
      );
    }
  };

  // ==========================================
  // DELETE ITEM
  // ==========================================

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}" from the menu?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/menu/${item._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete menu item."
        );
      }

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem._id !== item._id
        )
      );
    } catch (error) {
      console.error(
        "Delete menu error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete menu item."
      );
    }
  };

  // ==========================================
  // COUNTS
  // ==========================================

  const totalItems = items.length;

  const availableItems = items.filter(
    (item) => item.available
  ).length;

  const unavailableItems = items.filter(
    (item) => !item.available
  ).length;

  // ==========================================
  // INITIAL
  // ==========================================

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="menu-page">

      {/* ========================================
          SIDEBAR
      ======================================== */}
{!embedded && (
      <aside className="menu-sidebar">

       <div className="menu-brand">
  <div className="menu-brand-icon">
    {restaurantLogo ? (
      <img
        src={restaurantLogo}
        alt={restaurantName}
      />
    ) : (
      "🍽️"
    )}
  </div>

  <div>
    <h2>{restaurantName}</h2>
  </div>
</div>

        <div className="menu-sidebar-title">
          MANAGEMENT
        </div>

        <button
          className="menu-nav-item"
          onClick={onBack}
          type="button"
        >
          <span>▦</span>
          Dashboard
        </button>

        <button
          className="menu-nav-item"
          onClick={onOpenOrders}
          type="button"
        >
          <span>▤</span>
          Orders
        </button>

        <button
          className="menu-nav-item"
          onClick={onOpenSales}
          type="button"
        >
          <span>₹</span>
          Sales & Reports
        </button>

        <button
          className="menu-nav-item"
          onClick={onOpenStaff}
          type="button"
        >
          <span>👥</span>
          Staff
        </button>

        <button
          className="menu-nav-item menu-nav-active"
          type="button"
        >
          <span>🍽️</span>
          Menu Management
        </button>

        <div className="menu-sidebar-footer">

          <div className="menu-user">
            <div className="menu-user-avatar">
              {getInitial(user?.name)}
            </div>

            <div className="menu-user-info">
              <strong>
                {user?.name}
              </strong>

              <span>Manager</span>
            </div>

            <div className="menu-online-dot" />
          </div>

          <button
            className="menu-logout"
            onClick={onLogout}
            type="button"
          >
            ↪ Logout
          </button>

        </div>

      </aside>
      )}

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="menu-main">

        <div className="menu-content">

          {/* HEADER */}

          <div className="menu-top">

            <div>
              <div className="menu-breadcrumb">
                POS / Management /{" "}
                <strong>Menu Management</strong>
              </div>

              <h1>
                Menu Management
              </h1>

              <p>
                Manage restaurant menu items,
                prices and availability.
              </p>
            </div>

            <div className="menu-actions">

              <div className="menu-online">
                <span />
                System Online
              </div>

              <button
                className="menu-refresh"
                onClick={loadMenu}
                disabled={loading}
                type="button"
              >
                ↻ Refresh
              </button>

              <button
                className="menu-add-button"
                onClick={openAddModal}
                type="button"
              >
                + Add Menu Item
              </button>

            </div>

          </div>

          {/* STAT CARDS */}

          <section className="menu-stats">

            <div className="menu-stat-card">
              <div className="menu-stat-icon">
                🍽️
              </div>

              <div>
                <span>Total Items</span>
                <strong>{totalItems}</strong>
              </div>
            </div>

            <div className="menu-stat-card">
              <div className="menu-stat-icon active">
                ✓
              </div>

              <div>
                <span>Available</span>
                <strong>{availableItems}</strong>
              </div>
            </div>

            <div className="menu-stat-card">
              <div className="menu-stat-icon inactive">
                ○
              </div>

              <div>
                <span>Unavailable</span>
                <strong>{unavailableItems}</strong>
              </div>
            </div>

            <div className="menu-stat-card">
              <div className="menu-stat-icon">
                ☰
              </div>

              <div>
                <span>Categories</span>
                <strong>{categories.length}</strong>
              </div>
            </div>

          </section>

          {/* MENU TABLE */}

          <section className="menu-panel">

            <div className="menu-panel-header">

              <div>
                <span className="menu-section-label">
                  MENU DIRECTORY
                </span>

                <h2>
                  Restaurant Menu
                </h2>

                <p>
                  View and manage all menu items.
                </p>
              </div>

              <div className="menu-result-count">
                {filteredItems.length} items
              </div>

            </div>

            {/* FILTERS */}

            <div className="menu-filters">

              <div className="menu-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <select
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Availability
                </option>

                <option value="AVAILABLE">
                  Available
                </option>

                <option value="UNAVAILABLE">
                  Unavailable
                </option>
              </select>

              <button
                className="menu-clear"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("ALL");
                  setAvailabilityFilter("ALL");
                }}
                type="button"
              >
                Clear
              </button>

            </div>

            {/* TABLE */}

            {loading ? (

              <div className="menu-state">
                Loading menu...
              </div>

            ) : error ? (

              <div className="menu-state menu-error">
                {error}
              </div>

            ) : filteredItems.length === 0 ? (

              <div className="menu-state">

                <div className="menu-empty-icon">
                  🍽️
                </div>

                <h3>
                  No menu items found
                </h3>

                <p>
                  Add a menu item or change
                  your filters.
                </p>

              </div>

            ) : (

              <div className="menu-table-wrapper">

                <table className="menu-table">

                  <thead>
                    <tr>
                      <th>ITEM</th>
                      <th>CATEGORY</th>
                      <th>PRICE</th>
                      <th>TYPE</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredItems.map(
                      (item) => (
                        <tr key={item._id}>

                          <td>
                            <div className="menu-item-cell">

                              <div className="menu-item-icon">
                                {item.foodType ===
                                "NON_VEG"
                                  ? "🍗"
                                  : "🥬"}
                              </div>

                              <div>
                                <strong>
                                  {item.name}
                                </strong>

                                {item.description && (
                                  <span>
                                    {item.description}
                                  </span>
                                )}
                              </div>

                            </div>
                          </td>

                          <td>
                            <span className="menu-category">
                              {item.category}
                            </span>
                          </td>

                          <td>
                            <strong>
                              ₹
                              {Number(
                                item.price
                              ).toFixed(2)}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`menu-food-type ${
                                item.foodType ===
                                "NON_VEG"
                                  ? "non-veg"
                                  : "veg"
                              }`}
                            >
                              {item.foodType ===
                              "NON_VEG"
                                ? "Non-Veg"
                                : "Veg"}
                            </span>
                          </td>

                          <td>
                            <button
                              className={`menu-status ${
                                item.available
                                  ? "available"
                                  : "unavailable"
                              }`}
                              onClick={() =>
                                toggleAvailability(
                                  item
                                )
                              }
                              type="button"
                            >
                              <span />
                              {item.available
                                ? "Available"
                                : "Unavailable"}
                            </button>
                          </td>

                          <td>
                            <div className="menu-row-actions">

                              <button
                                className="menu-edit"
                                onClick={() =>
                                  openEditModal(item)
                                }
                                type="button"
                              >
                                Edit
                              </button>

                              <button
                                className="menu-delete"
                                onClick={() =>
                                  deleteItem(item)
                                }
                                type="button"
                              >
                                Delete
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </div>

      </main>

      {/* ========================================
          ADD / EDIT MODAL
      ======================================== */}

      {showModal && (

        <div
          className="menu-modal-overlay"
          onClick={() =>
            !saving && setShowModal(false)
          }
        >

          <div
            className="menu-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="menu-modal-header">

              <div>
                <span className="menu-section-label">
                  MENU MANAGEMENT
                </span>

                <h2>
                  {editingItem
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>

                <p>
                  {editingItem
                    ? "Update menu item details."
                    : "Create a new restaurant menu item."}
                </p>
              </div>

              <button
                className="menu-modal-close"
                onClick={() =>
                  !saving &&
                  setShowModal(false)
                }
                type="button"
              >
                ×
              </button>

            </div>

            <div className="menu-modal-body">

              <div className="menu-form-row">

                <div className="menu-form-group">
                  <label>
                    Item Name
                  </label>

                  <input
                    type="text"
                    placeholder="Chicken Biryani"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="menu-form-group">
                  <label>
                    Category
                  </label>

                  <input
                    type="text"
                    placeholder="Biryani"
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category:
                          event.target.value,
                      })
                    }
                    disabled={saving}
                  />
                </div>

              </div>

              <div className="menu-form-row">

                <div className="menu-form-group">
                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="220"
                    value={form.price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price:
                          event.target.value,
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="menu-form-group">
                  <label>
                    Food Type
                  </label>

                  <select
                    value={form.foodType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        foodType:
                          event.target.value,
                      })
                    }
                    disabled={saving}
                  >
                    <option value="VEG">
                      Veg
                    </option>

                    <option value="NON_VEG">
                      Non-Veg
                    </option>
                  </select>
                </div>

              </div>

              <div className="menu-form-group">
                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe the menu item..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  disabled={saving}
                  rows="3"
                />
              </div>

              <label className="menu-availability-check">

                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      available:
                        event.target.checked,
                    })
                  }
                  disabled={saving}
                />

                <span>
                  Available for ordering
                </span>

              </label>

            </div>

            <div className="menu-modal-footer">

              <button
                className="menu-modal-cancel"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
                type="button"
              >
                Cancel
              </button>

              <button
                className="menu-modal-save"
                onClick={saveItem}
                disabled={saving}
                type="button"
              >
                {saving
                  ? "Saving..."
                  : editingItem
                  ? "Save Changes"
                  : "Create Item"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManagerMenu;