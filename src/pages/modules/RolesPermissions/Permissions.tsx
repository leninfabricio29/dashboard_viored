import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Swal from 'sweetalert2';
import { FiAlertCircle, FiBox, FiFileText, FiHome, FiLock, FiPlus, FiSave, FiShield, FiUsers, FiX } from 'react-icons/fi';
import accessService, { AccessPermission, AccessRole, CreateModuleInput, CreatePermissionInput } from '../../../services/access-service';

const moduleIcons: Record<string, ReactNode> = {
  dashboard: <FiHome className="text-blue-500" />, alerts: <FiAlertCircle className="text-amber-500" />,
  reports: <FiFileText className="text-emerald-500" />, users: <FiUsers className="text-violet-500" />,
  permissions: <FiLock className="text-rose-500" />,
};
const emptyModule: CreateModuleInput = { name: '', category: '', icon: '', route: '', is_visible: true };
const emptyPermission: CreatePermissionInput = { name: '', action: 'read', module: '', description: '' };
const getModuleName = (permission: AccessPermission) => typeof permission.module === 'string' ? 'Sin módulo' : permission.module.name;
const getErrorMessage = (error: unknown) => (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'No fue posible completar la operación.';

export default function Permissions() {
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [modules, setModules] = useState<{ _id: string; name: string }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'role' | 'module' | 'permission' | null>(null);
  const [roleName, setRoleName] = useState('');
  const [moduleForm, setModuleForm] = useState<CreateModuleInput>(emptyModule);
  const [permissionForm, setPermissionForm] = useState<CreatePermissionInput>(emptyPermission);
  const isAdmin = ['admin', 'superadmin'].includes(localStorage.getItem('role') || '');

  const loadData = useCallback(async (preferredRoleId?: string | null) => {
    setLoading(true); setError('');
    try {
      const [rolesData, permissionsData, modulesData] = await Promise.all([accessService.getRoles(), accessService.getPermissions(), accessService.getModules()]);
      setRoles(rolesData); setPermissions(permissionsData); setModules(modulesData);
      setSelectedRoleId((current) => {
        const candidate = preferredRoleId || current;
        return rolesData.some((role) => role._id === candidate) ? candidate! : rolesData[0]?._id ?? null;
      });
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  const selectedRole = roles.find((role) => role._id === selectedRoleId) ?? null;
  useEffect(() => { setDraftPermissionIds(selectedRole?.permissions.map((permission) => permission._id) ?? []); }, [selectedRole]);

  const draftSet = useMemo(() => new Set(draftPermissionIds), [draftPermissionIds]);
  const permissionsByModule = useMemo(() => permissions.reduce<Record<string, AccessPermission[]>>((groups, permission) => {
    const module = getModuleName(permission); groups[module] = [...(groups[module] || []), permission]; return groups;
  }, {}), [permissions]);
  const hasChanges = selectedRole && draftPermissionIds.slice().sort().join(',') !== selectedRole.permissions.map((permission) => permission._id).slice().sort().join(',');

  const createRole = async () => {
    if (!roleName.trim()) return;
    setSaving(true); setError('');
    try { const role = await accessService.createRole(roleName.trim()); setRoleName(''); setModal(null); await loadData(role._id); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };
  const createModule = async () => {
    setSaving(true); setError('');
    try { await accessService.createModule(moduleForm); setModuleForm(emptyModule); setModal(null); await loadData(); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };
  const createPermission = async () => {
    setSaving(true); setError('');
    try { await accessService.createPermission(permissionForm); setPermissionForm(emptyPermission); setModal(null); await loadData(selectedRoleId); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };
  const savePermissions = async () => {
    if (!selectedRole || !hasChanges) return;
    const selectedPermissions = permissions.filter((permission) => draftSet.has(permission._id));
    const result = await Swal.fire({
      title: `¿Guardar permisos de ${selectedRole.name}?`,
      html: selectedPermissions.length ? `<p class="mb-2">Este rol tendrá los siguientes permisos:</p><ul style="text-align:left;max-height:220px;overflow:auto">${selectedPermissions.map((permission) => `<li>• ${getModuleName(permission)}: ${permission.name}</li>`).join('')}</ul>` : '<p>El rol quedará sin permisos asignados.</p>',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, guardar', cancelButtonText: 'Cancelar', confirmButtonColor: '#2563eb',
    });
    if (!result.isConfirmed) return;
    setSaving(true); setError('');
    try { await accessService.assignPermissions(selectedRole._id, draftPermissionIds); await loadData(selectedRole._id); await Swal.fire({ icon: 'success', title: 'Permisos actualizados', timer: 1600, showConfirmButton: false }); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /></div>;
  return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-7xl">
    <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div><h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><FiShield className="text-blue-600" /> Roles y permisos</h2><p className="mt-1 text-sm text-slate-500">{isAdmin ? 'Administra módulos, permisos y roles del sistema.' : 'Crea roles para tu entidad y define sus accesos.'}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setModal('role')} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"><FiPlus /> Crear rol</button>{isAdmin && <><button onClick={() => setModal('permission')} className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"><FiLock /> Crear permiso</button><button onClick={() => setModal('module')} className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"><FiBox /> Crear módulo</button></>}</div></div>
    {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="flex flex-col gap-6 md:flex-row"><aside className="overflow-hidden rounded-lg bg-white shadow md:w-72"><div className="border-b border-slate-100 p-4 font-semibold text-slate-700">{isAdmin ? 'Roles del sistema' : 'Mis roles'}</div><div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">{roles.length === 0 ? <p className="p-5 text-center text-sm text-slate-500">No hay roles disponibles.</p> : roles.map((role) => <button key={role._id} onClick={() => setSelectedRoleId(role._id)} className={`w-full p-4 text-left transition hover:bg-slate-50 ${selectedRoleId === role._id ? 'border-l-4 border-blue-600 bg-blue-50' : ''}`}><p className="font-medium capitalize text-slate-800">{role.name}</p><p className="mt-1 text-xs text-slate-500">{role.permissions.length} permisos asignados</p></button>)}</div></aside>
    <main className="min-h-80 flex-1 overflow-hidden rounded-lg bg-white shadow">{!selectedRole ? <div className="flex h-64 flex-col items-center justify-center text-slate-400"><FiShield size={48} /><p className="mt-3">Crea o selecciona un rol.</p></div> : <><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4"><div><h3 className="font-semibold capitalize text-slate-800">{selectedRole.name}</h3><p className="text-sm text-slate-500">Marca los permisos y confirma los cambios al finalizar.</p></div><button disabled={!hasChanges || saving} onClick={() => void savePermissions()} className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"><FiSave /> {saving ? 'Guardando…' : 'Guardar permisos'}</button></div><div className="max-h-[600px] space-y-6 overflow-y-auto p-5">{Object.entries(permissionsByModule).map(([module, modulePermissions]) => { const assigned = modulePermissions.filter((permission) => draftSet.has(permission._id)).length; return <section key={module}><div className="mb-3 flex items-center gap-2"><span>{moduleIcons[module.toLowerCase()] || <FiShield className="text-slate-500" />}</span><h4 className="font-medium text-slate-700">{module}</h4><span className="text-xs text-slate-400">({assigned}/{modulePermissions.length})</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{modulePermissions.map((permission) => <label key={permission._id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-slate-50"><input type="checkbox" disabled={saving} checked={draftSet.has(permission._id)} onChange={() => setDraftPermissionIds((current) => current.includes(permission._id) ? current.filter((id) => id !== permission._id) : [...current, permission._id])} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" /><span><span className="block text-sm font-medium text-slate-700">{permission.name}</span><span className="block text-xs text-slate-500">{permission.description || permission.action}</span></span></label>)}</div></section>; })}{permissions.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No hay permisos configurados.</p>}</div></>}</main></div>
  </div>
  {modal === 'role' && <Modal title="Crear rol" onClose={() => setModal(null)}><label className="block text-sm font-medium text-slate-700">Nombre del rol<input autoFocus value={roleName} onChange={(event) => setRoleName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><Actions disabled={saving || !roleName.trim()} onCancel={() => setModal(null)} onConfirm={() => void createRole()} label="Crear rol" /></Modal>}
  {modal === 'module' && <Modal title="Crear módulo" onClose={() => setModal(null)}><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre" value={moduleForm.name} onChange={(name) => setModuleForm({ ...moduleForm, name })} /><Field label="Categoría" value={moduleForm.category} onChange={(category) => setModuleForm({ ...moduleForm, category })} /><Field label="Icono" value={moduleForm.icon} onChange={(icon) => setModuleForm({ ...moduleForm, icon })} placeholder="Ej. FiShield" /><Field label="Ruta" value={moduleForm.route} onChange={(route) => setModuleForm({ ...moduleForm, route })} placeholder="Ej. /mi-modulo" /></div><label className="mt-3 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={moduleForm.is_visible} onChange={(event) => setModuleForm({ ...moduleForm, is_visible: event.target.checked })} /> Visible en el menú</label><Actions disabled={saving || !moduleForm.name || !moduleForm.category || !moduleForm.icon || !moduleForm.route} onCancel={() => setModal(null)} onConfirm={() => void createModule()} label="Crear módulo" /></Modal>}
  {modal === 'permission' && <Modal title="Crear permiso" onClose={() => setModal(null)}><div className="space-y-3"><Field label="Nombre" value={permissionForm.name} onChange={(name) => setPermissionForm({ ...permissionForm, name })} placeholder="Ej. Ver reportes" /><label className="block text-sm font-medium text-slate-700">Módulo<select value={permissionForm.module} onChange={(event) => setPermissionForm({ ...permissionForm, module: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Selecciona un módulo</option>{modules.map((module) => <option key={module._id} value={module._id}>{module.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Acción<select value={permissionForm.action} onChange={(event) => setPermissionForm({ ...permissionForm, action: event.target.value as CreatePermissionInput['action'] })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">{['create', 'read', 'update', 'delete', 'export'].map((action) => <option key={action} value={action}>{action}</option>)}</select></label><Field label="Descripción" value={permissionForm.description} onChange={(description) => setPermissionForm({ ...permissionForm, description })} /></div><Actions disabled={saving || !permissionForm.name || !permissionForm.module || !permissionForm.description} onCancel={() => setModal(null)} onConfirm={() => void createPermission()} label="Crear permiso" /></Modal>}
  </div>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-800">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FiX size={22} /></button></div>{children}</div></div>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="block text-sm font-medium text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>; }
function Actions({ disabled, onCancel, onConfirm, label }: { disabled: boolean; onCancel: () => void; onConfirm: () => void; label: string }) { return <div className="mt-5 flex justify-end gap-3"><button onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700">Cancelar</button><button disabled={disabled} onClick={onConfirm} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{label}</button></div>; }
