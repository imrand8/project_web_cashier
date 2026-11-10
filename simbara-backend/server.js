const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const JWT_SECRET = 'simbara_secret_key_2026';

// Konfigurasi Koneksi Supabase (PostgreSQL)
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    console.error('Koneksi ke Supabase Gagal:', err);
    return;
  }
  console.log('✅ Berhasil Terhubung ke Database Supabase PostgreSQL');
});

// 2. ENDPOINT: REGISTER ADMIN PERTAMA
app.post('/api/register-admin', async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4)';
    
    db.query(query, [name || 'Super Admin', username, hashedPassword, 'admin'], (err, result) => {
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

  const query = 'SELECT * FROM users WHERE username = $1';
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Kesalahan pada database' });
    }

    if (results.rows.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah!' });
    }

    const user = results.rows[0];

    const isPasswordValid = (password === user.password) || await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Username atau password salah!' });
    }

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

app.get('/api/users', (req, res) => {
  const query = 'SELECT id, name, username, role, created_at FROM users ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json([]); // Kirim array kosong agar frontend tidak crash
    }
    res.json(results.rows || []);
  });
});

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
    const query = 'INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4)';
    
    db.query(query, [name, username, hashedPassword, role || 'kasir'], (err, result) => {
      if (err) {
        if (err.code === '23505') { // Postgres unique violation code
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

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role } = req.body;

  if (!name || !username || !role) {
    return res.status(400).json({ error: 'Nama, Username, dan Role wajib diisi!' });
  }

  try {
    if (password && password.trim() !== '') {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password baru minimal harus 8 karakter!' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = 'UPDATE users SET name = $1, username = $2, password = $3, role = $4 WHERE id = $5';
      
      db.query(query, [name, username, hashedPassword, role, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal mengupdate user / Username sudah digunakan' });
        res.json({ message: 'User & Password berhasil diupdate!' });
      });
    } else {
      const query = 'UPDATE users SET name = $1, username = $2, role = $3 WHERE id = $4';
      db.query(query, [name, username, role, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal mengupdate user / Username sudah digunakan' });
        res.json({ message: 'Data user berhasil diupdate!' });
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = $1';

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus user' });
    res.json({ message: 'User berhasil dihapus!' });
  });
});

app.put('/api/users/:id/change-password', async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Kata sandi lama dan baru wajib diisi!' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Kata sandi baru minimal harus 8 karakter!' });
  }

  const querySelect = 'SELECT * FROM users WHERE id = $1';
  db.query(querySelect, [id], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Kesalahan pada database' });
    if (results.rows.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    const user = results.rows[0];

    const isOldPasswordValid = (oldPassword === user.password) || await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: 'Kata sandi lama salah!' });
    }

    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const queryUpdate = 'UPDATE users SET password = $1 WHERE id = $2';

      db.query(queryUpdate, [hashedNewPassword, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal memperbarui kata sandi' });
        res.json({ message: 'Kata sandi berhasil diperbarui!' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  });
});

// ==================== FITUR MANAJEMEN PRODUK ====================

app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data produk' });
    res.json(results.rows);
  });
});

app.post('/api/products', (req, res) => {
  const { name, category, price, stock, image } = req.body;
  
  if (!name || !category || !price || stock === undefined) {
    return res.status(400).json({ error: 'Nama, Kategori, Harga, dan Stok wajib diisi!' });
  }

  const query = 'INSERT INTO products (name, category, price, stock, image) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  db.query(query, [name, category, price, stock, image || ''], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).json({ error: 'Gagal menambah produk' });
    }
    res.json({ message: 'Produk berhasil ditambahkan!', id: result.rows[0].id });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, image } = req.body;

  const query = 'UPDATE products SET name = $1, category = $2, price = $3, stock = $4, image = $5 WHERE id = $6';
  db.query(query, [name, category, price, stock, image || '', id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal mengupdate produk' });
    res.json({ message: 'Produk berhasil diupdate!' });
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = $1';

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus produk' });
    res.json({ message: 'Produk berhasil dihapus!' });
  });
});

// ==================== FITUR ABSENSI ====================

app.get('/api/attendance/status/:userId', (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = 'SELECT * FROM attendances WHERE user_id = $1 AND date = $2';
  db.query(query, [userId, today], (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengecek status absensi' });
    res.json(results.rows[0] || null);
  });
});

