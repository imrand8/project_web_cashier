import React, { useState, useEffect } from 'react';
import { 
  FiUserPlus, FiTrash2, FiEdit2, FiShield, FiUserCheck, 
  FiX, FiSearch, FiEye, FiEyeOff, FiAlertTriangle 
} from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Null = Tambah, Object = Edit
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State Toggle Password

  // State Modal Konfirmasi Hapus (Bukan Alert Browser)
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  // State Form
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'kasir',
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
    }
  };

  // === STATE ABSENSI ===
  const [activeTab, setActiveTab] = useState('users'); // 'users' atau 'attendance'
  const [attendances, setAttendances] = useState([]);

  // Ambil Data Rekap Absensi
  const fetchAttendances = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/report');
      const data = await response.json();
      setAttendances(data);
    } catch (error) {
      console.error('Gagal mengambil data absensi:', error);
    }
  };

    useEffect(() => {
    // Panggil bersamaan dengan saat mengambil data users
    fetchAttendances();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'kasir' });
    setErrorMsg('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Kosongkan password saat edit
      role: user.role,
    });
    setErrorMsg('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Submit Tambah / Edit User
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validasi Password
    if (!editingUser && formData.password.length < 8) {
      setErrorMsg('Password wajib diisi minimal 8 karakter!');
      return;
    }

    if (editingUser && formData.password && formData.password.length < 8) {
      setErrorMsg('Password baru minimal harus 8 karakter!');
      return;
    }

    setIsLoading(true);

    const url = editingUser 
      ? `http://localhost:5000/api/users/${editingUser.id}` 
      : 'http://localhost:5000/api/users';
    
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Terjadi kesalahan');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      setErrorMsg('Gagal terhubung ke server');
      setIsLoading(false);
    }
  };

  // Buka Popup Hapus Custom
  const handleConfirmDelete = (id, name) => {
    setDeleteModal({ show: true, id, name });
  };

  // Eksekusi Hapus User
  const executeDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModal({ show: false, id: null, name: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Gagal menghapus user:', error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#F9F7F3]">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Manajemen Pengguna</h2>
          <p className="text-xs text-gray-500 mt-1">Kelola akun Super Admin dan Kasir Simbara POS</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-[#F3AB33]/20 flex items-center justify-center gap-2 text-sm"
        >
          <FiUserPlus className="text-lg" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* FILTER SEARCH */}
      <div className="mb-6 relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
        <input
          type="text"
          placeholder="Cari nama atau username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 text-sm rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all shadow-sm"
        />
      </div>

      {/* TABEL USER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role / Peran</th>
                <th className="px-6 py-4">Jam Masuk</th>
                <th className="px-6 py-4">Jam Pulang</th>
                <th className="px-6 py-4">Status Absen</th>
                <th className="px-6 py-4">Tanggal Dibuat</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            {/* BODY TABEL */}
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                // Cari data absen user ini untuk hari ini
                const todayAbsen = attendances.find(a => a.username === user.username) || null;

                return (
                  <tr key={user.id} className="hover:bg-amber-50/30 transition-all">
                    
                    {/* Profil */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    
                    {/* Username & Role */}
                    <td className="px-6 py-4 text-gray-500">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex w-fit items-center gap-1 ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {user.role === 'admin' ? <FiShield /> : <FiUserCheck />}
                        {user.role === 'admin' ? 'Admin' : 'Kasir'}
                      </span>
                    </td>

                    {/* Absensi */}
                    <td className="px-6 py-4 font-bold text-green-600">
                      {todayAbsen ? todayAbsen.clock_in : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500">
                      {todayAbsen ? (todayAbsen.clock_out || 'Belum Pulang') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {!todayAbsen ? (
                        <span className="text-gray-400 text-xs">-</span>
                      ) : !todayAbsen.clock_out ? (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-bold">Sedang Bertugas</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-bold">Selesai</span>
                      )}
                    </td>

                    {/* Tanggal Dibuat */}
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" 
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleConfirmDelete(user.id, user.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                          title="Hapus"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
              
              {/* Jika data kosong setelah dicari */}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400 text-sm">
                    Pengguna tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* MODAL FORM (TAMBAH & EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="text-xl" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: Imran Darajati"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F3AB33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="Contoh: Imran_Admin"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F3AB33]"
                />
              </div>

              {/* INPUT PASSWORD DENGAN TOGGLE VISIBILITY & MIN 8 CHAR */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password {editingUser && <span className="text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required={!editingUser}
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#F3AB33]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role / Hak Akses</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F3AB33]"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#F3AB33]/30 disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* POPUP KONFIRMASI HAPUS CUSTOM (REPLACE BROWSER ALERT) */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Hapus Akun Pengguna?</h3>
            <p className="text-xs text-gray-500 mt-2 mb-6">
              Apakah Anda yakin ingin menghapus akun <span className="font-bold text-gray-700">{deleteModal.name}</span>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, name: '' })}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-500/30"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;