const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/frenos.db");

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
      plate TEXT NOT NULL,
      work TEXT NOT NULL,
      cost REAL NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plate) REFERENCES cars (plate)
    )
  `);

  console.log("Tablas creadas correctamente en la base de datos.");
});

db.close();
