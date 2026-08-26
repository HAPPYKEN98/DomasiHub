require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Supabase Connection String
throw new Error(
    'The legacy Express backend is retired. Domasi Hub now uses Supabase Client SDK.'
);

// Pool configuration tailored for Supabase
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // Timeout after 10s if network hangs
  idleTimeoutMillis: 30000
});

pool.connect()
  .then(client => {
    console.log("Connected to Supabase PostgreSQL database successfully.");
    client.release();
    createTables();
  })
  .catch(err => {
    console.error("Failed to connect to Supabase PostgreSQL:", err.message);
  });

// Structural Table Generation
async function createTables() {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        reg_number TEXT UNIQUE NOT NULL,
        whatsapp_number TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        posted_by TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        contact_number TEXT NOT NULL,
        item_condition TEXT,
        security_condition TEXT,
        location_details TEXT,
        image_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS academic_resources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        academic_year TEXT,
        course_code TEXT,
        file_data TEXT NOT NULL,
        uploaded_by TEXT,
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skill_services (
        id SERIAL PRIMARY KEY,
        provider_name TEXT NOT NULL,
        skill_category TEXT NOT NULL,
        service_title TEXT NOT NULL,
        description TEXT,
        starting_price REAL DEFAULT 0,
        contact_number TEXT NOT NULL,
        portfolio_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS campus_landmarks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        contact_number TEXT
      );

      CREATE TABLE IF NOT EXISTS bulletins (
        id SERIAL PRIMARY KEY,
        notice_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        posted_by TEXT,
        event_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tables checked/created in Supabase.");
  } catch (err) {
    console.error("Error creating tables in Supabase:", err.message);
  } finally {
    if (client) client.release();
  }
}

/* ==========================================
   AUTHENTICATION ENDPOINTS
   ========================================== */
