import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TopBar from './components/Topbar';
import Sidebar from './components/SideBar';
import MenuGrid from './components/MenuGrid';
import BillDetails from './components/BillDetails';
import StockMenu from './components/StockMenu';
import OrderHistory from './components/OrderHistory';
import Account from './components/Account';
import UserManagement from './components/UserManagement';
import SalesReport from './components/SalesReport';

function App() {
  const [user, setUser] = useState(null);   
  const [activeTab, setActiveTab] = useState('kasir');
  const [searchMenu, setSearchMenu] = useState('');
  const [cartItems, setCartItems] = useState({});

  // Auto-login jika token/user tersimpan di browser
  useEffect(() => {
    const savedUser = localStorage.getItem('simbara_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('simbara_token');
    localStorage.removeItem('simbara_user');
    setUser(null);
    setActiveTab('kasir'); // Reset tab balik ke kasir
  };

  // Jika belum login, tampilkan Halaman Login saja
  if (!user) {
    return <Login onLogin={(userData) => setUser(userData)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#F9F7F3] font-sans overflow-hidden">
      
      <TopBar 
        searchMenu={searchMenu} 
        setSearchMenu={setSearchMenu} 
        setActiveTab={setActiveTab} 
      />

      <div className="flex-1 flex overflow-hidden">
          
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout} 
            userRole={user?.role} 
          />

          {activeTab === 'kasir' && (
            <>
              <MenuGrid searchMenu={searchMenu} cartItems={cartItems} setCartItems={setCartItems} />
              <div className="w-[380px] min-w-[380px] flex-shrink-0 bg-white shadow-xl p-5 flex flex-col z-10 border-l border-gray-100">
                <BillDetails cartItems={cartItems} setCartItems={setCartItems} />
              </div>
            </>
          )}

          {/* PASSING PROPS userRole DI SINI */}
          {activeTab === 'produk' && <StockMenu userRole={user?.role} />}
          {activeTab === 'riwayat' && <OrderHistory />}
          {activeTab === 'akun' && <Account onLogout={handleLogout} user={user} />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'laporan' && <SalesReport />}

      </div>
    </div>
  );
}

export default App;