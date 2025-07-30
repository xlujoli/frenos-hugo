const { getConnection } = require("./initDb");
const oracledb = require("oracledb"); // Required for oracledb.NUMBER, oracledb.BIND_OUT etc.

class Service {
  constructor(id, workOrder, plate, work, cost, service_date) {
    this.id = id;
    this.workOrder = workOrder; // Added workOrder
    this.plate = plate;
    this.work = work;
    this.cost = cost;
    this.service_date = service_date;
  }

  static async create(serviceData) {
    const { workOrder, plate, work, cost } = serviceData;
    // service_date will use default CURRENT_TIMESTAMP from table definition
    const query = `
            INSERT INTO services (id, workOrder, plate, work, cost) 
            VALUES (service_id_seq.NEXTVAL, :workOrder, :plate, :work, :cost)
            RETURNING id, service_date INTO :id, :service_date`;

    const params = {
      workOrder: workOrder, // Make sure this is passed from the route
      plate: plate.toUpperCase(),
      work: work,
      cost: cost,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      service_date: { type: oracledb.DATE, dir: oracledb.BIND_OUT },
    };

    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(query, params, {
        autoCommit: true,
      });

      if (
        result.outBinds &&
        result.outBinds.id &&
        result.outBinds.service_date
      ) {
        const newServiceId = result.outBinds.id[0];
        const newServiceDate = result.outBinds.service_date[0];
        return new Service(
          newServiceId,
          params.workOrder,
          params.plate,
          params.work,
          params.cost,
          newServiceDate
        );
      } else {
        console.warn("Service created, but ID or date not returned directly.");
        // Could re-fetch if necessary, but for now, we'll rely on the input data + successful execution
        return new Service(
          null,
          params.workOrder,
          params.plate,
          params.work,
          params.cost,
          new Date()
        ); // Approximate date
      }
    } catch (err) {
      console.error("Error creating service:", err);
      // Handle specific Oracle errors if needed, e.g., foreign key violation
      if (err.errorNum === 2291) {
        // ORA-02291: integrity constraint (schema.constraint_name) violated - parent key not found
        throw new Error(
          `Error creating service: Car with plate ${params.plate} not found.`
        );
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

  static async findByPlate(plate) {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT id, workOrder, plate, work, cost, service_date FROM services WHERE plate = :plate ORDER BY service_date DESC`,
        { plate: plate.toUpperCase() },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return result.rows.map(
        (row) =>
          new Service(
            row.ID,
            row.WORKORDER,
            row.PLATE,
            row.WORK,
            row.COST,
            row.SERVICE_DATE
          )
      );
    } catch (err) {
      console.error("Error finding services by plate:", err);
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

  static async findByWorkOrder(workOrder) {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT s.id, s.workOrder, s.plate, s.work, s.cost, s.service_date, 
                        c.brand, c.model, c.owner, c.phone
                 FROM services s
                 JOIN cars c ON s.plate = c.plate
                 WHERE s.workOrder = :workOrder`,
        { workOrder: workOrder },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        // Return a combined object or structure as needed by your consultation page
        return {
          id: row.ID,
          workOrder: row.WORKORDER,
          plate: row.PLATE,
          work: row.WORK,
          cost: row.COST,
          service_date: row.SERVICE_DATE,
          car: {
            brand: row.BRAND,
            model: row.MODEL,
            owner: row.OWNER,
            phone: row.PHONE,
          },
        };
      }
      return null;
    } catch (err) {
      console.error("Error finding service by work order:", err);
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

  static async getNextWorkOrder() {
    let connection;
    try {
      connection = await getConnection();
      // Ensure a sequence for work orders exists, or use MAX + 1
      // For simplicity, using MAX + 1. Consider a sequence for high concurrency.
      const result = await connection.execute(
        `SELECT NVL(MAX(workOrder), 0) + 1 AS nextWorkOrder FROM services`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return result.rows[0].NEXTWORKORDER;
    } catch (err) {
      console.error("Error getting next work order:", err);
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

  // Add other methods like update, delete, findAll as needed
}

module.exports = Service;
