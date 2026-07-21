import { type FormEvent, useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { FiPlus, FiRefreshCw, FiShield, FiUserCheck, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import authService from '../../../services/auth-service';
import accessService, { AccessRole } from '../../../services/access-service';
import { CreateCollaboratorInput, entityUsersService } from '../../../services/entity.service';
import { User } from '../../../types/user.types';

const initialForm: CreateCollaboratorInput = { name: '', email: '', password: '', ci: '', phone: '', roleId: '' };
const getRoleName = (user: User) => typeof user.role === 'string' ? user.role : user.role?.name || 'Sin rol';
const getRoleId = (user: User) => typeof user.role === 'string' ? user.role : user.role?._id || '';
const getErrorMessage = (error: unknown) => (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'No fue posible completar la operación.';

export default function Collaborators() {
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [form, setForm] = useState<CreateCollaboratorInput>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<User | null>(null);
  const [newRoleId, setNewRoleId] = useState('');
  const entityId = authService.getEntityIdFromToken();

  const loadData = useCallback(async () => {
    if (!entityId) { setError('No se pudo identificar la entidad de la sesión.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [collaboratorsData, rolesData] = await Promise.all([entityUsersService.getCollaborators(entityId), accessService.getRoles()]);
      setCollaborators(collaboratorsData); setRoles(rolesData);
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setLoading(false); }
  }, [entityId]);
  useEffect(() => { void loadData(); }, [loadData]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await entityUsersService.createCollaborator(form); setForm(initialForm); setShowCreate(false); await loadData(); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };
  const toggleStatus = async (collaborator: User) => {
    setSaving(true); setError('');
    try { await entityUsersService.changeStatusSonUser(collaborator._id, !collaborator.isActive); await loadData(); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };
  const openRoleEditor = (collaborator: User) => { setEditingCollaborator(collaborator); setNewRoleId(getRoleId(collaborator)); };
  const changeRole = async () => {
    if (!editingCollaborator || !newRoleId || newRoleId === getRoleId(editingCollaborator)) return;
    const role = roles.find((item) => item._id === newRoleId);
    const confirmation = await Swal.fire({ title: '¿Cambiar rol?', text: `${editingCollaborator.name} tendrá el rol “${role?.name || ''}”.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, cambiar rol', cancelButtonText: 'Cancelar', confirmButtonColor: '#2563eb' });
    if (!confirmation.isConfirmed) return;
    setSaving(true); setError('');
    try { await accessService.assignRoleToUser(editingCollaborator._id, newRoleId); setEditingCollaborator(null); await loadData(); await Swal.fire({ icon: 'success', title: 'Rol actualizado', timer: 1400, showConfirmButton: false }); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };

  return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-7xl">
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><FiUsers className="text-blue-600" /> Colaboradores</h2><p className="mt-1 text-sm text-slate-500">Administra las cuentas y roles del equipo de tu entidad.</p></div><button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"><FiUserPlus /> Nuevo colaborador</button></div>
    {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="overflow-hidden rounded-lg bg-white shadow"><div className="flex items-center justify-between border-b border-slate-100 p-4"><span className="font-semibold text-slate-700">{collaborators.length} colaboradores</span><button disabled={loading} onClick={() => void loadData()} className="rounded p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Actualizar"><FiRefreshCw className={loading ? 'animate-spin' : ''} /></button></div>
    {loading ? <div className="flex h-48 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /></div> : collaborators.length === 0 ? <div className="flex h-48 flex-col items-center justify-center text-slate-400"><FiUsers size={42} /><p className="mt-3">Aún no hay colaboradores registrados.</p></div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Colaborador</th><th className="px-5 py-3">Contacto</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{collaborators.map((collaborator) => <tr key={collaborator._id}><td className="px-5 py-4"><p className="font-medium text-slate-800">{collaborator.name}</p>{collaborator.ci && <p className="text-xs text-slate-500">CI: {collaborator.ci}</p>}</td><td className="px-5 py-4 text-sm text-slate-600"><p>{collaborator.email}</p>{collaborator.phone && <p className="text-xs text-slate-500">{collaborator.phone}</p>}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium capitalize text-violet-700"><FiShield /> {getRoleName(collaborator)}</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${collaborator.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{collaborator.isActive ? 'Activo' : 'Inactivo'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button disabled={saving} onClick={() => openRoleEditor(collaborator)} className="inline-flex items-center gap-1 rounded-md border border-violet-300 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-50 disabled:opacity-50"><FiShield /> Cambiar rol</button><button disabled={saving} onClick={() => void toggleStatus(collaborator)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"><FiUserCheck /> {collaborator.isActive ? 'Desactivar' : 'Activar'}</button></div></td></tr>)}</tbody></table></div>}</div>
  </div>
  {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={(event) => void submit(event)} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-800">Nuevo colaborador</h3><p className="text-sm text-slate-500">Asigna uno de los roles creados por la entidad.</p></div><button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><FiX size={22} /></button></div>{roles.length === 0 ? <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Primero crea un rol desde el módulo Roles y permisos.</div> : <div className="grid gap-4 sm:grid-cols-2"><TextField label="Nombre" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><TextField label="Correo" value={form.email} onChange={(email) => setForm({ ...form, email })} type="email" required /><TextField label="Contraseña" value={form.password} onChange={(password) => setForm({ ...form, password })} type="password" required /><label className="text-sm font-medium text-slate-700">Rol<select required value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Selecciona un rol</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></label><TextField label="Cédula (opcional)" value={form.ci || ''} onChange={(ci) => setForm({ ...form, ci })} /><TextField label="Teléfono (opcional)" value={form.phone || ''} onChange={(phone) => setForm({ ...form, phone })} /></div>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700">Cancelar</button><button disabled={saving || roles.length === 0} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"><FiPlus /> {saving ? 'Guardando…' : 'Crear colaborador'}</button></div></form></div>}
  {editingCollaborator && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-800">Cambiar rol</h3><p className="text-sm text-slate-500">{editingCollaborator.name}</p></div><button onClick={() => setEditingCollaborator(null)} className="text-slate-400 hover:text-slate-600"><FiX size={22} /></button></div><label className="block text-sm font-medium text-slate-700">Nuevo rol<select value={newRoleId} onChange={(event) => setNewRoleId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></label><div className="mt-6 flex justify-end gap-3"><button onClick={() => setEditingCollaborator(null)} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700">Cancelar</button><button disabled={saving || !newRoleId || newRoleId === getRoleId(editingCollaborator)} onClick={() => void changeRole()} className="rounded-md bg-violet-600 px-4 py-2 text-white disabled:opacity-50">Guardar cambio</button></div></div></div>}
  </div>;
}

function TextField({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="text-sm font-medium text-slate-700">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>; }
