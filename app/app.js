require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function checkDB() {
  db.getConnection((err, connection) => {
    if (err) {
      console.log(" DB not ready, retrying...");
      setTimeout(checkDB, 2000);
    } else {
      console.log(" Connected to DB");
      connection.release();

      db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100)
        )
      `, (err) => {
        if (err) console.log("Table error:", err);
        else console.log(" Table ready");
      });
    }
  });
}

checkDB();

app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.get("/users/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result);
  });
});

// POST
app.post("/users", (req, res) => {
  const { name, email } = req.body;

  db.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User added" });
    }
  );
});

// PUT
app.put("/users/:id", (req, res) => {
  const { name, email } = req.body;
  const id = req.params.id;

  db.query(
    "UPDATE users SET name=?, email=? WHERE id=?",
    [name, email, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User updated" });
    }
  );
});

// DELETE
app.delete("/users/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM users WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User deleted" });
  });
});

app.listen(process.env.PORT, () => {
  console.log(` Server running on port ${process.env.PORT}`);
});