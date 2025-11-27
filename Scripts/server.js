require('dotenv').config();
const express = require("express");
const cors = require('cors');
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Logging simple
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, "..", "pages")));
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/Scripts", express.static(path.join(__dirname, "..", "Scripts")));
app.use("/images", express.static(path.join(__dirname, "..", "images")));

// Configuración MySQL desde Railway
const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
    console.error("ERROR: MYSQL_URL no está definida");
    process.exit(1);
}
const url = new URL(MYSQL_URL);
const pool = mysql.createPool({
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// JWT
const JWT_SECRET = process.env.JWT_SECRET || 'cifrado_secreto_para_jwt';

// Middleware de verificación JWT
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ error: "No autorizado" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido" });
    }
}

// Inicializar BD
async function initDb() {
    try {
        const conn = await pool.getConnection();
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100),
                lastname VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);
        conn.release();
        console.log("✓ Base de datos inicializada");
    } catch (err) {
        console.error("Error inicializando BD:", err);
        process.exit(1);
    }
}

// Endpoints
app.post("/api/register", async (req, res) => {
    const { name, lastname, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña son requeridos" });

    const conn = await pool.getConnection();
    const [existing] = await conn.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) { conn.release(); return res.status(400).json({ error: "Correo ya registrado" }); }

    const hash = await bcrypt.hash(password, 10);
    await conn.query("INSERT INTO users (name, lastname, email, password_hash) VALUES (?, ?, ?, ?)", [name||"", lastname||"", email, hash]);
    conn.release();
    res.json({ ok: true, message: "Usuario registrado exitosamente" });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña son requeridos" });

    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT id, password_hash FROM users WHERE email = ?", [email]);
    if (rows.length === 0) { conn.release(); return res.status(401).json({ error: "Credenciales incorrectas" }); }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) { conn.release(); return res.status(401).json({ error: "Credenciales incorrectas" }); }

    const token = jwt.sign({ id: rows[0].id, email }, JWT_SECRET, { expiresIn: "24h" });
    conn.release();
    res.json({ ok: true, token, message: "Login exitoso" });
});

app.post("/api/logout", (req, res) => res.json({ ok: true, message: "Logout exitoso" }));
app.get("/api/me", verifyToken, (req, res) => res.json({ ok: true, user: req.user }));
app.get("/", (req, res) => res.redirect("/login.html"));

// Health check
app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 3000;

initDb().then(() => {
    app.listen(8080, () => console.log(`Server corriendo en puerto ${PORT}`));
});
