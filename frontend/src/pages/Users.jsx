import { useEffect, useState } from "react";
import { api } from "../api";

export default function Users() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.users().then(setUsers).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-error">{error}</div>;
  if (!users) return <div className="state-loading">Loading…</div>;

  return (
    <>
      <h1 className="page-title">Staff Users</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Role</th>
              <th>Created</th><th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="text-muted">{u.id}</td>
                <td>{u.username}</td>
                <td>
                  <span className={`badge ${u.role === "admin" ? "badge-amber" : "badge-muted"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="text-muted">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="text-muted">
                  {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