app.post('/api/attendance/clock-in', (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  db.query('SELECT * FROM attendances WHERE user_id = $1 AND date = $2', [userId, today], (err, results) => {
    if (results.rows.length > 0) {
      return res.status(400).json({ error: 'Anda sudah melakukan Absen Masuk hari ini!' });
    }

    const query = 'INSERT INTO attendances (user_id, date, clock_in) VALUES ($1, $2, $3)';
    db.query(query, [userId, today, currentTime], (err) => {
      if (err) return res.status(500).json({ error: 'Gagal melakukan Absen Masuk' });
      res.json({ message: 'Absen Masuk Berhasil!', clockIn: currentTime });
    });
  });
});

app.post('/api/attendance/clock-out', (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  const query = 'UPDATE attendances SET clock_out = $1 WHERE user_id = $2 AND date = $3';
  db.query(query, [currentTime, userId, today], (err, result) => {
    if (err || result.rowCount === 0) {
      return res.status(400).json({ error: 'Gagal Absen Pulang / Belum Absen Masuk' });
    }
    res.json({ message: 'Absen Pulang Berhasil!', clockOut: currentTime });
  });
});

app.get('/api/attendance/report', (req, res) => {
  const query = `
    SELECT a.id, u.name, u.username, a.date, a.clock_in, a.clock_out, a.status 
    FROM attendances a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.date DESC, a.clock_in DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching attendance report:', err);
      return res.status(500).json([]); // Kirim array kosong agar frontend tidak crash
    }
    res.json(results.rows || []);
  });
});

// ==================== FITUR TRANSAKSI ====================

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
      to_char(o.created_at, 'DD Mon YYYY, HH24:MI') AS date,
      u.name AS cashier,
      COALESCE(
        json_agg(
          json_build_object('name', oi.product_name, 'qty', oi.qty, 'price', oi.price)
        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) AS items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE CAST(o.created_at AS DATE) = $1
    GROUP BY o.id, u.name
    ORDER BY o.created_at DESC
  `;

  db.query(query, [today], (err, results) => {
    if (err) {
      console.error('Error fetching today orders:', err);
      return res.status(500).json([]); // Aman: mengembalikan array kosong
    }
    res.json(results.rows || []);
  });
});

app.get('/api/orders/report', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT 
      o.id, 
      o.customer_name AS customer, 
      o.payment_method AS paymentMethod, 
      o.total_amount AS total, 
      o.status, 
      to_char(o.created_at, 'DD Mon YYYY, HH24:MI') AS date,
      COALESCE(u.name, 'Kasir') AS cashier
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
  `;

  const params = [];

  if (startDate && endDate) {
    query += ` WHERE CAST(o.created_at AS DATE) BETWEEN $1 AND $2`;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY o.created_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching report:', err);
      return res.status(500).json([]); // Aman: mengembalikan array kosong
    }
    res.json(results.rows || []);
  });
});

app.post('/api/orders', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { user_id, customer_name, order_type, payment_method, total_amount, items } = req.body;
    
    const finalCustomerName = (customer_name && customer_name.trim() !== '') ? customer_name : 'Pelanggan Anonim';
    const orderId = `ORD-${Date.now()}`;

    const orderQuery = 'INSERT INTO orders (id, user_id, customer_name, order_type, payment_method, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    await client.query(orderQuery, [orderId, user_id, finalCustomerName, order_type, payment_method, total_amount, 'Lunas']);

    for (const item of items) {
      const itemsQuery = 'INSERT INTO order_items (order_id, product_id, product_name, qty, price) VALUES ($1, $2, $3, $4, $5)';
      await client.query(itemsQuery, [orderId, item.id, item.name, item.qty, item.price]);

      const updateStockQuery = 'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2';
      await client.query(updateStockQuery, [item.qty, item.id]);
    }

    await client.query('COMMIT');
    client.release();
    res.json({ message: 'Transaksi berhasil disimpan!' });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error di tabel orders:', err);
    res.status(500).json({ error: 'Gagal menyimpan pesanan' });
  }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
    });
}

app.get('/', (req, res) => {
  res.json({ message: 'API Simbara Cashier Berjalan Normal!' });
});

module.exports = app;