app.post('/api/auth/signup', async (req, res) => {
  const { fullname, regNumber, whatsapp, password } = req.body;
  const regPattern = /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i;

  if (!regNumber || !regPattern.test(regNumber)) {
    return res.status(400).json({ status: "error", message: "Invalid registration format." });
  }
  if (!fullname || !whatsapp || !password) {
    return res.status(400).json({ status: "error", message: "All fields are required." });
  }

  const cleanReg = regNumber.trim().toUpperCase();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (full_name, reg_number, whatsapp_number, password_hash) VALUES ($1, $2, $3, $4)`;
    await pool.query(sql, [fullname.trim(), cleanReg, whatsapp.trim(), passwordHash]);
    res.status(201).json({ status: "success", message: "Registration successful!" });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ status: "error", message: "This registration number is already registered." });
    }
    console.error("Signup error:", error);
    res.status(500).json({ status: "error", message: "Database save error." });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { regNumber, password } = req.body;
  if (!regNumber || !password) {
    return res.status(400).json({ status: "error", message: "All fields are required." });
  }

  const cleanReg = regNumber.trim().toUpperCase();

  try {
    const sql = `SELECT full_name, reg_number, password_hash FROM users WHERE UPPER(reg_number) = $1`;
    const result = await pool.query(sql, [cleanReg]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid credentials." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      res.status(200).json({
        status: "success",
        message: "Login successful!",
        user: { fullname: user.full_name, regNumber: user.reg_number }
      });
    } else {
      res.status(401).json({ status: "error", message: "Invalid credentials." });
    }
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ status: "error", message: "Server error." });
  }
});

app.post('/api/admin/signin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Username and password required." });
  }
  const cleanUser = username.toLowerCase().trim();
  const adminPasswords = {
    craig: process.env.ADMIN_CRAIG_PASS,
    eden: process.env.ADMIN_EDEN_PASS,
    msosa: process.env.ADMIN_MSOSA_PASS
  };
  const storedPassword = adminPasswords[cleanUser];
  if (storedPassword && password === storedPassword) {
    return res.status(200).json({
      status: "success",
      message: "Admin authenticated successfully!",
      username: cleanUser
    });
  } else {
    return res.status(401).json({ status: "error", message: "Invalid admin username or password." });
  }
});

/* ==========================================
   MARKETPLACE & LISTINGS ENDPOINTS
   ========================================== */
app.post('/api/listings', async (req, res) => {
  const { posted_by, title, category, price, contact_number, item_condition, security_condition, location_details, image_path } = req.body;
  if (!title || !category || !price || !contact_number) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    const sql = `INSERT INTO listings (posted_by, title, category, price, contact_number, item_condition, security_condition, location_details, image_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
    const result = await pool.query(sql, [posted_by || 'Anonymous Student', title, category, price, contact_number, item_condition, security_condition, location_details, image_path || null]);
    res.status(201).json({ message: "Listing published successfully!", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings', async (req, res) => {
  const { category } = req.query;
  let sql = `SELECT * FROM listings ORDER BY id DESC`;
  let params = [];
  if (category) {
    sql = `SELECT * FROM listings WHERE category = $1 ORDER BY id DESC`;
    params = [category];
  }
  try {
    const result = await pool.query(sql, params);
    res.status(200).json({ status: "success", listings: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete('/api/listings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM listings WHERE id = $1`, [id]);
    res.status(200).json({ status: "success", message: "Listing deleted successfully." });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.put('/api/listings/:id', async (req, res) => {
  const { id } = req.params;
  const { title, price } = req.body;
  try {
    await pool.query(`UPDATE listings SET title = $1, price = $2 WHERE id = $3`, [title, price, id]);
    res.status(200).json({ status: "success", message: "Listing updated successfully." });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/* ==========================================
   ACADEMIC REPOSITORY API
   ========================================== */
app.get('/api/academics', async (req, res) => {
  const { department, search } = req.query;
  let query = "SELECT id, title, department, academic_year, course_code, uploaded_by, download_count, created_at FROM academic_resources WHERE 1=1";
  let params = [];
  let i = 1;
  if (department) {
    query += ` AND department = $${i++}`;
    params.push(department);
  }
  if (search) {
    query += ` AND (title ILIKE $${i++} OR course_code ILIKE $${i++})`;
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY id DESC";
  try {
    const result = await pool.query(query, params);
    res.json({ status: "success", resources: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post('/api/academics', async (req, res) => {
  const { title, department, academic_year, course_code, file_data, uploaded_by } = req.body;
  if (!title || !department || !file_data) {
    return res.status(400).json({ status: "error", message: "Missing required fields." });
  }
  try {
    const sql = `INSERT INTO academic_resources (title, department, academic_year, course_code, file_data, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    const result = await pool.query(sql, [title, department, academic_year || '', course_code || '', file_data, uploaded_by || "Anonymous Student"]);
    res.status(201).json({ status: "success", message: "Resource uploaded successfully!", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get('/api/academics/download/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT file_data FROM academic_resources WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: "error", message: "File not found." });
    await pool.query("UPDATE academic_resources SET download_count = download_count + 1 WHERE id = $1", [id]);
    res.json({ status: "success", file_data: result.rows[0].file_data });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.delete('/api/academics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM academics_resources WHERE id = $1`, [id]);
    res.status(200).json({ status: "success", message: "Academic resource deleted successfully." });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/* ==========================================
   SKILL-SHARE & FREELANCE GIGS API
   ========================================== */
app.get('/api/skills', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM skill_services ORDER BY created_at DESC");
    res.json({ status: "success", services: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post('/api/skills', async (req, res) => {
  const { provider_name, skill_category, service_title, description, starting_price, contact_number, portfolio_link } = req.body;
  if (!service_title || !skill_category || !contact_number) {
    return res.status(400).json({ status: "error", message: "Missing required service fields." });
  }
  try {
    const sql = "INSERT INTO skill_services (provider_name, skill_category, service_title, description, starting_price, contact_number, portfolio_link) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id";
    const result = await pool.query(sql, [provider_name || "Anonymous", skill_category, service_title, description, starting_price || 0, contact_number, portfolio_link || ""]);
    res.status(201).json({ status: "success", message: "Service profile created successfully!", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ==========================================
   CAMPUS LANDMARKS & MAP API
   ========================================== */
app.get('/api/landmarks', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM campus_landmarks");
    res.json({ status: "success", landmarks: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post('/api/landmarks', async (req, res) => {
  const { name, type, description, latitude, longitude, contact_number } = req.body;
  if (!name || !type || !latitude || !longitude) {
    return res.status(400).json({ status: "error", message: "Missing required landmark location fields." });
  }
  try {
    const sql = "INSERT INTO campus_landmarks (name, type, description, latitude, longitude, contact_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";
    const result = await pool.query(sql, [name, type, description, latitude, longitude, contact_number || ""]);
    res.status(201).json({ status: "success", message: "Landmark added successfully!", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ==========================================
   CAMPUS BULLETIN & NOTICEBOARD API
   ========================================== */
app.get('/api/bulletins', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bulletins ORDER BY created_at DESC");
    res.json({ status: "success", bulletins: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post('/api/bulletins', async (req, res) => {
  const { notice_type, title, description, posted_by, event_date } = req.body;
  if (!notice_type || !title || !description) {
    return res.status(400).json({ status: "error", message: "Missing required bulletin fields." });
  }
  try {
    const sql = "INSERT INTO bulletins (notice_type, title, description, posted_by, event_date) VALUES ($1, $2, $3, $4, $5) RETURNING id";
    const result = await pool.query(sql, [notice_type, title, description, posted_by || "Campus Admin", event_date || ""]);
    res.status(201).json({ status: "success", message: "Notice published to bulletin!", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ==========================================
   STATIC FILES & SERVER START
   ========================================== */
app.use(express.static(path.join(__dirname)));
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on port ${PORT}`);
});