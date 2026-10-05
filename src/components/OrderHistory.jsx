import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiPrinter, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiDollarSign,
  FiCoffee,
  FiShoppingBag
} from 'react-icons/fi';

const OrderHistory = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState(null);

  // Ambil Data Transaksi Hari Ini dari Backend
  const fetchTodayHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/today');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Gagal mengambil data riwayat:', error);
    }
  };

  useEffect(() => {
    fetchTodayHistory();
  }, []);

  // Tanggal Hari Ini untuk Tampilan Header
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const filteredHistory = history.filter((item) => {
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;
    const matchSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customer && item.customer.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const openDetail = (trx) => {
    setSelectedTrx(trx);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print(); 
  };

  const totalTransactions = history.length;
  const completedTransactions = history.filter(h => h.status === 'Lunas');
  const totalRevenue = completedTransactions.reduce((sum, h) => sum + Number(h.total), 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F9F7F3]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Riwayat Pesanan Hari Ini</h1>
          <p className="text-xs text-gray-500 mt-1">
            Daftar rekapitulasi transaksi kasir khusus tanggal {todayFormatted}.
          </p>
        </div>
      </div>

      {/* RINGKASAN STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-[#F3AB33]">
            <FiClock className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Total Transaksi Hari Ini</p>
            <h3 className="text-xl font-black text-gray-800">{totalTransactions} Transaksi</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <FiDollarSign className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Omset Hari Ini</p>
            <h3 className="text-xl font-black text-gray-800">{formatRupiah(totalRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <FiCheckCircle className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Transaksi Sukses</p>
            <h3 className="text-xl font-black text-gray-800">{completedTransactions.length} Transaksi</h3>
          </div>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {['Semua', 'Selesai', 'Dibatalkan'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-[#F3AB33] text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Cari ID / Nama Pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 text-xs text-gray-700 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-[#F3AB33] transition-all"
          />
        </div>
      </div>

      {/* TABEL DATA RIWAYAT */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">ID Transaksi</th>
              <th className="py-3.5 px-4">Waktu</th>
              <th className="py-3.5 px-4">Pelanggan</th>
              <th className="py-3.5 px-4">Tipe</th>
              <th className="py-3.5 px-4">Pesanan</th>
              <th className="py-3.5 px-4">Pembayaran</th>
              <th className="py-3.5 px-4">Total</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-gray-400 text-xs">
                  Belum ada transaksi hari ini.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-5 font-bold text-gray-800">{item.id}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-gray-500">{item.date}</td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{item.customer || 'Pelanggan Anonim'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                      item.type === 'Dine In' ? 'bg-amber-50 text-[#F3AB33]' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {item.type === 'Dine In' ? <FiCoffee className="text-xs" /> : <FiShoppingBag className="text-xs" />}
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600 max-w-[200px] truncate">
                    {Array.isArray(item.items) && item.items.length > 0 
                      ? item.items.map(i => `${i.qty}x ${i.name}`).join(', ') 
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-gray-600">{item.paymentMethod}</td>
                  <td className="py-3 px-4 font-extrabold text-gray-800">{formatRupiah(item.total)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Lunas' 
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'bg-red-50 text-red-500 border border-red-200'
                      }`}>
                        {item.status === 'Lunas' ? <FiCheckCircle className="text-xs" /> : <FiXCircle className="text-xs" />}
                        {item.status}
                      </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button 
                      onClick={() => openDetail(item)}
                      className="p-2 text-gray-400 hover:text-[#F3AB33] hover:bg-amber-50 rounded-lg transition-all"
                      title="Lihat Detail Transaksi"
                    >
                      <FiPrinter className="text-base" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* POP-UP MODAL CETAK STRUK */}
      {isModalOpen && selectedTrx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-black text-gray-800">Simbara Coffee</h2>
              <p className="text-xs text-gray-500">Jl. Pacitan, Jawa Timur</p>
              <div className="mt-3 text-xs flex justify-between font-medium text-gray-600">
                <span>{selectedTrx.id}</span>
                <span>{selectedTrx.date}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none space-y-3 mb-4">
              {Array.isArray(selectedTrx.items) && selectedTrx.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-800">
                  <span>{item.qty}x {item.name}</span>
                  <span className="font-bold">{formatRupiah(item.price * item.qty)}</span>
                </div>
              ))} 
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Metode Pembayaran</span>
                <span className="font-bold text-gray-800">{selectedTrx.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-[#F3AB33]">
                <span>Total</span>
                <span>{formatRupiah(selectedTrx.total)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#F3AB33] hover:bg-[#EAA121] transition-colors shadow-lg shadow-[#F3AB33]/30"
              >
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistory;