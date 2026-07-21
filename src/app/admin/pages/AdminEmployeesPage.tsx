import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Info, Plus, Pencil, Ban, CircleCheck, Trash2 } from 'lucide-react';
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
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

const AVATAR_COLORS = ['#0ea5e9', '#7c3aed', '#f59e0b', '#10b981', '#ec4899', '#0284c7'];

const ROLE_BADGE: Record<EmployeeRole, string> = {
  Manager:
    'inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-800',
  Admin: adminUi.badgeSky,
  Staff: adminUi.badgeGray,
  Viewer: adminUi.badgeGray,
};

const emptyForm: EmployeeUpsertInput = {
  fullName: '',
  email: '',
  username: '',
  phone: '',
  role: 'Staff',
  temporaryPassword: '',
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function avatarColorFor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

export function AdminEmployeesPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
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
    const suspending = next === 'Inactive';
    const ok = await confirm({
      title: suspending ? `Suspend ${row.fullName}?` : `Activate ${row.fullName}?`,
      description: suspending
        ? 'They will lose access to the admin panel until reactivated.'
        : 'They will be able to sign in to the admin panel again.',
      confirmLabel: suspending ? 'Suspend' : 'Activate',
      tone: suspending ? 'danger' : 'default',
    });
    if (!ok) return;

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
    const ok = await confirm({
      title: `Remove ${row.fullName}?`,
      description: 'They will need to be re-added to access admin again. This cannot be undone.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    try {
      await removeEmployee(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove team member.');
    }
  };

  return (
    <div>
      {confirmDialog}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <p className={adminUi.pageIntro}>
          Who can log in to this admin. Managers and Admins can add or remove people here.
        </p>
        <button type="button" onClick={openCreate} className={`${adminUi.btnPrimary} shrink-0`}>
          <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
          Add member
        </button>
      </div>

      <div className={`${adminUi.tip} mb-[18px]`}>
        <Info className="mt-px h-[18px] w-[18px] shrink-0 text-[#0ea5e9]" strokeWidth={2} />
        <p className="m-0">
          When you add someone, give them a temporary password so they can sign in. They can change
          it later under My profile.
        </p>
      </div>

      {error && (
        <div className="mb-[18px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className={`${adminUi.card} mb-[18px] p-[22px]`}
        >
          <h3 className="mb-4 text-[15.5px] font-bold text-[#1e2a38]">
            {editingId ? 'Edit team member' : 'New team member'}
          </h3>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[13px] font-semibold text-[#516171]">Full name</span>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Jordan Hamel"
                className={adminUi.input}
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[#516171]">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@hamel.ph"
                className={adminUi.input}
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[#516171]">Username (optional)</span>
              <input
                value={form.username ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="e.g. manager"
                className={adminUi.input}
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[#516171]">Role</span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as EmployeeRole }))
                }
                className={adminUi.select}
              >
                {EMPLOYEE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[#516171]">
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
                    : 'At least 8 characters'
                }
                className={adminUi.input}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2.5">
            <button type="submit" disabled={submitting} className={adminUi.btnAmber}>
              {submitting ? 'Saving…' : editingId ? 'Save' : 'Add member'}
            </button>
            <button type="button" onClick={closeForm} className={adminUi.btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={`${adminUi.card} overflow-hidden`}>
        {loading ? (
          <p className="p-8 text-center text-[#9aa7b5]">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-[#9aa7b5]">
            No team members yet. Add your first member above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
              <thead>
                <tr className={adminUi.tableHead}>
                  <th className="px-[18px] py-3">Name</th>
                  <th className="px-3 py-3">Login</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-[18px] py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#f1f5f9] hover:bg-[#f9fbfd]"
                  >
                    <td className="px-[18px] py-[13px]">
                      <div className="flex items-center gap-[11px]">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                          style={{ background: avatarColorFor(index) }}
                        >
                          {initialsFor(row.fullName)}
                        </span>
                        <div className="font-bold text-[#1e2a38]">
                          {row.fullName}
                          {row.id === currentEmployee?.id && (
                            <span className="ml-[7px] text-[11px] font-bold text-[#0ea5e9]">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-[13px]">
                      <div className="text-[#1e2a38]">{row.email}</div>
                      {row.username ? (
                        <div className="text-[11.5px] text-[#9aa7b5]">@{row.username}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-[13px]">
                      <span className={ROLE_BADGE[row.role]}>{row.role}</span>
                    </td>
                    <td className="px-3 py-[13px]">
                      <span
                        className={
                          row.status === 'Active' ? adminUi.badgeGreen : adminUi.badgeGray
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-[18px] py-[13px]">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4ebf2] bg-white text-[#0ea5e9] hover:bg-[#e0f2fe]"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="h-[15px] w-[15px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4ebf2] bg-white text-[#516171] hover:bg-[#f7fafd]"
                          title={row.status === 'Active' ? 'Suspend' : 'Activate'}
                          aria-label={row.status === 'Active' ? 'Suspend' : 'Activate'}
                        >
                          {row.status === 'Active' ? (
                            <Ban className="h-[15px] w-[15px]" />
                          ) : (
                            <CircleCheck className="h-[15px] w-[15px]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemove(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4ebf2] bg-white text-[#ef4444] hover:bg-red-50"
                          title="Remove"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-[15px] w-[15px]" />
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
