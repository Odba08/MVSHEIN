import React, { useState } from 'react';
import { Mail, Lock, Heart, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDF2F8]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-fuchsia-200 overflow-hidden animate-fade-in">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 p-8 text-white text-center relative">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner mb-3">
            🛍️
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
            <span>MV SHEIN</span>
            <Heart size={20} className="fill-white text-white" />
          </h1>
          <p className="text-xs text-pink-100 mt-1 font-medium">
            Control de Carritos, Guías, Comisiones y Google Sheets
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-fuchsia-500" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@shein.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock size={14} className="text-fuchsia-500" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fuchsia-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold animate-fade-in">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-fuchsia-500/30 mt-2"
            >
              <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              Acceso restringido para el equipo de <strong>MV SHEIN</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
