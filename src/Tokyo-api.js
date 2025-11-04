import express from "express";
import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const sequelize = new Sequelize(
  process.env.DB_NAME || "tokyo_noodles",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "TallerTokyoNoodles",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: DataTypes.STRING,
  apellido: DataTypes.STRING,
  correo: {
    type: DataTypes.STRING,
    unique: true,
  },
  contrasena: DataTypes.STRING,
  telefono: DataTypes.STRING,
});

const Producto = sequelize.define("Producto", {
  id_producto: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: DataTypes.STRING,
  descripcion: DataTypes.STRING,
  precio: DataTypes.FLOAT,
  stock: DataTypes.INTEGER,
  imagen: DataTypes.STRING,
});

const Pedido = sequelize.define("Pedido", {
  id_pedido: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  total: DataTypes.FLOAT,
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

const DetallePedido = sequelize.define("DetallePedido", {
  id_detalle: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: DataTypes.INTEGER,
  subtotal: DataTypes.FLOAT,
});

Usuario.hasMany(Pedido, { foreignKey: "id_usuario" });
Pedido.belongsTo(Usuario, { foreignKey: "id_usuario" });

Pedido.hasMany(DetallePedido, { foreignKey: "id_pedido" });
DetallePedido.belongsTo(Pedido, { foreignKey: "id_pedido" });

Producto.hasMany(DetallePedido, { foreignKey: "id_producto" });
DetallePedido.belongsTo(Producto, { foreignKey: "id_producto" });

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id_usuario, correo: usuario.correo },
    process.env.JWT_SECRET || "tokyo_secret",
    { expiresIn: "2h" }
  );
};


app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, msg: "Conexión a MySQL exitosa" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { nombre, apellido, correo, contrasena, telefono } = req.body;

    const existente = await Usuario.findOne({ where: { correo } });
    if (existente)
      return res.status(400).json({ error: "El correo ya está registrado" });

    const hash = await bcrypt.hash(contrasena, 10);
    const nuevo = await Usuario.create({
      nombre,
      apellido,
      correo,
      contrasena: hash,
      telefono,
    });

    res.json({ msg: "Usuario registrado", usuario: nuevo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const usuario = await Usuario.findOne({ where: { correo } });

    if (!usuario)
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });

    const valido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valido)
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });

    const token = generarToken(usuario);
    res.json({ msg: "Login exitoso", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const authMiddleware = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(403).json({ error: "Token requerido" });
  const token = header.split(" ")[1];
  try {
    const dec = jwt.verify(token, process.env.JWT_SECRET || "tokyo_secret");
    req.user = dec;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

app.get("/api/productos", async (req, res) => {
  const productos = await Producto.findAll();
  res.json(productos);
});

app.get("/api/productos/:id", async (req, res) => {
  const prod = await Producto.findByPk(req.params.id);
  if (!prod) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(prod);
});

app.post("/api/pedidos", authMiddleware, async (req, res) => {
  const { detalles } = req.body;
  const usuarioId = req.user.id;

  try {
    const t = await sequelize.transaction();

    let total = 0;
    for (const d of detalles) {
      const producto = await Producto.findByPk(d.id_producto);
      if (!producto || producto.stock < d.cantidad) {
        throw new Error(`Stock insuficiente en producto ${d.id_producto}`);
      }
      total += producto.precio * d.cantidad;
    }

    const pedido = await Pedido.create({ id_usuario: usuarioId, total }, { transaction: t });

    for (const d of detalles) {
      const producto = await Producto.findByPk(d.id_producto);
      await DetallePedido.create(
        {
          id_pedido: pedido.id_pedido,
          id_producto: producto.id_producto,
          cantidad: d.cantidad,
          subtotal: producto.precio * d.cantidad,
        },
        { transaction: t }
      );

      await producto.update(
        { stock: producto.stock - d.cantidad },
        { transaction: t }
      );
    }

    await t.commit();
    res.json({ msg: "Pedido creado con éxito", pedido });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/perfil", authMiddleware, async (req, res) => {
  const usuario = await Usuario.findByPk(req.user.id, {
    attributes: { exclude: ["contrasena"] },
  });
  res.json(usuario);
});

const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => console.log(`API ejecutándose en puerto ${PORT}`));
});
