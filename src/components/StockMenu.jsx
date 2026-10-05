import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

import { 
  FiSearch, 
  FiPlus, 
  FiBox, 
  FiCheckCircle, 
  FiXCircle, 
  FiEdit2, 
  FiTrash2 
} from 'react-icons/fi';

const CATEGORIES = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Camilan'];
const API_URL = 'http://localhost:5000/api/products';

const StockMenu = ({ userRole = 'kasir' }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' atau 'edit'
  const [formData, setFormData] = useState({ 
    id: null,
    name: '', 
    category: 'Kopi', 
    price: '', 
    stock: '', 
    image: '' 
  });

  // 1. GET DATA PRODUK DARI BACKEND
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Gagal mengambil data produk');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Gagal terhubung ke server database produk!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter Produk Berdasarkan Kategori dan Pencarian
  const filteredProducts = products.filter((item) => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const totalProducts = products.length;
  const availableCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = totalProducts - availableCount;

  // Modal Helper
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: null, name: '', category: 'Kopi', price: '', stock: '', image: '' }); 
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setFormData({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image: product.image || ''
    }); 
    setIsModalOpen(true);
  };

  // Mengubah file gambar dari komputer menjadi format Base64 text
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result }); // Simpan hasil konversi
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. TAMBAH & EDIT PRODUK (POST / PUT)
  const handleSave = async (e) => {
    e.preventDefault();

// GANTI alert('Mohon isi nama...') menjadi:
    if (!formData.name || !formData.price || formData.stock === '') {
      Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi nama, harga, dan stok produk!', confirmButtonColor: '#F3AB33' });
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      image: formData.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80'
    };

    try {
      const url = modalMode === 'add' ? API_URL : `${API_URL}/${formData.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Terjadi kesalahan saat menyimpan data');
      }

      Swal.fire({ 
        icon: 'success', 
        title: 'Berhasil!', 
        text: modalMode === 'add' ? 'Produk berhasil ditambahkan!' : 'Produk berhasil diupdate!',
        timer: 1500, 
        showConfirmButton: false 
      });
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      // GANTI alert(error.message) menjadi:
      Swal.fire({ icon: 'error', title: 'Gagal Menyimpan', text: error.message, confirmButtonColor: '#F3AB33' });
    }
  };

  // 3. HAPUS PRODUK (DELETE)
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: "Data produk yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const resData = await response.json();

        if (!response.ok) throw new Error(resData.error || 'Gagal menghapus produk');

        Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Produk berhasil dihapus.', timer: 1500, showConfirmButton: false });
        fetchProducts(); 
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire({ icon: 'error', title: 'Gagal!', text: error.message });
      }
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F9F7F3]">
      
      {/* HEADER & TOMBOL TAMBAH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Kelola Stok & Menu</h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin 
              ? "Atur sisa porsi, ketersediaan menu, dan harga produk Simbara Coffee."
              : "Pantau sisa porsi dan ketersediaan menu Simbara Coffee."}
          </p>
        </div>

        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#F3AB33]/20 active:scale-95"
          >
            <FiPlus className="text-lg" />
            <span>Tambah Produk</span>
          </button>
        )}
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-[#F3AB33]">
            <FiBox className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Total Menu</p>
            <h3 className="text-xl font-black text-gray-800">{totalProducts} Item</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <FiCheckCircle className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Siap Dijual</p>
            <h3 className="text-xl font-black text-gray-800">{availableCount} Item</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <FiXCircle className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Stok Habis</p>
            <h3 className="text-xl font-black text-gray-800">{outOfStockCount} Item</h3>
          </div>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#F3AB33] text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 text-xs text-gray-700 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-[#F3AB33] transition-all"
          />
        </div>
      </div>

      {/* TABEL STOK */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 font-semibold text-sm">
            Memuat data dari database MySQL...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4">Sisa Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3.5 px-5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-gray-400 text-xs">
                    Tidak ada produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80'}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200"
                        />
                        <span className="font-bold text-gray-800">{item.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-extrabold text-gray-800">
                      {formatRupiah(item.price)}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-700">
                      {item.stock} <span className="font-medium text-xs text-gray-400 ml-1">porsi</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          item.stock > 0
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-red-50 text-red-500 border border-red-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${item.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {item.stock > 0 ? 'Tersedia' : 'Habis'}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-2 text-gray-400 hover:text-[#F3AB33] hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Produk"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Produk"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* POP-UP MODAL TAMBAH/EDIT */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:border-[#F3AB33] outline-none text-sm" 
                  placeholder="Contoh: Kopi Susu Simbara"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:border-[#F3AB33] outline-none text-sm"
                >
                  <option value="Kopi">Kopi</option>
                  <option value="Non-Kopi">Non-Kopi</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Camilan">Camilan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:border-[#F3AB33] outline-none text-sm" 
                    placeholder="18000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stok Awal</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:border-[#F3AB33] outline-none text-sm" 
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Upload Gambar Produk</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:border-[#F3AB33] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-[#F3AB33] hover:file:bg-amber-100 cursor-pointer transition-all" 
                />
                {/* Preview Gambar jika sudah di-upload */}
                {formData.image && formData.image.startsWith('data:image') && (
                  <img src={formData.image} alt="Preview" className="mt-3 w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#F3AB33] hover:bg-[#EAA121] transition-colors shadow-lg shadow-[#F3AB33]/30"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}  

    </div>
  );
};

export default StockMenu;