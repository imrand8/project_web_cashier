import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FiUser, FiShoppingBag, FiCoffee, FiX, FiShoppingCart, FiCheckCircle, FiPrinter } from 'react-icons/fi';

const BillDetails = ({ cartItems, setCartItems }) => {
const [products, setProducts] = useState([]);
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [paymentMethod, setPaymentMethod] = useState('Tunai'); // 'Tunai', 'QRIS', 'Debit'
const [cashGiven, setCashGiven] = useState(''); // Nominal uang tunai dari pembeli
const [orderType, setOrderType] = useState('Dine In');
const [customerName, setCustomerName] = useState('');   
const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Modal Struk Sukses

const user = JSON.parse(localStorage.getItem('simbara_user')); // Ambil data kasir yg login

useEffect(() => {
  fetch('http://localhost:5000/api/products')
    .then(res => res.json())
    .then(data => setProducts(data));
}, []);

const cartArray = Object.keys(cartItems).map(id => {
    // Pastikan mencari dari state 'products', bukan MOCK_PRODUCTS
    const product = products.find(p => p.id === parseInt(id)); 
    // Beri fallback jika product belum ter-load dari API
    return product ? { ...product, qty: cartItems[id] } : null; 
  }).filter(item => item !== null); //

  const subtotal = cartArray.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.11; // PPN 11%
  const total = subtotal + tax;

  // Hitung Kembalian
  const changeAmount = (parseFloat(cashGiven) || 0) - total;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  // Fungsi Hapus Per Item
  const handleRemoveItem = (id) => {
    const updatedCart = { ...cartItems };
    delete updatedCart[id];
    setCartItems(updatedCart);
  };

  // 1. Saat Klik "Proses Pembayaran" di Sidebar
  const handlePayment = () => {
    if (cartArray.length === 0) return;
    
    if (!customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Perhatian!',
        text: 'Nama pelanggan wajib diisi sebelum memproses pembayaran.',
        confirmButtonColor: '#F3AB33',
        customClass: {
          popup: 'rounded-2xl'
        }
      });
      return;
    }

    setCashGiven(total.toString());
    setIsPaymentModalOpen(true);
  };

  // 2. Saat Klik "Konfirmasi Bayar" di Modal
  const handleFinishTransaction = async () => {
    const orderData = {
      user_id: user?.id || null,
      customer_name: customerName,
      order_type: orderType,
      payment_method: paymentMethod,
      total_amount: total,
      items: cartArray
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      }); 

      if (response.ok) {
        setIsPaymentModalOpen(false);

        // POP-UP SUKSES DENGAN SWEETALERT2
        Swal.fire({
          icon: 'success',
          title: 'Pembayaran Berhasil!',
          html: `
            <p class="text-xs text-gray-500 mb-4">Transaksi telah dicatat ke dalam sistem.</p>
            <div class="text-xs text-left bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
              <div class="flex justify-between">
                <span class="text-gray-500">Pelanggan</span>
                <span class="font-bold text-gray-800">${customerName || 'Pelanggan Anonim'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Tipe / Metode</span>
                <span class="font-bold text-gray-800">${orderType} • ${paymentMethod}</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200">
                <span class="text-gray-500">Total Bayar</span>
                <span class="font-extrabold text-[#F3AB33]">${formatRupiah(total)}</span>
              </div>
              ${paymentMethod === 'Tunai' ? `
              <div class="flex justify-between">
                <span class="text-gray-500">Kembalian</span>
                <span class="font-bold text-green-600">${formatRupiah(changeAmount)}</span>
              </div>` : ''}
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Transaksi Baru',
          cancelButtonText: 'Cetak Struk',
          reverseButtons: true,
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-2xl w-full max-w-sm p-5',
            confirmButton: 'bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold py-2.5 px-4 rounded-xl text-xs w-full transition-all shadow-md',
            cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs w-full transition-all mr-2',
            actions: 'mt-4 flex w-full justify-between gap-2'
          },
          timer: 3500, // Dipercepat menjadi 3.5 detik
          timerProgressBar: true,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.cancel) {
            window.print(); // Cetak struk jika tombol cetak diklik
          }
          handleResetAll(); // Reset form & keranjang untuk transaksi baru
        });

      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Gagal!', 
          text: 'Gagal memproses transaksi ke database.',
          confirmButtonColor: '#F3AB33'
        });
      }
    } catch (error) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Kesalahan Server', 
        text: 'Terjadi kesalahan pada koneksi server.',
        confirmButtonColor: '#F3AB33'
      });
    }
  };

  // 3. Reset Setelah Transaksi Selesai / Pesanan Baru
  const handleResetAll = () => {
    setIsSuccessModalOpen(false);
    setCartItems({});
    setCustomerName('');
    setCashGiven('');
  };

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* HEADER (Hanya Judul Saja Sekarang) */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-gray-800">Pesanan Saat Ini</h2>
      </div>

      {/* INPUT NAMA & TIPE PESANAN (TAMBAHKAN KODE INI) */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Nama Pelanggan (Wajib Diisi)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all"
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setOrderType('Dine In')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
              orderType === 'Dine In'
                ? 'bg-white text-[#F3AB33] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FiCoffee className="text-sm" /> Dine In
          </button>
          <button
            onClick={() => setOrderType('Take Away')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
              orderType === 'Take Away'
                ? 'bg-white text-[#F3AB33] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FiShoppingBag className="text-sm" /> Take Away
          </button>
        </div>
      </div>

      {/* Jika Keranjang Kosong, Tampilkan Ilustrasi Ini */}
      {cartArray.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-70">
          <FiShoppingCart className="text-6xl mb-4 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">Belum ada pesanan</p>
          <p className="text-xs text-gray-400 mt-1">Silakan pilih menu di sebelah kiri</p>
        </div>
      ) : (
        /* Jika Ada Keranjang, Tampilkan Daftarnya */
        <>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {cartArray.map((item) => (
              <div key={item.id} className="flex items-center gap-3 group">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-extrabold text-gray-800">
                    {formatRupiah(item.price * item.qty)}
                  </span>
                  <span className="text-[10px] font-bold text-[#F3AB33] bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                    x {item.qty}
                  </span>
                </div>
                {/* Hubungkan onClick ke handleRemoveItem */}
                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all ml-1"
                  title="Hapus Item"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-4 mt-2 space-y-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Pajak (11%)</span>
              <span>{formatRupiah(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-800 pt-2 border-t border-gray-100 mt-2">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>

            <div className="flex gap-2 mt-4 pt-2">
              {/* Hubungkan onClick ke handlePayment */}
              <button 
                onClick={handlePayment}
                className="flex-1 bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-[#F3AB33]/30 active:scale-95 flex items-center justify-center gap-2"
              >
                Proses Pembayaran
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= MODAL 1: PILIH PEMBAYARAN ================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Selesaikan Pembayaran</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Ringkasan Tagihan */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/60 mb-5 text-center">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Tagihan</p>
              <h2 className="text-3xl font-black text-[#F3AB33] mt-1">{formatRupiah(total)}</h2>
            </div>

            {/* Opsi Metode Pembayaran */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {['Tunai', 'QRIS', 'Debit'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      paymentMethod === method
                        ? 'bg-[#F3AB33] text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Nominal Jika Pembayaran Tunai */}
            {paymentMethod === 'Tunai' && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Uang Diterima</label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-lg font-bold text-gray-800 focus:border-[#F3AB33] outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Tombol Cepat Nominal Uang */}
                <div className="flex gap-2">
                  {[total, 50000, 100000].map((nominal) => (
                    <button
                      key={nominal}
                      onClick={() => setCashGiven(nominal.toString())}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-bold text-gray-600"
                    >
                      {nominal === total ? 'Uang Pas' : formatRupiah(nominal)}
                    </button>
                  ))}
                </div>

                {/* Kembalian */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-500">Kembalian</span>
                  <span className={`text-base font-black ${changeAmount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {changeAmount < 0 ? 'Uang Kurang' : formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Tombol Konfirmasi */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleFinishTransaction}
                disabled={paymentMethod === 'Tunai' && changeAmount < 0}
                className="flex-1 py-3 bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#F3AB33]/30 disabled:opacity-50"
              >
                Bayar Sekarang
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default BillDetails;