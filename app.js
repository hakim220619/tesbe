const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const ip = require("ip");
const ipAddress = ip.address();
require("dotenv").config();
const yup = require("yup");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const startsWithSpecialChars = /^[_\-\+]{1}.*/;

const merekSchema = yup.object({
  body: yup.object({
    name: yup
      .string()
      .matches(
        /^[A-Za-z0-9 .,'!&]+$/,
        "Only String Or Number are allowed for this field"
      )
      .required(),
    deskripsi: yup
      .string()
      .matches(
        /^[A-Za-z0-9 .,'!&]+$/,
        "Only String Or Number are allowed for this field"
      )
      .required(),
  }),
});
const productsSchema = yup.object({
  body: yup.object({
    name: yup
      .string()
      .matches(
        /^[A-Za-z0-9 .,'!&]+$/,
        "Only String Or Number are allowed for this field"
      )
      .required(),
    price: yup.number().positive().label("Price").required("pls enter").min(1),
    stock: yup.number().positive().label("Price").required("pls enter").min(1),
    deskripsi: yup
      .string()
      .matches(
        /^[A-Za-z0-9 .,'!&]+$/,
        "Only String Or Number are allowed for this field"
      )
      .required(),
  }),
});

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err) {
    return res.status(500).json({ type: err.name, message: err.message });
  }
};

app.get("/query", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select p.* from products p, merek m where p.deskripsi=m.deskripsi and p.price BETWEEN '100000' AND '200000' and p.stock > 5 order by p.price asc"
    );
    if (rows.length > 0) {
      res.json(rows);
    } else {
      res.status(500).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/products", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select p.* from products p order by id asc limit 10 "
    );
    if (rows.length > 0) {
      res.json(rows);
    } else {
      res.status(500).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const { rows } = await pool.query(
      "select p.* from products p where id = " + productId + ""
    );
    if (rows.length > 0) {
      res.json(rows);
    } else {
      res.status(500).json({ message: "id tidak ada didalam database" });
    }
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/summaryProducts", async (req, res) => {
  try {
    const rows1 = await pool.query("select count(*) from products");
    const { rows } = await pool.query("select * from merek");
    res.json({totalProducts: `${rows1['rows'].length}`, totalMerek: `${rows.length}`});
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/createPostMerk", validate(merekSchema), async (req, res) => {
  const { name, deskripsi } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO public.merek (Name, Deskripsi) VALUES ($1, $2) RETURNING *",
      [name, deskripsi]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post(
  "/api/createPostProducts",
  validate(productsSchema),
  async (req, res) => {
    const { name, price, stock, deskripsi } = req.body;
    try {
      const { rows } = await pool.query(
        "INSERT INTO products (Name, Price, Stock, Deskripsi) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, price, stock, deskripsi]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("Error executing query", err);
    }
  }
);

// Update a product
app.put("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  const { name, price, stock, deskripsi } = req.body;

  try {
    const { rows } = await pool.query(
      "UPDATE products SET name = $1, price = $2, stock = $3, deskripsi = $4 WHERE id = $5 RETURNING *",
      [name, price, stock, deskripsi, productId]
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(500).json({ message: "id tidak ada didalam database" });
    }
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a product
app.delete("/api/products/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const { rows } = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [productId]
    );

    if (rows.length > 0) {
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "id tidak ada didalam database" });
    }
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Network access via: ${ipAddress}:${PORT}!`);
});
