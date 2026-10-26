import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBell, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import logoSimbara from '../assets/logo.png';

const TopBar = ({ searchMenu, setSearchMenu, setActiveTab }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('simbara_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ambil data produk untuk notifikasi stok otomatis (Real-Time Polling)
  useEffect(() => {
    const checkStockAndNotifications = () => {
      fetch('http://localhost:5000/api/products')
        .then((res) => res.json())
        .then((products) => {
          const newNotifs = [];

          // Cek jika ada produk stok habis / menipis
          products.forEach((product) => {
            if (product.stock === 0) {
              newNotifs.push({
                id: `out-${product.id}`,
                title: 'Stok Habis!',
                message: `${product.name} sudah habis porsinya.`,
                type: 'danger',
                time: 'Baru saja'
              });
            } else if (product.stock <= 3) {
              newNotifs.push({
                id: `low-${product.id}`,
                title: 'Stok Menipis!',
                message: `Sisa ${product.stock} porsi untuk ${product.name}.`,
                type: 'warning',
                time: 'Baru saja'
              });
            }
          });

          // Notifikasi pengingat shift
          newNotifs.push({
            id: 'shift-info',
            title: 'Shift Aktif',
            message: `Selamat bertugas, ${user?.name || 'Kasir'}!`,
            type: 'info',
            time: 'Sistem'
          });

          setNotifications(newNotifs);
        })
        .catch((err) => console.error('Gagal mengambil data notifikasi:', err));
    };

    // Panggil langsung saat pertama kali render
    checkStockAndNotifications();

    // Jalankan otomatis tiap 5 detik sekali agar real-time
    const interval = setInterval(checkStockAndNotifications, 5000);

    // Bersihkan interval saat komponen ditutup
    return () => clearInterval(interval);
  }, [user]);

  const formattedDate = currentTime.toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString('id-ID', { 
    hour: '2-digit', minute: '2-digit' 
  });

  // Perhitungan notifikasi penting (Warning & Danger)
  const unreadCount = notifications.filter(n => n.type === 'danger' || n.type === 'warning').length;

  const notifRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current && 
        !notifRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-24 bg-white flex items-center justify-between px-8 border-b border-gray-200 z-20 shadow-sm w-full">

      {/* BAGIAN KIRI: LOGO & NAMA */}
      <div 
        onClick={() => setActiveTab('kasir')}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        title="Kembali ke Beranda Kasir"
      >
        <img 
          src={logoSimbara} 
          alt="Logo Simbara" 
          className="h-12 w-auto object-contain" 
        />
        <h1 className="text-3xl text-gray-800 font-jawa tracking-wider mt-5">
          Simbara
        </h1>
      </div>

      {/* BAGIAN TENGAH: SEARCH BAR */}
      <div className="flex-1 max-w-xl px-8">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input 
            type="text" 
            placeholder="Apa yang kamu mau beli ?" 
            value={searchMenu} 
            onChange={(e) => setSearchMenu(e.target.value)} 
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all"
          />
        </div>
      </div>

      {/* BAGIAN KANAN: NOTIFIKASI & PROFIL */}
      <div className="flex items-center gap-6">

        {/* TANGGAL & WAKTU */}
        <div className="hidden md:block text-right border-r border-gray-200 pr-6">
          <p className="text-sm font-bold text-gray-800">{formattedTime} WIB</p>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
        
        {/* POP-UP NOTIFIKASI DENGAN BADGE */}
        <div className="relative">
          <button 
            ref={buttonRef} // <-- 1. Pasang ref di tombol lonceng
            onClick={() => setShowNotif((prev) => !prev)}
            className="relative p-2 text-gray-500 hover:text-[#F3AB33] transition-colors"
          >
            <FiBell className="text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              {/* 1. Backdrop transparan menutupi seluruh layar browser */}
              <div 
                className="fixed inset-0 z-30 bg-transparent" 
                onClick={() => setShowNotif(false)}
              />

              {/* 2. Kotak Pop-up Notifikasi (diberi z-40 agar berada di atas backdrop) */}
              <div ref={notifRef} className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-40 animate-fade-in">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Notifikasi
                  </h3>
                  <span className="text-[10px] bg-amber-50 text-[#F3AB33] font-bold px-2 py-0.5 rounded-full">
                    {notifications.length} Pesan
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-500">Tidak ada notifikasi baru.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-xl border text-left transition-all ${
                          item.type === 'danger' 
                            ? 'bg-red-50/60 border-red-100' 
                            : item.type === 'warning' 
                            ? 'bg-amber-50/60 border-amber-100' 
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {item.type === 'danger' && <FiAlertTriangle className="text-red-500 text-base" />}
                            {item.type === 'warning' && <FiAlertTriangle className="text-amber-500 text-base" />}
                            {item.type === 'info' && <FiInfo className="text-blue-500 text-base" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-gray-800">{item.title}</h4>
                              <span className="text-[9px] text-gray-400 font-medium">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{item.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* PROFIL AKUN */}
        <div 
          onClick={() => setActiveTab('akun')} 
          className="flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer hover:opacity-80 transition-opacity"
          title="Buka Pengaturan Akun"
        >
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">
              {user?.name || 'Kasir'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'admin' ? 'Super Admin' : user?.role || 'Kasir 1'}
            </p>
          </div>
          <div className="w-11 h-11 bg-gray-200 rounded-full overflow-hidden border-2 border-[#F3AB33]">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Kasir')}&background=F3AB33&color=fff`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default TopBar;