import { useState, useEffect } from 'react';
import { useAuth } from '../../day1-auth/client/AuthContext';

// Velox Users Management Table
// Admin interface for managing all platform users

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const token = localStorage.getItem('velox_token');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.append('search', search);
    if (roleFilter) params.append('role', roleFilter);

    const res = await fetch(`/api/users?${params}`, {
      headers: { Authorization: token }
    });
    const data = await res.json();
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;

    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: token }
    });

    setUsers(users.filter(u => u._id !== userId));
  };

  const handleRoleChange = async (userId, newRole) => {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });

    if (res.ok) {
      setUsers(users.map(u =>
        u._id === userId ? { ...u, role: newRole } : u
      ));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
    if (!window.confirm(`Deactivate ${selectedUsers.length} users?`)) return;

    for (const id of selectedUsers) {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token }
      });
    }

    setUsers(users.filter(u => !selectedUsers.includes(u._id)));
    setSelectedUsers([]);
  };

  const toggleSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="users-table-container">
      <div className="table-header">
        <h2>Users ({total})</h2>
        <div className="table-controls">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          {selectedUsers.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-danger">
              Deactivate selected ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={e =>
                    setSelectedUsers(e.target.checked ? users.map(u => u._id) : [])
                  }
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className={!user.isActive ? 'inactive' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleSelect(user._id)}
                  />
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {currentUser.role === 'admin' ? (
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td>{user.department || '—'}</td>
                <td>
                  <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="btn-sm btn-danger"
                    disabled={user._id === currentUser._id}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
