import { useEffect, useMemo, useState } from "react";
import "./ManagerStaff.css";

function ManagerStaff({ user, onBack, onLogout }) {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/staff"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load staff."
        );
      }

      setStaff(data.users || []);
    } catch (error) {
      console.error("Load staff error:", error);
      setError("Unable to load staff members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const updateStatus = async (member) => {
    const newStatus =
      member.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      setUpdatingId(member._id);

      const response = await fetch(
        `http://localhost:5000/api/staff/${member._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update status."
        );
      }

      setStaff((currentStaff) =>
        currentStaff.map((item) =>
          item._id === member._id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Update staff status error:", error);

      alert(
        error.message ||
          "Unable to update staff status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStaff = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return staff.filter((member) => {
      const matchesSearch =
        !searchValue ||
        member.name
          ?.toLowerCase()
          .includes(searchValue) ||
        member.username
          ?.toLowerCase()
          .includes(searchValue);

      const matchesRole =
        roleFilter === "ALL" ||
        member.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        member.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    staff,
    search,
    roleFilter,
    statusFilter,
  ]);

  const activeCount = staff.filter(
    (member) => member.status === "ACTIVE"
  ).length;

  const inactiveCount = staff.filter(
    (member) => member.status === "INACTIVE"
  ).length;

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  const getRoleLabel = (role) => {
    switch (role) {
      case "WAITER":
        return "Waiter";
      case "KITCHEN":
        return "Kitchen";
      case "CASHIER":
        return "Cashier";
      case "MANAGER":
        return "Manager";
      default:
        return role;
    }
  };

  return (
    <div className="staff-page">
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <div className="staff-brand-icon">
            🍽️
          </div>

          <div>
            <h2>Restaurant</h2>
            <span>POS SYSTEM</span>
          </div>
        </div>

        <div className="staff-sidebar-title">
          MANAGEMENT
        </div>

        <button
          className="staff-nav-item"
          onClick={onBack}
        >
          ▦
          <span>Dashboard</span>
        </button>

        <button
          className="staff-nav-item staff-nav-active"
          type="button"
        >
          👥
          <span>Staff</span>
        </button>

        <div className="staff-sidebar-footer">
          <div className="staff-user">
            <div className="staff-user-avatar">
              {getInitial(user?.name)}
            </div>

            <div className="staff-user-info">
              <strong>{user?.name}</strong>
              <span>Manager</span>
            </div>

            <div className="staff-online-dot" />
          </div>

          <button
            className="staff-logout"
            onClick={onLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="staff-main">
        <div className="staff-content">
          <div className="staff-top">
            <div>
              <div className="staff-breadcrumb">
                POS / Management / <strong>Staff</strong>
              </div>

              <h1>Staff Management</h1>

              <p>
                Manage restaurant employees and
                access status.
              </p>
            </div>

            <div className="staff-actions">
              <div className="staff-online">
                <span />
                System Online
              </div>

              <button
                className="staff-refresh"
                onClick={loadStaff}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <section className="staff-stats">
            <div className="staff-stat-card">
              <div className="staff-stat-icon">
                👥
              </div>

              <div>
                <span>Total Staff</span>
                <strong>{staff.length}</strong>
              </div>
            </div>

            <div className="staff-stat-card">
              <div className="staff-stat-icon active">
                ✓
              </div>

              <div>
                <span>Active</span>
                <strong>{activeCount}</strong>
              </div>
            </div>

            <div className="staff-stat-card">
              <div className="staff-stat-icon inactive">
                ○
              </div>

              <div>
                <span>Inactive</span>
                <strong>{inactiveCount}</strong>
              </div>
            </div>
          </section>

          <section className="staff-panel">
            <div className="staff-panel-header">
              <div>
                <span className="staff-section-label">
                  STAFF DIRECTORY
                </span>

                <h2>Restaurant Staff</h2>

                <p>
                  View and manage employee accounts.
                </p>
              </div>

              <div className="staff-result-count">
                {filteredStaff.length} members
              </div>
            </div>

            <div className="staff-filters">
              <div className="staff-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
              >
                <option value="ALL">
                  All Roles
                </option>
                <option value="MANAGER">
                  Manager
                </option>
                <option value="WAITER">
                  Waiter
                </option>
                <option value="KITCHEN">
                  Kitchen
                </option>
                <option value="CASHIER">
                  Cashier
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Status
                </option>
                <option value="ACTIVE">
                  Active
                </option>
                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <button
                className="staff-clear"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
              >
                Clear
              </button>
            </div>

            {loading ? (
              <div className="staff-state">
                Loading staff...
              </div>
            ) : error ? (
              <div className="staff-state staff-error">
                {error}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="staff-state">
                <div className="staff-empty-icon">
                  👥
                </div>

                <h3>No staff found</h3>

                <p>
                  Try changing your search or
                  filters.
                </p>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>STAFF MEMBER</th>
                      <th>USERNAME</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStaff.map((member) => (
                      <tr key={member._id}>
                        <td>
                          <div className="staff-member">
                            <div className="staff-avatar">
                              {getInitial(
                                member.name
                              )}
                            </div>

                            <div>
                              <strong>
                                {member.name}
                              </strong>

                              <span>
                                Restaurant POS
                                account
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="staff-username">
                            {member.username}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`staff-role staff-role-${member.role.toLowerCase()}`}
                          >
                            {getRoleLabel(
                              member.role
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`staff-status ${
                              member.status ===
                              "ACTIVE"
                                ? "staff-status-active"
                                : "staff-status-inactive"
                            }`}
                          >
                            <span />
                            {member.status}
                          </span>
                        </td>

                        <td>
                          <button
                            className={`staff-status-button ${
                              member.status ===
                              "ACTIVE"
                                ? "deactivate"
                                : "activate"
                            }`}
                            onClick={() =>
                              updateStatus(member)
                            }
                            disabled={
                              updatingId ===
                              member._id
                            }
                          >
                            {updatingId ===
                            member._id
                              ? "Updating..."
                              : member.status ===
                                "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default ManagerStaff;