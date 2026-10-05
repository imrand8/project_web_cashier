import React, { useState, useEffect } from 'react';
// Import icon dari react-icons
import { 
  FiGrid, 
  FiCoffee, 
  FiHeart, 
  FiPieChart, 
  FiStar, 
  FiPlus, 
  FiMinus 
} from 'react-icons/fi';

const CATEGORIES = [
  { name: 'Semua', icon: FiGrid },
  { name: 'Kopi', icon: FiCoffee },
  { name: 'Non-Kopi', icon: FiHeart },
  { name: 'Makanan', icon: FiPieChart },
  { name: 'Camilan', icon: FiStar },
];

const MenuGrid = ({ searchMenu, cartItems, setCartItems }) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [products, setProducts] = useState([]);

// Ambil produk dari backend saat komponen dimuat
useEffect(() => {
  fetch('http://localhost:5000/api/products')
    .then(res => res.json())
    .then(data => setProducts(data))
    .catch(err => console.error('Gagal memuat produk:', err));
}, []);

const filteredProducts = products.filter((item) => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes((searchMenu || '').toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAdd = (id, maxStock) => {
    setCartItems((prev) => {
      const currentQty = prev[id] || 0;
      if (currentQty >= maxStock) return prev;
      return { ...prev, [id]: currentQty + 1 };
    });
  };

  const handleSubtract = (id) => {
    setCartItems((prev) => {
      const currentQty = prev[id] || 0;
      if (currentQty <= 1) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: currentQty - 1 };
    });
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F9F7F3]">
      
      {/* FILTER KATEGORI */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-[#F3AB33] text-white shadow-md shadow-[#F3AB33]/20'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="text-base" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* GRID KARTU PRODUK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const isOutOfStock = product.stock === 0;
          const qty = cartItems[product.id] || 0;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                isOutOfStock ? 'opacity-60' : ''
              }`}
            >
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.isBestSeller && !isOutOfStock && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] font-extrabold tracking-wide shadow-md flex items-center gap-1">
                    <FiStar className="text-xs fill-white" />
                    Best Seller
                  </span>
                )}
                <span
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                    isOutOfStock
                      ? 'bg-red-500 text-white'
                      : 'bg-black/60 text-white backdrop-blur-sm'
                  }`}
                >
                  {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-800 line-clamp-1">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-base font-extrabold text-[#F3AB33]">
                  {formatRupiah(product.price)}
                </span>

                {isOutOfStock ? (
                  <span className="text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-lg">
                    Habis
                  </span>
                ) : qty === 0 ? (
                  <button
                    onClick={() => handleAdd(product.id, product.stock)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F3AB33] text-white rounded-xl text-xs font-bold hover:bg-[#EAA121] transition-all shadow-sm active:scale-95"
                  >
                    <FiPlus className="text-sm" />
                    <span>Tambah</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 border border-[#F3AB33]/40 rounded-xl p-1">
                    <button
                      onClick={() => handleSubtract(product.id)}
                      className="w-7 h-7 bg-white text-[#F3AB33] border border-[#F3AB33]/30 rounded-lg flex items-center justify-center hover:bg-[#F3AB33] hover:text-white transition-all active:scale-90"
                    >
                      <FiMinus className="text-xs font-bold" />
                    </button>
                    
                    <span className="text-xs font-extrabold text-gray-800 w-5 text-center">
                      {qty}
                    </span>

                    <button
                      onClick={() => handleAdd(product.id, product.stock)}
                      disabled={qty >= product.stock}
                      className="w-7 h-7 bg-[#F3AB33] text-white rounded-lg flex items-center justify-center hover:bg-[#EAA121] transition-all active:scale-90 disabled:opacity-40"
                    >
                      <FiPlus className="text-xs font-bold" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MenuGrid;