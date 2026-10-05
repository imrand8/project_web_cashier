import React, { useState, useEffect } from 'react';
import { FiLock, FiLogOut, FiClock, FiCheckCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';

const Account = ({ onLogout, user }) => {
  // Dapatkan inisial nama untuk avatar (maksimal 2 huruf pertama)
  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'US';
  
  // Format tampilan role
  const displayRole = user?.role === 'admin' ? 'Super Admin' : 'Kasir';

  // === STATE ABSENSI ===
  const [attendance, setAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil status absen hari ini
  const fetchAttendance = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/status/${user.id}`);
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Gagal mengambil status absensi:', error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  // Fungsi Absen Masuk
  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      Swal.fire({ icon: 'success', title: 'Absen Masuk Berhasil!', text: `Jam Masuk: ${data.clockIn}`, timer: 1500, showConfirmButton: false });
      fetchAttendance();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
    }
    setIsLoading(false);
  };

  // Fungsi Absen Pulang
  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      Swal.fire({ icon: 'success', title: 'Absen Pulang Berhasil!', text: `Jam Pulang: ${data.clockOut}`, timer: 1500, showConfirmButton: false });
      fetchAttendance();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
    }
    setIsLoading(false);
  };

  // Fungsi Ubah Kata Sandi
const handleChangePassword = () => {
    // String SVG persis Ikon FiEye dan FiEyeOff dari react-icons/fi
    const eyeIcon = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOffIcon = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    Swal.fire({
      title: '<span class="text-lg font-extrabold text-gray-800">Ubah Kata Sandi</span>',
      html: `
        <div class="space-y-3.5 text-left mt-3">
          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Kata Sandi Lama</label>
            <div class="relative flex items-center">
              <input 
                type="password" 
                id="oldPassword" 
                class="w-full bg-gray-50 border border-gray-200 text-sm text-gray-800 rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all" 
                placeholder="Masukkan kata sandi lama"
              />
              <button type="button" class="toggle-pwd absolute right-3 text-gray-400 hover:text-gray-600 transition-colors" data-target="oldPassword">
                ${eyeIcon}
              </button>
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Kata Sandi Baru</label>
            <div class="relative flex items-center">
              <input 
                type="password" 
                id="newPassword" 
                class="w-full bg-gray-50 border border-gray-200 text-sm text-gray-800 rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all" 
                placeholder="Masukkan kata sandi baru"
              />
              <button type="button" class="toggle-pwd absolute right-3 text-gray-400 hover:text-gray-600 transition-colors" data-target="newPassword">
                ${eyeIcon}
              </button>
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Konfirmasi Kata Sandi Baru</label>
            <div class="relative flex items-center">
              <input 
                type="password" 
                id="confirmPassword" 
                class="w-full bg-gray-50 border border-gray-200 text-sm text-gray-800 rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:border-[#F3AB33] focus:ring-1 focus:ring-[#F3AB33] transition-all" 
                placeholder="Ulangi kata sandi baru"
              />
              <button type="button" class="toggle-pwd absolute right-3 text-gray-400 hover:text-gray-600 transition-colors" data-target="confirmPassword">
                ${eyeIcon}
              </button>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-2xl p-6 w-full max-w-sm',
        actions: 'mt-6 flex gap-3 w-full justify-end',
        confirmButton: 'bg-[#F3AB33] hover:bg-[#EAA121] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md flex-1',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex-1'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.querySelectorAll('.toggle-pwd').forEach((btn) => {
          btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = popup.querySelector(`#${targetId}`);
            if (input.type === 'password') {
              input.type = 'text';
              btn.innerHTML = eyeOffIcon;
            } else {
              input.type = 'password';
              btn.innerHTML = eyeIcon;
            }
          });
        });
      },
      preConfirm: () => {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!oldPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Semua kolom wajib diisi!');
          return false;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Konfirmasi kata sandi tidak cocok!');
          return false;
        }
        return { oldPassword, newPassword };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/${user.id}/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value)
          });
          const data = await response.json();

          if (response.ok) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Kata sandi berhasil diperbarui.', confirmButtonColor: '#F3AB33' });
          } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: data.error || 'Gagal mengubah kata sandi.' });
          }
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'Kesalahan Server', text: 'Gagal terhubung ke database.' });
        }
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F9F7F3]">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800">Pengaturan Akun</h1>
        <p className="text-xs text-gray-500 mt-1">Kelola profil pengguna dan preferensi sistem Anda.</p>
      </div>

          {/* WRAPPER UTAMA (Diberi max-w-4xl & items-start agar proporsional) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start max-w-4xl">

        {/* KARTU PROFIL UTAMA (Lebar Tetap) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full lg:w-80 shrink-0">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#F3AB33] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#F3AB33]/30 mb-4 tracking-widest">
              {initials}
            </div>
            <h2 className="text-xl font-extrabold text-gray-800">{user?.name || 'Nama Pengguna'}</h2>
            <p className="text-sm text-gray-500 font-medium mb-1">{displayRole}</p>
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200 mt-2">
              Online • Sedang Aktif
            </span>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Username</span>
              <span className="font-semibold text-gray-800">@{user?.username || 'username'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Hak Akses</span>
              <span className="font-semibold text-gray-800 capitalize">{user?.role || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Status Akun</span>
              <span className="font-semibold text-green-600">Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* MENU KANAN: ABSENSI & UBAH SANDI (Max Lebar Pas/Proporsional) */}
        <div className="flex-1 w-full max-w-md flex flex-col gap-4">

          {/* KARTU ABSENSI HARI INI */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiClock className="text-[#F3AB33]" /> Absensi Hari Ini
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Jam Masuk</p>
                <p className="font-black text-gray-800">{attendance?.clock_in || '--:--'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Jam Pulang</p>
                <p className="font-black text-gray-800">{attendance?.clock_out || '--:--'}</p>
              </div>
            </div>

            {!attendance ? (
              <button 
                onClick={handleClockIn} 
                disabled={isLoading}
                className="w-full py-3 bg-[#22c55e] hover:bg-green-600 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FiCheckCircle /> Absen Masuk Sekarang
              </button>
            ) : !attendance.clock_out ? (
              <button 
                onClick={handleClockOut} 
                disabled={isLoading}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FiLogOut /> Absen Pulang
              </button>
            ) : (
              <div className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                <FiCheckCircle /> Anda Sudah Selesai Bertugas
              </div>
            )}
          </div>  

          {/* KARTU UBAH KATA SANDI */}
          <button 
            onClick={handleChangePassword}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:bg-amber-50/50 transition-colors group text-left"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-[#F3AB33] group-hover:bg-amber-100 transition-colors flex-shrink-0">
              <FiLock className="text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">Ubah Kata Sandi</h3>
              <p className="text-xs text-gray-500 mt-0.5">Perbarui kata sandi keamanan akun Anda secara berkala.</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Account;