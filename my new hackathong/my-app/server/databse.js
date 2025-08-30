import mysql from "mysql2/promise";

// Create a pool for connections
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "sudheer12345",
  database: "shaurya",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* ---------------- Save / Update User ---------------- */
export async function saveUser(userData) {
  const {fullName, email, profilePicture, googleId } = userData;

  const query = `
    INSERT INTO users (full_name, email, profile_picture, google_id)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      full_name = VALUES(full_name),
      email = VALUES(email),
      profile_picture = VALUES(profile_picture),
      google_id = VALUES(google_id)
  `;

  const conn = await pool.getConnection();
  try {
    await conn.query(query, [fullName, email, profilePicture, googleId]);
  } finally {
    conn.release();
  }
}

/* ---------------- Verify Session Key ---------------- */
export async function verifySessionKey(sessionKey) {
  const query = `
    SELECT u.*
    FROM users u
    JOIN sessions s ON u.google_id = s.user_id
    WHERE s.session_key = ?
    LIMIT 1
  `;

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(query, [sessionKey]);
    if (rows.length === 0) return null;
    return rows[0]; // user object
  } finally {
    conn.release();
  }
}
export async function getSessionKeyByUserId(userId) {
  const query = `SELECT session_key FROM sessions WHERE user_id = ? LIMIT 1`;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(query, [userId]);
    if (rows.length === 0) return null;
    return rows[0].session_key;
  } finally {
    conn.release();
  }
}
/* ---------------- Optional: Save Session ---------------- */
export async function saveSession(sessionKey, userId) {
  const query = `
    INSERT INTO sessions (session_key, user_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
  `;
  const conn = await pool.getConnection();
  try {
    await conn.query(query, [sessionKey, userId]);
  } finally {
    conn.release();
  }
}
