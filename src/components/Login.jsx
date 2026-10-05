import React, { useState } from 'react';
import { FiLock, FiUser, FiCoffee } from 'react-icons/fi';
import logoSimbara from '../assets/logo.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Tembak API Login Node.js
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Username atau password salah!');
        setIsLoading(false);
        return;
      }

      // Simpan data login ke LocalStorage
      localStorage.setItem('simbara_token', data.token);
      localStorage.setItem('simbara_user', JSON.stringify(data.user));

      setIsLoading(false);
      onLogin(data.user); // Kirim data user yang login ke App.jsx
    } catch (error) {
      setErrorMsg('Gagal terhubung ke server backend.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md flex flex-col items-center">
        
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-3 mb-2">
          <img src={logoSimbara} alt="Simbara Logo" className="h-12 w-auto object-contain" />
          <h1 className="text-3xl text-gray-800 font-jawa tracking-wider mt-2">Simbara</h1>
        </div>
        <p className="text-xs font-semibold text-gray-400 mb-6">Point of Sales & Cashier System</p>

        {/* NOTIFIKASI ERROR (Tampil jika login gagal) */}
        {errorMsg && (
          <div className="w-full bg-red-50 border border-red-200 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-bold">
            {errorMsg}
          </div>
        )}

        {/* FORM LOGIN */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Username / Email</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input 
                type="text" 
                required
                placeholder="Masukkan username kasir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-sm text-gray-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-sm text-gray-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-[#F3AB33]/30 active:scale-95 flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
          >
            <FiCoffee className="text-lg" />
            <span>{isLoading ? 'Memproses...' : 'Masuk ke Kasir'}</span>
          </button>
        </form>

        <p className="text-[11px] text-gray-400 mt-6 text-center">
          Lupa kata sandi? Hubungi Manager / Supervisor.
        </p>

      </div>
    </div>
  );
};

export default Login;