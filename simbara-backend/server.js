const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Kunci rahasia untuk Token JWT (bebas, nanti disembunyikan di .env)
const JWT_SECRET = 'simbara_secret_key_2026';

// 1. Konfigurasi Koneksi Database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'web_cashier_db'
});

db.connect((err) => {
  if (err) {
    console.error('Koneksi ke MySQL Gagal:', err);
    return;
  }
  console.log('✅ Berhasil Terhubung ke Database MySQL: web_cashier_db');
});

// 2. ENDPOINT: REGISTER ADMIN PERTAMA (Opsional, untuk inisialisasi awal)
app.post('/api/register-admin', async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, "admin")';
    
    db.query(query, [name, username, hashedPassword], (err, result) => {
      if (err) {
        return res.status(400).json({ error: 'Username sudah digunakan atau data tidak valid!' });
      }
      res.json({ message: 'Akun Super Admin berhasil dibuat!' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// 3. ENDPOINT: LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Kesalahan pada database' });

    if (results.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah!' });
    }

    const user = results.results ? results[0] : results[0]; // Ambil data user pertama

    // Cek kecocokan password dengan yang di-hash
    const isPasswordValid = (password === user.password) || await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Username atau password salah!' });
    }

    // Buat Token JWT (berlaku 1 hari)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login Berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  });
});

// ==================== FITUR MANAJEMEN USER ====================

// 1. Ambil Semua User
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, name, username, role, created_at FROM users ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data user' });
    res.json(results);
  });
});

// 2. TAMBAH USER (Dengan Validasi Password Min 8 Karakter)
app.post('/api/users', async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Nama, Username, dan Password wajib diisi!' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password minimal harus 8 karakter!' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)';
    
    db.query(query, [name, username, hashedPassword, role || 'kasir'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Username sudah digunakan!' });
        }
        return res.status(500).json({ error: 'Gagal menambah user' });
      }
      res.json({ message: 'User berhasil ditambahkan!' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// 3. EDIT USER (Password Opsional, Min 8 Karakter Jika Diisi)
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role } = req.body;

  if (!name || !username || !role) {
    return res.status(400).json({ error: 'Nama, Username, dan Role wajib diisi!' });
  }

  try {
    // Jika password diisi (artinya admin ingin mengubah password user)
    if (password && password.trim() !== '') {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password baru minimal harus 8 karakter!' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = 'UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ?';
      
      db.query(query, [name, username, hashedPassword, role, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal mengupdate user / Username sudah digunakan' });
        res.json({ message: 'User & Password berhasil diupdate!' });
      });
    } else {
      // Jika password dikosongkan (hanya ubah nama/username/role)
      const query = 'UPDATE users SET name = ?, username = ?, role = ? WHERE id = ?';
      db.query(query, [name, username, role, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal mengupdate user / Username sudah digunakan' });
        res.json({ message: 'Data user berhasil diupdate!' });
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// 4. Hapus User
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus user' });
    res.json({ message: 'User berhasil dihapus!' });
  });
});

// 5. Ubah Kata Sandi Akun
app.put('/api/users/:id/change-password', async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Kata sandi lama dan baru wajib diisi!' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Kata sandi baru minimal harus 8 karakter!' });
  }

  // 1. Cari user di database
  const querySelect = 'SELECT * FROM users WHERE id = ?';
  db.query(querySelect, [id], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Kesalahan pada database' });
    if (results.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    const user = results[0];

    // 2. Verifikasi kata sandi lama
    const isOldPasswordValid = (oldPassword === user.password) || await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: 'Kata sandi lama salah!' });
    }

    try {
      // 3. Hash kata sandi baru & update ke database
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const queryUpdate = 'UPDATE users SET password = ? WHERE id = ?';

      db.query(queryUpdate, [hashedNewPassword, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal memperbarui kata sandi' });
        res.json({ message: 'Kata sandi berhasil diperbarui!' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  });
});

// ==================== FITUR MANAJEMEN PRODUK (STOK & MENU) ====================

// 1. Ambil Semua Produk
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data produk' });
    res.json(results);
  });
});

// 2. Tambah Produk Baru (Hanya Admin)
app.post('/api/products', (req, res) => {
  const { name, category, price, stock, image } = req.body;
  
  if (!name || !category || !price || stock === undefined) {
    return res.status(400).json({ error: 'Nama, Kategori, Harga, dan Stok wajib diisi!' });
  }

  const query = 'INSERT INTO products (name, category, price, stock, image) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, category, price, stock, image || ''], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menambah produk' });
    res.json({ message: 'Produk berhasil ditambahkan!', id: result.insertId });
  });
});

// 3. Edit Produk (Hanya Admin)
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, image } = req.body;

  const query = 'UPDATE products SET name = ?, category = ?, price = ?, stock = ?, image = ? WHERE id = ?';
  db.query(query, [name, category, price, stock, image || '', id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal mengupdate produk' });
    res.json({ message: 'Produk berhasil diupdate!' });
  });
});

// 4. Hapus Produk (Hanya Admin)
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus produk' });
    res.json({ message: 'Produk berhasil dihapus!' });
  });
});

// ==================== FITUR ABSENSI ====================

