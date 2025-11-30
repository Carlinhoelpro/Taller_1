const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config({ path: process.env.DOTENV_PATH || './Datos.env' });
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);
const passport = require("./auth");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5500',
  credentials: true,
}));
app.use(bodyParser.json());

app.set('trust proxy', 1);

const sessionStoreOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'TallerTokyoNoodles',
  database: process.env.DB_NAME || 'tokyo_noodles',
};
const sessionStore = new MySQLStore(sessionStoreOptions);

app.use(
  session({
    key: process.env.SESSION_KEY || 'tokyo.sid',
    secret: process.env.SESSION_SECRET || "tokyo-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'TallerTokyoNoodles',
  database: process.env.DB_NAME || 'tokyo_noodles',
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    return;
  }
  console.log('Conectado correctamente a MySQL');
});

app.get('/', (req, res) => {
  res.send('Servidor backend funcionando correctamente ');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], state: true })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const nombre = (req.user && (req.user.nombre || req.user.email)) || 'Usuario';
    res.send(`
      <h1>Bienvenido, ${nombre}</h1>
      <p>Login con Google completado.</p>
    `);
  }
);

app.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
});

app.get('/auth/logout', (req, res, next) => {
  if (req.logout) {
    req.logout(function(err) {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie(process.env.SESSION_KEY || 'tokyo.sid');
        res.json({ message: 'Sesión cerrada' });
      });
    });
  } else {
    req.session.destroy(() => {
      res.clearCookie(process.env.SESSION_KEY || 'tokyo.sid');
      res.json({ message: 'Sesión cerrada' });
    });
  }
});
