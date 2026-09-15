import React, { useState } from 'react';
import { X, Database, Save, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Heart } from 'lucide-react';
import { getSteinConfig, saveSteinConfig, testSteinConnection } from '../services/steinApi';

export default function SettingsModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getSteinConfig();
  const [sheetName, setSheetName] = useState(currentConfig.sheetName);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSteinConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveSteinConfig({ sheetName: sheetName.trim() || 'Sheet1' });
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-lg shadow-2xl border border-pink-200 p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-pink-500 text-white shadow-md shadow-pink-500/20">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <span>Configuración SteinHQ & Sheets</span>
                <Heart size={15} className="text-pink-500 fill-pink-500" />
              </h2>
              <p className="text-xs text-slate-500">Conexión con tu Google Sheets en vivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-pink-600 p-1.5 rounded-xl hover:bg-pink-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Base de SteinHQ (Google Sheets API)
            </label>
            <input
              type="text"
              readOnly
              value="https://api.steinhq.com/v1/storages/6aa8b24192b1163e9743465f"
              className="input-field bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed border-dashed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la Pestaña / Hoja en tu Google Sheet
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Sheet1 o Hoja 1"
              className="input-field font-mono font-bold text-pink-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Normalmente es <strong>Sheet1</strong> o <strong>Hoja 1</strong> según el idioma de tu Google Sheet.
            </p>
          </div>

          {/* Test connection output */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />}
              <div>
                <div className="font-bold text-sm">{testResult.success ? '¡Conexión Exitosa con Google Sheets!' : 'Aviso de Conexión'}</div>
                <div className="text-xs opacity-90 mt-0.5">{testResult.message}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