// 1. Cek Status Absen Hari Ini (Kasir)
app.get('/api/attendance/status/:userId', (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = 'SELECT * FROM attendances WHERE user_id = ? AND date = ?';
  db.query(query, [userId, today], (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengecek status absensi' });
    res.json(results[0] || null);
  });
});

// 2. Absen Masuk / Clock-In (Kasir)
app.post('/api/attendance/clock-in', (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  // Cek apakah sudah absen hari ini
  db.query('SELECT * FROM attendances WHERE user_id = ? AND date = ?', [userId, today], (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({ error: 'Anda sudah melakukan Absen Masuk hari ini!' });
    }

    const query = 'INSERT INTO attendances (user_id, date, clock_in) VALUES (?, ?, ?)';
    db.query(query, [userId, today, currentTime], (err) => {
      if (err) return res.status(500).json({ error: 'Gagal melakukan Absen Masuk' });
      res.json({ message: 'Absen Masuk Berhasil!', clockIn: currentTime });
    });
  });
});

// 3. Absen Pulang / Clock-Out (Kasir)
app.post('/api/attendance/clock-out', (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  const query = 'UPDATE attendances SET clock_out = ? WHERE user_id = ? AND date = ?';
  db.query(query, [currentTime, userId, today], (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.status(400).json({ error: 'Gagal Absen Pulang / Belum Absen Masuk' });
    }
    res.json({ message: 'Absen Pulang Berhasil!', clockOut: currentTime });
  });
});

// 4. Rekap Absensi Semua Kasir (Admin)
app.get('/api/attendance/report', (req, res) => {
  const query = `
    SELECT a.id, u.name, u.username, a.date, a.clock_in, a.clock_out, a.status 
    FROM attendances a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.date DESC, a.clock_in DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil rekap absensi' });
    res.json(results);
  });
});

// ==================== FITUR RIWAYAT & LAPORAN PENJUALAN ====================

// 1. Get Riwayat Pesanan Hari Ini (Untuk Kasir)
app.get('/api/orders/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT 
      o.id, 
      o.customer_name AS customer, 
      o.order_type AS type, 
      o.payment_method AS paymentMethod, 
      o.total_amount AS total, 
      o.status, 
      DATE_FORMAT(o.created_at, '%d %b %Y, %H:%i') AS date,
      u.name AS cashier,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT('name', oi.product_name, 'qty', oi.qty, 'price', oi.price)
        ), '[]'
      ) AS items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE DATE(o.created_at) = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  db.query(query, [today], (err, results) => {
    if (err) {
      console.error('Error fetching today orders:', err);
      return res.status(500).json({ error: 'Gagal mengambil riwayat transaksi hari ini' });
    }

    // Format data items dari JSON MySQL
    const formatted = results.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
    }));

    res.json(formatted);
  });
});

// 2. Get Laporan Penjualan Semua Transaksi / Filter Tanggal (Untuk Admin)
app.get('/api/orders/report', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT 
      o.id, 
      o.customer_name AS customer, 
      o.payment_method AS paymentMethod, 
      o.total_amount AS total, 
      o.status, 
      DATE_FORMAT(o.created_at, '%d %b %Y, %H:%i') AS date,
      COALESCE(u.name, 'Kasir') AS cashier
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
  `;

  const params = [];

  if (startDate && endDate) {
    query += ` WHERE DATE(o.created_at) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY o.created_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching report:', err);
      return res.status(500).json({ error: 'Gagal mengambil laporan penjualan' });
    }
    res.json(results);
  });
});

// POST: Simpan Transaksi Baru & Potong Stok Produk Otomatis
app.post('/api/orders', (req, res) => {
  const { user_id, customer_name, order_type, payment_method, total_amount, items } = req.body;
  
  const finalCustomerName = (customer_name && customer_name.trim() !== '') ? customer_name : 'Pelanggan Anonim';
  const orderId = `ORD-${Date.now()}`;

  const orderQuery = 'INSERT INTO orders (id, user_id, customer_name, order_type, payment_method, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, "Lunas")';
  
  db.query(orderQuery, [orderId, user_id, finalCustomerName, order_type, payment_method, total_amount], (err, orderResult) => {
    if (err) {
      console.error('Error di tabel orders:', err);
      return res.status(500).json({ error: 'Gagal menyimpan pesanan' });
    }

    const itemsQuery = 'INSERT INTO order_items (order_id, product_id, product_name, qty, price) VALUES ?';
    const itemsValues = items.map(item => [orderId, item.id, item.name, item.qty, item.price]);

    db.query(itemsQuery, [itemsValues], (err) => {
      if (err) {
        console.error('Error di tabel order_items:', err);
        return res.status(500).json({ error: 'Gagal menyimpan item pesanan' });
      }

      // KODE TAMBAHAN: Kurangi stok setiap produk di database
      items.forEach(item => {
        const updateStockQuery = 'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?';
        db.query(updateStockQuery, [item.qty, item.id], (stockErr) => {
          if (stockErr) console.error(`Gagal mengurangi stok produk ID ${item.id}:`, stockErr);
        });
      });

      res.json({ message: 'Transaksi berhasil disimpan!' });
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});