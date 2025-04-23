//
// Server.js
// Created by Scott Mitchell on 04/22/2025
// Block 33 - The Acme HR Directory
//

const express = require("express");
const pg = require("pg");

const { Client } = pg;
const client = new Client({
  user: "postgres",
  password: "123",
  host: "localhost",
  port: 5432,
  database: "acme_hr",
});

const app = express();
const port = 3000;
app.use(express.json());

//  1) we need to initialize the departments table
//  2) we need to initialize the employees table
//  3) we need to insert some data into the departments table
//  4) we need to insert some data into the employees table
async function initializeDB() {
  console.log("Initializing database...");
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        department_id INTEGER REFERENCES departments(id)
      );
    `);
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

async function insertData() {
  console.log("Checking and inserting data...");
  try {
    // Check if departments already exist
    const departmentsCheck = await client.query(
      "SELECT COUNT(*) FROM departments"
    );
    console.log("departmentCheck = ", departmentsCheck);
    if (parseInt(departmentsCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO departments (name) VALUES
          ('HR'),
          ('Engineering'),
          ('Sales'),
          ('Marketing');
      `);
      console.log("Departments inserted");
    } else {
      console.log("Departments already exist");
    }

    // Check if employees already exist
    const employeesCheck = await client.query("SELECT COUNT(*) FROM employees");
    console.log("employeeCheck = ", employeesCheck);
    if (parseInt(employeesCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO employees (name, department_id) VALUES
          ('Alice', 1),
          ('Bob', 2),
          ('Charlie', 3),
          ('David', 4);
      `);
      console.log("Employees inserted");
    } else {
      console.log("Employees already exist");
    }
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

// API Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Acme HR Directory API!");
});

// Get all the departments
app.get("/api/departments", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM departments");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get all the employees
app.get("/api/employees", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM employees");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Create a new employee
app.post("/api/employees", async (req, res) => {
  const { name, department_id } = req.body;
  try {
    const result = await client.query(
      "INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *",
      [name, department_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Update an employee
app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { name, department_id } = req.body;
  try {
    const result = await client.query(
      "UPDATE employees SET name = $1, department_id = $2 WHERE id = $3 RETURNING *",
      [name, department_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Employee not found");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Delete an employee
app.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("DELETE FROM employees WHERE id = $1", [
      id,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).send("Internal Server Error");
  }
});

// An error handling route
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send("Something broke!");
// });

app.listen(port, async () => {
  await client.connect();
  console.log(`Server is running on http://localhost:${port}`);
  await initializeDB();
  await insertData();
});
