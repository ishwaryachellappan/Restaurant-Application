import React, { useEffect, useMemo, useState } from "react";
import "./KitchenInventory.css";

const API_BASE = "http://localhost:5000";

const EMPTY_ITEM = {
  name: "",
  category: "",
  unit: "kg",
  currentStock: "",
  minimumStock: "",
  maximumStock: "",
  supplier: "",
  costPerUnit: "",
  notes: "",
};

const UNIT_OPTIONS = [
  "kg",
  "g",
  "litre",
  "ml",
  "pcs",
  "pack",
  "box",
  "bottle",
  "other",
];

const KitchenInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [stockAction, setStockAction] = useState("IN");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_ITEM);

  const [stockForm, setStockForm] = useState({
    quantity: "",
    newStock: "",
    reason: "",
  });

  const [saving, setSaving] = useState(false);

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  const loadInventory = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/inventory`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load inventory.");
      }

      setItems(data.items || []);
    } catch (error) {
      console.error("Inventory load error:", error);
      alert(error.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // =====================================================
  // CATEGORY LIST
  // =====================================================

  const categories = useMemo(() => {
    const values = items
      .map((item) => item.category)
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [items]);

  // =====================================================
  // DASHBOARD COUNTS
  // =====================================================

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

  // =====================================================
  // FILTERED ITEMS
  // =====================================================

  const filteredItems = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.name?.toLowerCase().includes(searchValue) ||
        item.category?.toLowerCase().includes(searchValue) ||
        item.supplier?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    items,
    search,
    statusFilter,
    categoryFilter,
  ]);

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStockFormChange = (event) => {
    const { name, value } = event.target;

    setStockForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // ADD INVENTORY ITEM
  // =====================================================

  const handleAddItem = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter an item name.");
      return;
    }

    if (!form.category.trim()) {
      alert("Please enter a category.");
      return;
    }

    if (form.currentStock === "") {
      alert("Please enter current stock.");
      return;
    }

    if (form.minimumStock === "") {
      alert("Please enter minimum stock.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/api/inventory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category.trim(),
            unit: form.unit,
            currentStock: Number(form.currentStock),
            minimumStock: Number(form.minimumStock),
            maximumStock:
              form.maximumStock === ""
                ? 0
                : Number(form.maximumStock),
            supplier: form.supplier.trim(),
            costPerUnit:
              form.costPerUnit === ""
                ? 0
                : Number(form.costPerUnit),
            notes: form.notes.trim(),
            createdBy: "Kitchen Manager",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create inventory item."
        );
      }

      alert("Inventory item added successfully.");

      setShowAddModal(false);
      setForm(EMPTY_ITEM);

      await loadInventory();
    } catch (error) {
      console.error("Add inventory error:", error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // OPEN STOCK MODAL
  // =====================================================

  const openStockModal = (item, action) => {
    setSelectedItem(item);
    setStockAction(action);

    setStockForm({
      quantity: "",
      newStock: item.currentStock,
      reason: "",
    });

    setShowStockModal(true);
  };

  // =====================================================
  // STOCK IN / STOCK OUT / ADJUST
  // =====================================================

  const handleStockSubmit = async (event) => {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    let endpoint = "";
    let body = {};

    if (stockAction === "IN") {
      if (
        !stockForm.quantity ||
        Number(stockForm.quantity) <= 0
      ) {
        alert("Please enter a valid quantity.");
        return;
      }

      endpoint = `/api/inventory/${selectedItem._id}/stock-in`;

      body = {
        quantity: Number(stockForm.quantity),
        reason:
          stockForm.reason.trim() || "Stock received",
        performedBy: "Kitchen Manager",
      };
    }

    if (stockAction === "OUT") {
      if (
        !stockForm.quantity ||
        Number(stockForm.quantity) <= 0
      ) {
        alert("Please enter a valid quantity.");
        return;
      }

      endpoint = `/api/inventory/${selectedItem._id}/stock-out`;

      body = {
        quantity: Number(stockForm.quantity),
        reason:
          stockForm.reason.trim() || "Stock used",
        performedBy: "Kitchen Staff",
      };
    }

    if (stockAction === "ADJUST") {
      if (
        stockForm.newStock === "" ||
        Number(stockForm.newStock) < 0
      ) {
        alert("Please enter a valid stock value.");
        return;
      }

      endpoint = `/api/inventory/${selectedItem._id}/adjust`;

      body = {
        newStock: Number(stockForm.newStock),
        reason:
          stockForm.reason.trim() || "Stock adjustment",
        performedBy: "Kitchen Manager",
      };
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update stock."
        );
      }

      setShowStockModal(false);
      setSelectedItem(null);

      await loadInventory();

      alert("Stock updated successfully.");
    } catch (error) {
      console.error("Stock update error:", error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STOCK HISTORY
  // =====================================================

  const openHistory = async (item) => {
    setSelectedItem(item);
    setHistory([]);
    setShowHistoryModal(true);
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/inventory/${item._id}/movements`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load stock history."
        );
      }

      setHistory(data.movements || []);
    } catch (error) {
      console.error("History load error:", error);
      alert(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "In Stock";

      case "LOW_STOCK":
        return "Low Stock";

      case "OUT_OF_STOCK":
        return "Out of Stock";

      default:
        return status || "Unknown";
    }
  };

  const getMovementLabel = (type) => {
    switch (type) {
      case "STOCK_IN":
        return "Stock In";

      case "STOCK_OUT":
        return "Stock Out";

      case "ADJUSTMENT":
        return "Adjustment";

      default:
        return type;
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="kitchen-inventory-page">

      {/* HEADER */}

      <div className="inventory-header">
        <div>
          <h1>Inventory Management</h1>

          <p>
            Manage kitchen ingredients and stock levels
          </p>
        </div>

        <button
          className="inventory-add-button"
          onClick={() => {
            setForm(EMPTY_ITEM);
            setShowAddModal(true);
          }}
        >
          + Add Inventory Item
        </button>
      </div>

      {/* KPI CARDS */}

      <div className="inventory-kpi-grid">

        <div className="inventory-kpi-card total">
          <div className="inventory-kpi-icon">
            📦
          </div>

          <div>
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="inventory-kpi-card stock">
          <div className="inventory-kpi-icon">
            ✓
          </div>

          <div>
            <span>In Stock</span>
            <strong>{inStockCount}</strong>
          </div>
        </div>

        <div className="inventory-kpi-card low">
          <div className="inventory-kpi-icon">
            !
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{lowStockCount}</strong>
          </div>
        </div>

        <div className="inventory-kpi-card out">
          <div className="inventory-kpi-icon">
            !
          </div>

          <div>
            <span>Out of Stock</span>
            <strong>{outOfStockCount}</strong>
          </div>
        </div>

      </div>

      {/* FILTERS */}

      <div className="inventory-filter-card">

        <div className="inventory-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

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

        <button
          className="inventory-refresh-button"
          onClick={loadInventory}
        >
          ↻ Refresh
        </button>

      </div>

      {/* TABLE */}

      <div className="inventory-table-card">

        <div className="inventory-table-header">
          <div>
            <h2>Inventory Items</h2>

            <span>
              {filteredItems.length} item
              {filteredItems.length !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="inventory-empty">
            Loading inventory...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="inventory-empty">
            <div className="inventory-empty-icon">
              📦
            </div>

            <h3>No inventory items found</h3>

            <p>
              Add your first kitchen inventory item
              to get started.
            </p>
          </div>
        ) : (
          <div className="inventory-table-wrapper">

            <table className="inventory-table">

              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>CATEGORY</th>
                  <th>CURRENT STOCK</th>
                  <th>MINIMUM</th>
                  <th>MAXIMUM</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>

                {filteredItems.map((item) => (
                  <tr key={item._id}>

                    <td>
                      <div className="inventory-item-name">
                        <strong>
                          {item.name}
                        </strong>

                        {item.supplier && (
                          <small>
                            {item.supplier}
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      {item.category}
                    </td>

                    <td>
                      <strong>
                        {item.currentStock}
                      </strong>{" "}
                      {item.unit}
                    </td>

                    <td>
                      {item.minimumStock}{" "}
                      {item.unit}
                    </td>

                    <td>
                      {item.maximumStock > 0
                        ? `${item.maximumStock} ${item.unit}`
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`inventory-status ${item.status
                          ?.toLowerCase()
                          .replace("_", "-")}`}
                      >
                        <span className="status-dot" />

                        {getStatusLabel(
                          item.status
                        )}
                      </span>
                    </td>

                    <td>

                      <div className="inventory-actions">

                        <button
                          className="action-button stock-in"
                          title="Add Stock"
                          onClick={() =>
                            openStockModal(
                              item,
                              "IN"
                            )
                          }
                        >
                          + Stock
                        </button>

                        <button
                          className="action-button stock-out"
                          title="Reduce Stock"
                          onClick={() =>
                            openStockModal(
                              item,
                              "OUT"
                            )
                          }
                        >
                          − Use
                        </button>

                        <button
                          className="action-button adjust"
                          title="Adjust Stock"
                          onClick={() =>
                            openStockModal(
                              item,
                              "ADJUST"
                            )
                          }
                        >
                          Adjust
                        </button>

                        <button
                          className="action-button history"
                          title="View History"
                          onClick={() =>
                            openHistory(item)
                          }
                        >
                          History
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================================
          ADD INVENTORY MODAL
          ===================================================== */}

      {showAddModal && (
        <div className="inventory-modal-overlay">

          <div className="inventory-modal">

            <div className="inventory-modal-header">
              <div>
                <h2>
                  Add Inventory Item
                </h2>

                <p>
                  Add a new kitchen ingredient
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowAddModal(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddItem}
              className="inventory-form"
            >

              <div className="inventory-form-grid">

                <div className="form-field">
                  <label>
                    Item Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Basmati Rice"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Category *
                  </label>

                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="e.g. Grains"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Unit *
                  </label>

                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleFormChange}
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Current Stock *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="currentStock"
                    value={form.currentStock}
                    onChange={handleFormChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Minimum Stock *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="minimumStock"
                    value={form.minimumStock}
                    onChange={handleFormChange}
                    placeholder="10"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Maximum Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="maximumStock"
                    value={form.maximumStock}
                    onChange={handleFormChange}
                    placeholder="50"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Supplier
                  </label>

                  <input
                    name="supplier"
                    value={form.supplier}
                    onChange={handleFormChange}
                    placeholder="Supplier name"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Cost Per Unit
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="costPerUnit"
                    value={form.costPerUnit}
                    onChange={handleFormChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-field full-width">
                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    placeholder="Additional notes..."
                    rows="3"
                  />
                </div>

              </div>

              <div className="inventory-modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Add Item"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          STOCK ACTION MODAL
          ===================================================== */}

      {showStockModal && selectedItem && (
        <div className="inventory-modal-overlay">

          <div className="inventory-modal stock-modal">

            <div className="inventory-modal-header">

              <div>
                <h2>
                  {stockAction === "IN"
                    ? "Add Stock"
                    : stockAction === "OUT"
                    ? "Reduce Stock"
                    : "Adjust Stock"}
                </h2>

                <p>
                  {selectedItem.name}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowStockModal(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleStockSubmit}
              className="inventory-form"
            >

              <div className="current-stock-display">

                <span>
                  Current Stock
                </span>

                <strong>
                  {selectedItem.currentStock}{" "}
                  {selectedItem.unit}
                </strong>

              </div>

              {stockAction === "ADJUST" ? (
                <div className="form-field">
                  <label>
                    New Stock *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="newStock"
                    value={stockForm.newStock}
                    onChange={handleStockFormChange}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="form-field">
                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="quantity"
                    value={stockForm.quantity}
                    onChange={handleStockFormChange}
                    placeholder="Enter quantity"
                    autoFocus
                  />
                </div>
              )}

              <div className="form-field">
                <label>
                  Reason
                </label>

                <input
                  name="reason"
                  value={stockForm.reason}
                  onChange={handleStockFormChange}
                  placeholder={
                    stockAction === "IN"
                      ? "e.g. New stock received"
                      : stockAction === "OUT"
                      ? "e.g. Kitchen usage"
                      : "e.g. Physical stock count"
                  }
                />
              </div>

              <div className="inventory-modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowStockModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Stock"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          HISTORY MODAL
          ===================================================== */}

      {showHistoryModal && selectedItem && (
        <div className="inventory-modal-overlay">

          <div className="inventory-modal history-modal">

            <div className="inventory-modal-header">

              <div>
                <h2>
                  Stock History
                </h2>

                <p>
                  {selectedItem.name}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowHistoryModal(false)
                }
              >
                ×
              </button>

            </div>

            <div className="history-content">

              {historyLoading ? (
                <div className="inventory-empty">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="inventory-empty">
                  No stock movements found.
                </div>
              ) : (
                <div className="history-list">

                  {history.map((movement) => (
                    <div
                      className="history-row"
                      key={movement._id}
                    >

                      <div className="history-type">
                        <span
                          className={`history-badge ${movement.movementType
                            ?.toLowerCase()
                            .replace("_", "-")}`}
                        >
                          {getMovementLabel(
                            movement.movementType
                          )}
                        </span>
                      </div>

                      <div className="history-stock">

                        <strong>
                          {movement.previousStock}
                        </strong>

                        <span>→</span>

                        <strong>
                          {movement.newStock}
                        </strong>

                        <small>
                          {selectedItem.unit}
                        </small>

                      </div>

                      <div className="history-details">

                        <strong>
                          {movement.reason ||
                            "No reason"}
                        </strong>

                        <small>
                          By{" "}
                          {movement.performedBy ||
                            "Unknown"}
                        </small>

                      </div>

                      <div className="history-date">
                        {movement.createdAt
                          ? new Date(
                              movement.createdAt
                            ).toLocaleString()
                          : "—"}
                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default KitchenInventory;