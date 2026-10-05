import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiDownload, 
  FiCalendar, 
  FiDollarSign,
  FiCheckCircle,
  FiTrendingUp,
  FiPrinter
} from 'react-icons/fi';

const SalesReport = () => {
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Ambil Data Laporan Penjualan dari Backend
  const fetchSalesReport = async () => {
    try {
      let url = 'http://localhost:5000/api/orders/report';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Gagal mengambil data laporan:', error);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [startDate, endDate]);

  const filteredReport = reportData.filter((item) => {
    const matchSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customer && item.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.cashier && item.cashier.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const completedTransactions = reportData.filter(h => h.status === 'Lunas');
  const totalRevenue = completedTransactions.reduce((sum, h) => sum + Number(h.total), 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F9F7F3]">
      
      {/* HEADER & EXPORT ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Laporan Penjualan</h1>
          <p className="text-xs text-gray-500 mt-1">
            Pantau performa omset dan rekap seluruh transaksi kedai.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
            <FiPrinter className="text-lg" />
            Cetak
          </button>
        </div>
      </div>

      {/* RINGKASAN STATISTIK LAPORAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <FiDollarSign className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Total Omset Bersih</p>
            <h3 className="text-2xl font-black text-gray-800">{formatRupiah(totalRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <FiCheckCircle className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Transaksi Sukses</p>
            <h3 className="text-2xl font-black text-gray-800">{completedTransactions.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-[#F3AB33]">
            <FiTrendingUp className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Rata-rata Transaksi</p>
            <h3 className="text-2xl font-black text-gray-800">
              {formatRupiah(completedTransactions.length > 0 ? totalRevenue / completedTransactions.length : 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* FILTER TANGGAL & PENCARIAN */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-end md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dari Tanggal</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-40 bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:border-[#F3AB33]" />
            </div>
          </div>
          <span className="hidden sm:block text-gray-400 mt-4">-</span>
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sampai Tanggal</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-40 bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:border-[#F3AB33]" />
            </div>
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="mt-4 text-xs font-bold text-red-500 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Cari ID / Pelanggan / Kasir..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:border-[#F3AB33]"
          />
        </div>
      </div>

      {/* TABEL LAPORAN */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">ID & Waktu</th>
              <th className="py-3.5 px-4">Pelanggan</th>
              <th className="py-3.5 px-4">Kasir</th>
              <th className="py-3.5 px-4">Pembayaran</th>
              <th className="py-3.5 px-4 text-right">Total</th>
              <th className="py-3.5 px-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredReport.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                  Tidak ada data transaksi ditemukan.
                </td>
              </tr>
            ) : (
              filteredReport.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-5">
                    <p className="font-bold text-gray-800">{item.id}</p>
                    <p className="text-[11px] text-gray-500">{item.date}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{item.customer || 'Pelanggan Anonim'}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-gray-600">{item.cashier}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-gray-600">{item.paymentMethod}</td>
                  <td className="py-3 px-4 font-extrabold text-gray-800 text-right">{formatRupiah(item.total)}</td>
                  <td className="py-3 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'Lunas' 
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'bg-red-50 text-red-500 border border-red-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SalesReport;