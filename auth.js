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
        console.log('Google OAuth callback profile:', { id: profile.id, emails: profile.emails && profile.emails.map(e=>e.value) });
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
          let rows = [];
          try {
            const q = 'SELECT * FROM usuarios WHERE google_id = ?';
            console.log('Running SQL:', q, [profile.id]);
            const result = await pool.query(q, [profile.id]);
            rows = result[0];
            console.log('SQL SELECT by google_id returned rows:', rows && rows.length);
          } catch (sqlErr) {
            console.warn('SQL error while querying by google_id:', sqlErr.code, sqlErr.sqlMessage || sqlErr.message);
            if (sqlErr && sqlErr.code === 'ER_BAD_FIELD_ERROR') {
              rows = [];
            } else {
              throw sqlErr; 
            }
          }
          if (!rows.length && email) {
            try {
              const q2 = 'SELECT * FROM usuarios WHERE email = ?';
              console.log('Running SQL:', q2, [email]);
              const result2 = await pool.query(q2, [email]);
              rows = result2[0];
              console.log('SQL SELECT by email returned rows:', rows && rows.length);
            } catch (err2) {
              console.error('SQL error while querying by email:', err2.code, err2.sqlMessage || err2.message);
              throw err2;
            }
          }
          let user;
          if (rows.length) {
            user = rows[0];
            console.log('Found user in DB for oauth:', { id_usuario: user.id_usuario, email: user.email });
            if (!user.google_id) {
              try {
                await pool.query('UPDATE usuarios SET google_id = ? WHERE id_usuario = ?', [profile.id, user.id_usuario]);
                user.google_id = profile.id;
              } catch (updErr) {
                console.warn('Failed to update google_id - possibly missing column:', updErr.code, updErr.sqlMessage || updErr.message);
              }
            }
          } else {
            const nombre = profile.displayName || (profile.name && `${profile.name.givenName || ''} ${profile.name.familyName || ''}`) || null;
            const safeEmail = email || `${profile.id}@google.local`;
            const randomPwd = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPwd, 10);
            let result;
            try {
              [result] = await pool.query('INSERT INTO usuarios (email, nombre, google_id, password) VALUES (?, ?, ?, ?)', [safeEmail, nombre, profile.id, passwordHash]);
            } catch (insErr) {
              console.warn('Error inserting new oauth user (first attempt):', insErr.code, insErr.sqlMessage || insErr.message);
              if (insErr && insErr.code === 'ER_BAD_FIELD_ERROR') {
                try {
                  const insertNoGoogle = 'INSERT INTO usuarios (email, nombre, password) VALUES (?, ?, ?)';
                  [result] = await pool.query(insertNoGoogle, [safeEmail, nombre, passwordHash]);
                  try {
                    await pool.query('UPDATE usuarios SET google_id = ? WHERE id_usuario = ?', [profile.id, result.insertId]);
                  } catch (updErr) {
                    console.warn('Failed to update google_id after fallback insert:', updErr.code, updErr.sqlMessage || updErr.message);
                  }
                } catch (insErr2) {
                  console.warn('Error inserting new oauth user without google_id:', insErr2.code, insErr2.sqlMessage || insErr2.message);
                  if (insErr2 && insErr2.code === 'ER_DUP_ENTRY') {
                    const [existingRows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [safeEmail]);
                    if (existingRows && existingRows.length) {
                      user = existingRows[0];
                      if (!user.google_id) {
                        try {
                          await pool.query('UPDATE usuarios SET google_id = ? WHERE id_usuario = ?', [profile.id, user.id_usuario]);
                          user.google_id = profile.id;
                        } catch (attachErr2) {
                          console.warn('Failed to attach google_id to existing user after duplicate entry (fallback):', attachErr2.code, attachErr2.sqlMessage || attachErr2.message);
                        }
                      }
                    } else {
                      throw insErr2;
                    }
                  } else {
                    throw insErr2;
                  }
                }
              } else if (insErr && insErr.code === 'ER_DUP_ENTRY') {
                const [existingRows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [safeEmail]);
                if (existingRows && existingRows.length) {
                  user = existingRows[0];
                  // If user exists but google_id is missing, try to attach it
                  if (!user.google_id) {
                    try {
                      await pool.query('UPDATE usuarios SET google_id = ? WHERE id_usuario = ?', [profile.id, user.id_usuario]);
                      user.google_id = profile.id;
                    } catch (attachErr) {
                      console.warn('Failed to attach google_id to existing user after duplicate entry:', attachErr.code, attachErr.sqlMessage || attachErr.message);
                    }
                  }
                } else {
                  throw insErr;
                }
              } else {
                throw insErr;
              }
            }
            if (!user && result && result.insertId) {
              const [newRows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
              if (newRows && newRows.length) {
                user = newRows[0];
              } else {
                console.warn('No user found after insert; insertId was', result.insertId);
              }
            }
          }
          return done(null, user);
        } catch (err) {
          console.error('Error in GoogleStrategy callback:', err && err.message || err);
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
