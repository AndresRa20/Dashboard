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
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No autorizado" });

    const token = auth.replace("Bearer ", "");

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido" });
    }
}

function verifyAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "No autorizado" });
    }
    next();
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
        role VARCHAR(20) NOT NULL DEFAULT 'user',
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
app.post('/api/create-admin', async (req, res) => {
    try {
        const name = "Admin";
        const lastname = "Root";
        const email = "admin@admin.com";
        const password = "Ulatina.2025*"; // cámbiala si quieres

        // verificar si ya existe
        const [existing] = await pool.query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email]
        );
        if (existing.length > 0) {
            return res.json({ error: "El admin ya existe." });
        }

        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (name, lastname, email, password_hash, role)
            VALUES (?, ?, ?, ?, 'admin')`,
            [name, lastname, email, hash]
        );


        res.json({ ok: true, message: "Admin creado correctamente" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error creando admin" });
    }
});


// Endpoints
app.post("/api/register", async (req, res) => {
    const { name, lastname, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña son requeridos" });

    const conn = await pool.getConnection();
    const [existing] = await conn.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) { conn.release(); return res.status(400).json({ error: "Correo ya registrado" }); }

    const hash = await bcrypt.hash(password, 10);
    await conn.query("INSERT INTO users (name, lastname, email, password_hash) VALUES (?, ?, ?, ?)", [name || "", lastname || "", email, hash]);
    conn.release();
    res.json({ ok: true, message: "Usuario registrado exitosamente" });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email y contraseña son requeridos" });

    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT id, password_hash, role FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
        conn.release();
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
        conn.release();
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign({
        id: rows[0].id,
        email,
        role: rows[0].role
    }, JWT_SECRET, { expiresIn: "24h" });

    conn.release();
    res.json({ ok: true, token, role: rows[0].role });
});
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, name, lastname, email, role 
            FROM users
        `);
        res.json({ users: rows });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

app.post('/api/admin/change-role', verifyToken, verifyAdmin, async (req, res) => {
    const { id, role } = req.body;

    console.log("Request change-role:", req.body);

    // Validaciones básicas
    if (!id || !role || (role !== "admin" && role !== "user")) {
        return res.status(400).json({ error: "ID o rol inválido" });
    }

    try {
        // Asegurarse que id sea número
        const userId = parseInt(id, 10);
        await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
        res.json({ message: "Rol actualizado" });
    } catch (err) {
        console.error("Error en change-role:", err);
        res.status(500).json({ error: "Error al actualizar rol" });
    }
});

app.post('/api/admin/delete-user', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.body;

    try {
        await pool.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: "Usuario eliminado" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});


app.post("/api/logout", (req, res) => res.json({ ok: true, message: "Logout exitoso" }));
app.get("/api/me", verifyToken, (req, res) => res.json({ ok: true, user: req.user }));
app.get("/", (req, res) => res.redirect("/login.html"));

// Health check
app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 3000;

initDb().then(() => {
    app.listen(PORT, "0.0.0.0", () =>
        console.log("Server corriendo en puerto", PORT));
});
