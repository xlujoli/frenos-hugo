const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Construct the absolute path to the database file relative to the project root
const dbPath = path.resolve(__dirname, "../../database/frenos.db");

// Ensure the directory exists (optional, but good practice)
const dbDir = path.dirname(dbPath);
const fs = require("fs");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Crear tablas
db.serialize(() => {
  // Tabla de vehículos
  db.run(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate TEXT UNIQUE NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      owner TEXT NOT NULL,
      phone TEXT NOT NULL
    )
  `);

  // Tabla de servicios
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workOrder INTEGER, -- Added workOrder column
      plate TEXT NOT NULL,
      work TEXT NOT NULL,
      cost REAL NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plate) REFERENCES cars (plate)
    )
  `);

  // Attempt to add the column if the table already exists (might fail if column exists, ignore error)
  db.run(`ALTER TABLE services ADD COLUMN workOrder INTEGER`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      // Log error only if it's not about the column already existing
      console.error("Error adding workOrder column:", err.message);
    } else if (!err) {
      console.log(
        "Column 'workOrder' added to services table or already exists."
      );
    }
  });

  console.log("Tablas creadas/actualizadas correctamente en la base de datos.");
});

db.close();
