import { useLoaderData } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Users | Admin" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);
  const { getAllUsers } = await import("~/db/models/users.server");
  return { users: await getAllUsers() };
}

export default function AdminUsersPage() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1 className="admin-page-title">Users ({users.length})</h1>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.phone || "—"}</td>
                <td>{user.city || "—"}</td>
                <td><span className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}>{user.role}</span></td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
