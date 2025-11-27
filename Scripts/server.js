/**
 * server.js
 * -----------------
 * Servidor Express que:
 * - Sirve los archivos estáticos en /pages, /css, /Scripts, /images
 * - Proporciona endpoints de autenticación: /api/register, /api/login, /api/logout, /api/me
 * - Se conecta a MySQL usando las variables de entorno (ver .env)
 * - Usa JWT para emitir tokens y proteger rutas
 *
 * Variables esperadas en .env:
 *  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT
 */
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

// Habilitar CORS para permitir peticiones desde otros orígenes (ej. Live Server en :5500)
app.use(cors());

// Logging middleware: registra cada petición entrante (útil para debug)
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url, 'from', req.ip);
    next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "..", "pages")));
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/Scripts", express.static(path.join(__dirname, "..", "Scripts")));
app.use("/images", express.static(path.join(__dirname, "..", "images")));

// Configuración MySQL
// Obtener MYSQL_URL desde Railway
const MYSQL_URL = process.env.MYSQL_URL;

console.log("=== MYSQL_URL DEBUG ===");
console.log("MYSQL_URL:", MYSQL_URL);
console.log("=======================");

// Si no existe MYSQL_URL, error inmediato
if (!MYSQL_URL) {
    console.error("ERROR: MYSQL_URL no está definida en Railway");
    process.exit(1);
}

// Parsear MYSQL_URL
const url = new URL(MYSQL_URL);

const DB_HOST = url.hostname;
const DB_PORT = url.port;
const DB_USER = url.username;
const DB_PASSWORD = url.password;
const DB_NAME = url.pathname.replace("/", "");

console.log("=== PARSED DB CONFIG ===");
console.log("DB_HOST:", DB_HOST);
console.log("DB_PORT:", DB_PORT);
console.log("DB_USER:", DB_USER);
console.log("DB_NAME:", DB_NAME);
console.log("========================");

// Crear pool con datos ya parseados
const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


const JWT_SECRET = process.env.JWT_SECRET || 'cifrado_secreto_para_jwt';

// Middleware para verificar JWT
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
        return res.status(401).json({ error: "No autorizado" });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido" });
    }
}

// Inicializar BD al arrancar
async function initDb() {
    try {
        const conn = await pool.getConnection();
        
        // Crear tabla users si no existe
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

// Registrar usuario
app.post("/api/register", async (req, res) => {
    const { name, lastname, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    try {
        const conn = await pool.getConnection();
        
        // Verificar si email ya existe
        const [existing] = await conn.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            conn.release();
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        // Hashear contraseña
        const hash = await bcrypt.hash(password, 10);

        // Insertar usuario
        await conn.query(
            "INSERT INTO users (name, lastname, email, password_hash) VALUES (?, ?, ?, ?)",
            [name || "", lastname || "", email, hash]
        );

        conn.release();
        return res.json({ ok: true, message: "Usuario registrado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al registrar" });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    try {
        const conn = await pool.getConnection();
        
        const [rows] = await conn.query("SELECT id, password_hash FROM users WHERE email = ?", [email]);
        
        if (rows.length === 0) {
            conn.release();
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            conn.release();
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        // Crear JWT
        const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "24h" });

        conn.release();
        return res.json({ ok: true, token, message: "Login exitoso" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

// Logout (endpoint opcional, solo para claridad)
app.post("/api/logout", (req, res) => {
    return res.json({ ok: true, message: "Logout exitoso" });
});

// Endpoint protegido de prueba
app.get("/api/me", verifyToken, (req, res) => {
    return res.json({ ok: true, user: req.user });
});

// Redirigir raíz al login
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

const PORT = process.env.PORT || 3000;

initDb().then(() => {
    app.get("/health", (req, res) => res.status(200).send("OK"));
    app.listen(PORT, () => console.log(`Server corriendo en puerto ${PORT}`));
});
