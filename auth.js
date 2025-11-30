const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'TallerTokyoNoodles',
  database: process.env.DB_NAME || 'tokyo_noodles',
  waitForConnections: true,
  connectionLimit: 10,
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      (async () => {
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
          let [rows] = await pool.query('SELECT * FROM usuarios WHERE google_id = ?', [profile.id]);
          if (!rows.length && email) {
            [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
          }
          let user;
          if (rows.length) {
            user = rows[0];
            if (!user.google_id) {
              await pool.query('UPDATE usuarios SET google_id = ? WHERE id_usuario = ?', [profile.id, user.id_usuario]);
              user.google_id = profile.id;
            }
          } else {
            const nombre = profile.displayName || (profile.name && `${profile.name.givenName || ''} ${profile.name.familyName || ''}`) || null;
            const safeEmail = email || `${profile.id}@google.local`;
            const randomPwd = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPwd, 10);
            const [result] = await pool.query('INSERT INTO usuarios (email, nombre, google_id, password) VALUES (?, ?, ?, ?)', [safeEmail, nombre, profile.id, passwordHash]);
            const [newRows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
            user = newRows[0];
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      })();
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id_usuario || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query('SELECT id_usuario, email, nombre, rut, imagen_perfil, imagen_nombre, id_rol, google_id FROM usuarios WHERE id_usuario = ?', [id]);
    if (!rows || !rows.length) return done(null, false);
    const user = rows[0];
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

module.exports = passport;
