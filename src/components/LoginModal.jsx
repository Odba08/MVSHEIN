import React from 'react';
import { X, UserCheck, Shield, Sparkles, Heart } from 'lucide-react';
import { useAuth, AVAILABLE_USERS } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { currentUser, login } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-md shadow-2xl border border-pink-200 p-6 bg-white">
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-pink-500 text-white shadow-md shadow-pink-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <span>Seleccionar Usuario</span>
                <Heart size={15} className="text-pink-500 fill-pink-500" />
              </h2>
              <p className="text-xs text-slate-500">¿Quién está registrando pedidos hoy?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-pink-600 p-1.5 rounded-xl hover:bg-pink-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 my-5">
          {AVAILABLE_USERS.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            return (
              <button
                key={user.id}
                onClick={() => {
                  login(user.id);
                  onClose();
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 text-left ${
                  isCurrent
                    ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-400/30'
                    : 'bg-white border-pink-200/80 hover:bg-pink-50/70 hover:border-pink-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {user.avatar}
                  </div>
                  <div>
                    <div className="font-extrabold flex items-center gap-2 text-sm">
                      <span>{user.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isCurrent ? 'bg-white/25 text-white' : 'bg-pink-100 text-pink-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className={`text-xs ${isCurrent ? 'text-pink-100' : 'text-slate-400'}`}>
                      {user.email}
                    </div>
                  </div>
                </div>

                {isCurrent && (
                  <div className="flex items-center gap-1 text-white text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                    <UserCheck size={14} />
                    <span>Activa</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="btn-secondary w-full text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
