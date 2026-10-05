import React from 'react';
import { FiBox, FiClock, FiLogOut, FiHome, FiUsers, FiTrendingUp } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, onLogout, userRole }) => {
  // Menu dasar yang BISA DILIHAT OLEH KASIR DAN ADMIN
  const menuItems = [
    { id: 'kasir', label: 'Kasir', icon: FiHome },
    { id: 'produk', label: 'Stok & Menu', icon: FiBox },
    { id: 'riwayat', label: 'Riwayat', icon: FiClock },
  ];

  // Menu KHUSUS ADMIN (Hanya bertambah jika login sebagai Admin)
  if (userRole === 'admin') {
    menuItems.push({ id: 'users', label: 'Kelola User', icon: FiUsers });
    menuItems.push({ id: 'laporan', label: 'Laporan', icon: FiTrendingUp });  
  }

  return (
    <div className="w-28 bg-white flex flex-col items-center justify-between py-6 border-r border-gray-200 z-10 h-full select-none">
      
      {/* NAVIGASI UTAMA */}
      <div className="flex flex-col items-center gap-5 w-full px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#F3AB33] text-white shadow-lg shadow-[#F3AB33]/30 scale-105'
                  : 'text-gray-400 hover:bg-amber-50 hover:text-[#F3AB33]'
              }`}
            >
              <Icon className="text-2xl mb-1" />
              <span className="text-[11px] font-semibold text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="w-full px-3">
        <button
          onClick={onLogout}
          className="w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <FiLogOut className="text-2xl mb-1" />
          <span className="text-[11px] font-semibold">Keluar</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;