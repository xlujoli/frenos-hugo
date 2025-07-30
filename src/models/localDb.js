const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Base de datos SQLite para la aplicación pública en Render
const dbPath = path.join(__dirname, '../../database/frenos.db');

function initLocalDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error conectando a SQLite:', err);
                reject(err);
                return;
            }
            console.log('✅ Conectado a SQLite local');
            
            // Crear tablas si no existen
            db.serialize(() => {
                // Tabla de vehículos
                db.run(`CREATE TABLE IF NOT EXISTS cars (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plate TEXT UNIQUE NOT NULL,
                    brand TEXT NOT NULL,
                    model TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) console.error('Error creando tabla cars:', err);
                    else console.log('✅ Tabla cars verificada/creada');
                });
                
                // Tabla de servicios
                db.run(`CREATE TABLE IF NOT EXISTS services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workOrder INTEGER,
                    plate TEXT NOT NULL,
                    work TEXT NOT NULL,
                    cost REAL NOT NULL,
                    service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plate) REFERENCES cars (plate)
                )`, (err) => {
                    if (err) console.error('Error creando tabla services:', err);
                    else console.log('✅ Tabla services verificada/creada');
                });
            });
            
            // Cerrar la conexión de inicialización
            db.close((err) => {
                if (err) {
                    console.error('Error cerrando conexión de inicialización:', err);
                    reject(err);
                } else {
                    console.log('✅ Inicialización de SQLite completada');
                    resolve();
                }
            });
        });
    });
}

// Función para obtener una conexión SQLite
async function getSQLiteConnection() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

module.exports = { initLocalDb, getSQLiteConnection };
