const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Base de datos SQLite para desarrollo local
const dbPath = path.join(__dirname, "../../database/frenos_local.db");

function initLocalDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error conectando a SQLite:", err);
        reject(err);
        return;
      }
      console.log("✅ Conectado a SQLite local");

      // Crear tablas si no existen
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS cars (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plate TEXT UNIQUE NOT NULL,
                    brand TEXT NOT NULL,
                    model TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    phone TEXT NOT NULL
                )`);

        db.run(`CREATE TABLE IF NOT EXISTS services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workOrder INTEGER,
                    plate TEXT NOT NULL,
                    work TEXT NOT NULL,
                    cost REAL NOT NULL,
                    service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plate) REFERENCES cars (plate)
                )`);
      });

      resolve(db);
    });
  });
}

module.exports = { initLocalDb };
