import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, UserMinus, UserPlus, Trash2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  createEmployee,
  fetchEmployees,
  removeEmployee,
  setEmployeeStatus,
  updateEmployee,
} from '../lib/employees-api';
import {
  EMPLOYEE_ROLES,
  type EmployeeRecord,
  type EmployeeRole,
  type EmployeeUpsertInput,
} from '../types/employee';

const ROLE_BADGE: Record<EmployeeRole, string> = {
  Manager: 'bg-purple-100 text-purple-800',
  Admin: 'bg-blue-100 text-blue-800',
  Staff: 'bg-gray-100 text-gray-800',
  Viewer: 'bg-slate-100 text-slate-700',
};

const emptyForm: EmployeeUpsertInput = {
  fullName: '',
  email: '',
  username: '',
  phone: '',
  role: 'Staff',
  temporaryPassword: '',
};

export function AdminEmployeesPage() {
  const { employee: currentEmployee, refreshEmployee } = useAdminAuth();
  const [members, setMembers] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeUpsertInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await fetchEmployees());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (row: EmployeeRecord) => {
    setEditingId(row.id);
    setForm({
      fullName: row.fullName,
      email: row.email,
      username: row.username ?? '',
      phone: row.phone ?? '',
      role: row.role,
      temporaryPassword: '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }
    if (!editingId) {
      const password = form.temporaryPassword?.trim() ?? '';
      if (password.length < 8) {
        setError('Temporary password must be at least 8 characters.');
        return;
      }
    } else if (form.temporaryPassword?.trim() && form.temporaryPassword.trim().length < 8) {
      setError('Temporary password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const addedBy = currentEmployee?.fullName ?? currentEmployee?.email ?? 'admin';
    try {
      if (editingId) {
        await updateEmployee(editingId, form);
      } else {
        await createEmployee(form, addedBy);
      }
      closeForm();
      await load();
      await refreshEmployee();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save team member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (row: EmployeeRecord) => {
    if (row.id === currentEmployee?.id) {
      window.alert('You cannot deactivate your own account.');
      return;
    }
    const next = row.status === 'Active' ? 'Inactive' : 'Active';
    const label = next === 'Inactive' ? 'revoke admin access for' : 'reactivate';
    if (!window.confirm(`${label} ${row.fullName}?`)) return;

    setError(null);
    try {
      await setEmployeeStatus(row.id, next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    }
  };

  const handleRemove = async (row: EmployeeRecord) => {
    if (row.id === currentEmployee?.id) {
      window.alert('You cannot remove your own account.');
      return;
    }
    if (
      !window.confirm(
        `Permanently remove ${row.fullName}? They will need to be re-added to access admin again.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      await removeEmployee(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove team member.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-600">
            Add or remove people who can sign in to the admin panel. Only Managers and Admins can
            manage this list.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0284C7]"
        >
          <Plus className="h-4 w-4" />
          Add member
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <strong>Passwords:</strong> Set a temporary password when adding a member so they can sign
        in at <code className="rounded bg-blue-100 px-1">/admin/login</code> with email or username.
        They can change it later from their profile, or use{' '}
        <code className="rounded bg-blue-100 px-1">/admin/forgot-password</code>.
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            {editingId ? 'Edit team member' : 'New team member'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Full name</span>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Username (optional)</span>
              <input
                value={form.username ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="e.g. manager"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Phone (optional)</span>
              <input
                value={form.phone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Role</span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as EmployeeRole }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              >
                {EMPLOYEE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                {editingId ? 'Temporary password (optional)' : 'Temporary password'}
              </span>
              <input
                required={!editingId}
                type="text"
                autoComplete="new-password"
                minLength={editingId ? undefined : 8}
                value={form.temporaryPassword ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, temporaryPassword: e.target.value }))}
                placeholder={
                  editingId
                    ? 'Leave blank to keep current password'
                    : 'At least 8 characters — share this with the new member'
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
              <span className="mt-1 block text-xs text-gray-500">
                {editingId
                  ? 'Fill this in only if you want to reset their login password.'
                  : 'They can sign in immediately with this password. Share it securely.'}
              </span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add member'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No team members yet. Add your first member above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Login
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Auth
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{row.fullName}</p>
                      {row.id === currentEmployee?.id && (
                        <span className="text-xs text-[#0EA5E9]">You</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{row.email}</p>
                      {row.username && (
                        <p className="text-xs text-gray-500">@{row.username}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[row.role]}`}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {row.authLinked ? 'Linked' : 'Not linked'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#0EA5E9] hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(row)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:underline"
                        >
                          {row.status === 'Active' ? (
                            <>
                              <UserMinus className="h-3.5 w-3.5" />
                              Revoke access
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5" />
                              Reactivate
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemove(row)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
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
    </div>
  );
}
