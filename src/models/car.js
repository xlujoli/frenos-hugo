const { getConnection } = require("./initDb"); // Assuming initDb.js exports getConnection
const oracledb = require("oracledb");

class Car {
  constructor(id, plate, brand, model, owner, phone) {
    this.id = id;
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.owner = owner;
    this.phone = phone;
  }

  static async findByPlate(plate) {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT id, plate, brand, model, owner, phone FROM cars WHERE plate = :plate`,
        { plate: plate.toUpperCase() },
        { outFormat: oracledb.OUT_FORMAT_OBJECT } // Get results as objects
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new Car(
          row.ID,
          row.PLATE,
          row.BRAND,
          row.MODEL,
          row.OWNER,
          row.PHONE
        );
      }
      return null;
    } catch (err) {
      console.error("Error finding car by plate:", err);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error("Error closing connection:", closeErr);
        }
      }
    }
  }

  static async create(carData) {
    const { plate, brand, model, owner, phone } = carData;
    const query = `
            INSERT INTO cars (id, plate, brand, model, owner, phone) 
            VALUES (car_id_seq.NEXTVAL, :plate, :brand, :model, :owner, :phone)
            RETURNING id INTO :id`; // RETURNING id clause to get the new ID

    const params = {
      plate: plate.toUpperCase(),
      brand: brand.toUpperCase(),
      model: model.toUpperCase(),
      owner: owner.toUpperCase(),
      phone: phone, // Assuming phone is already formatted
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }, // Define id as an output bind variable
    };

    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(query, params, {
        autoCommit: true,
      });

      if (result.outBinds && result.outBinds.id) {
        const newCarId = result.outBinds.id[0];
        return new Car(
          newCarId,
          params.plate,
          params.brand,
          params.model,
          params.owner,
          params.phone
        );
      } else {
        // Fallback or error if ID is not returned as expected
        // This might happen if RETURNING INTO is not supported or configured correctly
        // For now, we can re-fetch or assume success based on no error
        console.warn(
          "Car created, but ID not returned directly. Fetching by plate."
        );
        return await Car.findByPlate(params.plate); // Re-fetch to get the ID
      }
    } catch (err) {
      console.error("Error creating car:", err);
      if (err.errorNum === 1) {
        // ORA-00001: unique constraint (CO_A851_SQL_T01_ADMIN.SYS_C00xxxx) violated
        throw new Error(`La placa ${params.plate} ya está registrada.`);
      }
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error("Error closing connection:", closeErr);
        }
      }
    }
  }

  // Add other methods like update, delete, findAll as needed, adapting SQL for Oracle
}

module.exports = Car;
