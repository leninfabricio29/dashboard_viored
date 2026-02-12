import { useState, useEffect } from 'react';
import { Key, Plus, X, Copy, Check, Clock, AlertCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import { keysService, ApiKey } from '../../../services/keys-service';

type ExpiryOption = '3M' | '6M' | '12M';

interface CreateKeyForm {
  name: string;
  expires: ExpiryOption;
}

const EXPIRY_OPTIONS: { value: ExpiryOption; label: string; description: string }[] = [
  { value: '3M',  label: '3 Meses',  description: 'Corta duración' },
  { value: '6M',  label: '6 Meses',  description: 'Recomendado'    },
  { value: '12M', label: '12 Meses', description: 'Larga duración' },
];

export const KeysPage = () => {
  const [keys, setKeys]           = useState<ApiKey[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [newKey, setNewKey]       = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [form, setForm]           = useState<CreateKeyForm>({ name: '', expires: '6M' });
  const [formError, setFormError] = useState<string | null>(null);

  /* ── Data fetching ────────────────────────────────────────────── */
  const fetchKeys = async () => {
    try {
      const data = await keysService.getAllKeys();
      setKeys(data);
    } catch {
      setError('Error al cargar las llaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  /* ── Handlers ─────────────────────────────────────────────────── */
  const openModal  = () => { setForm({ name: '', expires: '6M' }); setFormError(null); setNewKey(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setNewKey(null); setCopied(false); };

  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError('El nombre es obligatorio.'); return; }
    setFormError(null);
    setCreating(true);
    try {
      const response = await keysService.createKey({ name: form.name.trim(), expires: form.expires });
      setNewKey(response.apiKey);
      await fetchKeys();
    } catch {
      setFormError('Error al crear la llave. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Render ───────────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Clock className="animate-spin mr-2 w-5 h-5" /> Cargando llaves…
    </div>
  );

  return (
    <div className="min-h-screen  text-black p-6 ">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
            <Key className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black">API Keys</h1>
            <p className="text-xs text-slate-500">{keys.length} {keys.length === 1 ? 'llave registrada' : 'llaves registradas'}</p>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex cursor-pointer items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                     text-white text-sm px-4 py-2 rounded-lg transition-colors duration-150 font-semibold"
        >
          <Plus className="w-4 h-4" /> Nueva Key
        </button>
      </div>

      {/* ── Error global ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Keys list ── */}
      <div className="space-y-3">
        {keys.length === 0 && (
          <p className="text-center text-slate-500 py-16 text-sm">No hay llaves aún. Crea una.</p>
        )}
        {keys.map((key) => (
          <div
            key={key._id}
            className="flex items-center justify-between bg-slate-800 border border-slate-800
                       hover:border-slate-700 rounded-xl px-5 py-4 transition-colors duration-150"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-1.5 rounded-md ${key.isActive ? 'bg-emerald-500/10' : 'bg-slate-700/50'}`}>
                {key.isActive
                  ? <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  : <ShieldOff    className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{key.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {key.expiresAt
                    ? `Expira ${new Date(key.expiresAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : 'Sin expiración'}
                </p>
              </div>
            </div>

            <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
              key.isActive
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-slate-700/50  text-slate-400  ring-1 ring-slate-600/50'
            }`}>
              {key.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Modal – Crear nueva key
      ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={!newKey ? closeModal : undefined}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <h2 className="font-bold text-white text-sm">Nueva API Key</h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* ── Si ya se generó la key ── */}
              {newKey ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      Esta es la <strong>única vez</strong> que verás esta clave. Cópiala y guárdala ahora.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Tu nueva API Key</label>
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5">
                      <code className="text-xs text-emerald-400 flex-1 break-all">{newKey}</code>
                      <button
                        onClick={handleCopy}
                        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors ml-2"
                        title="Copiar"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className=" cursor-pointer w-full bg-slate-700 hover:bg-slate-600 text-white text-sm
                               py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                /* ── Formulario de creación ── */
                <div className="space-y-5">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">
                      Nombre del dispositivo / servicio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: ESP32 Sala, Raspberry Pi #2…"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500
                                 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500
                                 outline-none transition-colors"
                    />
                  </div>

                  {/* Expiración – radio buttons */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-3 block">
                      Duración de la key
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {EXPIRY_OPTIONS.map(opt => {
                        const selected = form.expires === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`cursor-pointer rounded-xl border p-3 text-center transition-all duration-150
                              ${selected
                                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40'
                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                              }`}
                          >
                            <input
                              type="radio"
                              name="expires"
                              value={opt.value}
                              checked={selected}
                              onChange={() => setForm(f => ({ ...f, expires: opt.value }))}
                              className="sr-only"
                            />
                            <span className={`block text-sm font-bold mb-0.5 ${selected ? 'text-indigo-300' : 'text-slate-200'}`}>
                              {opt.label}
                            </span>
                            <span className="block text-xs text-slate-500">{opt.description}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error de formulario */}
                  {formError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" /> {formError}
                    </p>
                  )}

                  {/* Botones */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={closeModal}
                      className="cursor-pointer flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm
                                 py-2.5 rounded-lg font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="cursor-pointer flex-1 flex items-center justify-center gap-2 bg-indigo-600
                                 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                                 text-white text-sm py-2.5 rounded-lg font-semibold transition-colors"
                    >
                      {creating ? (
                        <><Clock className="w-4 h-4 animate-spin" /> Creando…</>
                      ) : (
                        <><Plus className="w-4 h-4" /> Crear Key</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};