const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");

// Endpoint de diagnóstico para Oracle
router.get("/oracle-test", async (req, res) => {
  const testConfigs = [
    {
      name: "Formato Simple",
      config: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString:
          "oracle.academy.oracle.com:1521/PDB1.gbcnnaopac01.gbcnnaopacvcn.oraclevcn.com",
      },
    },
    {
      name: "Formato TNS",
      config: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString:
          "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=oracle.academy.oracle.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=PDB1.gbcnnaopac01.gbcnnaopacvcn.oraclevcn.com)))",
      },
    },
    {
      name: "Formato con SID",
      config: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: "oracle.academy.oracle.com:1521/XE",
      },
    },
  ];

  let results = [];

  for (let test of testConfigs) {
    let connection;
    try {
      console.log(`🧪 Probando: ${test.name}`);
      connection = await oracledb.getConnection({
        ...test.config,
        connectTimeout: 10, // 10 segundos timeout
      });

      // Probar una query simple
      const result = await connection.execute("SELECT 1 as test FROM DUAL");

      results.push({
        name: test.name,
        success: true,
        message: "Conexión exitosa",
        testQuery: result.rows,
      });
    } catch (error) {
      results.push({
        name: test.name,
        success: false,
        error: error.message,
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error cerrando conexión de prueba:", err);
        }
      }
    }
  }

  res.json({
    timestamp: new Date().toISOString(),
    environment: {
      DB_USER: process.env.DB_USER ? "✅ Configurado" : "❌ No encontrado",
      DB_PASSWORD: process.env.DB_PASSWORD
        ? "✅ Configurado"
        : "❌ No encontrado",
      DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING
        ? "✅ Configurado"
        : "❌ No encontrado",
    },
    tests: results,
  });
});

module.exports = router;
