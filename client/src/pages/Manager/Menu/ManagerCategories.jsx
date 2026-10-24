
import { useCallback, useEffect, useState } from "react";
import "./ManagerCategories.css";

const API_URL = "http://localhost:5000/api/menu/categories";

function ManagerCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load categories.");
      }

      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setCategoryName("");
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save category.");
      }

      resetForm();
      setSuccess(
        isEditing
          ? "Category updated successfully."
          : "Category added successfully."
      );

      await loadCategories();
    } catch (err) {
      setError(err.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setCategoryName(category.name);
    setEditingId(category._id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Categories assigned to menu items cannot be deleted.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${category._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete category.");
      }

      if (editingId === category._id) {
        resetForm();
      }

      setSuccess("Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      setError(err.message || "Unable to delete category.");
    }
  };

  return (
    <div className="manager-categories-page">
      <header className="manager-categories-header">
        <div>
          <div className="manager-categories-breadcrumb">
            Management / Menu Management / Categories
          </div>
          <h1>Category Management</h1>
          <p>Create and manage your restaurant menu categories.</p>
        </div>

        <button
          type="button"
          className="manager-category-refresh"
          onClick={loadCategories}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="manager-category-message error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="manager-category-message success" role="status">
          {success}
        </div>
      )}

      <div className="manager-categories-layout">
        <section className="manager-category-panel">
          <div className="manager-category-panel-heading">
            <h2>{editingId ? "Edit Category" : "Add Category"}</h2>
            <p>
              {editingId
                ? "Rename an existing category."
                : "Add a category to organize menu items."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="manager-category-name">
              Category Name
            </label>

            <input
              id="manager-category-name"
              type="text"
              placeholder="e.g. Starters"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={60}
              disabled={saving}
              required
            />

            <div className="manager-category-form-actions">
              <button
                type="submit"
                className="manager-category-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="manager-category-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="manager-category-panel">
          <div className="manager-category-panel-heading manager-category-list-heading">
            <div>
              <h2>Categories</h2>
              <p>Categories currently stored in your database.</p>
            </div>
            <span className="manager-category-count">
              {categories.length}
            </span>
          </div>

          {loading ? (
            <div className="manager-category-empty">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="manager-category-empty">
              No categories found. Add your first category.
            </div>
          ) : (
            <div className="manager-category-list">
              {categories.map((category) => (
                <div className="manager-category-row" key={category._id}>
                  <div className="manager-category-name">
                    <span className="manager-category-symbol">#</span>
                    <span>{category.name}</span>
                  </div>

                  <div className="manager-category-actions">
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="manager-category-delete"
                      onClick={() => handleDelete(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ManagerCategories;
