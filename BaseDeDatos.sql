CREATE DATABASE tokyo_noodles;
USE tokyo_noodles;

CREATE TABLE roles (
    id_rol INT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO roles VALUES (1, 'usuario'), (2, 'administrador');

CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    rut VARCHAR(12),
    imagen_perfil MEDIUMBLOB,     
    imagen_nombre VARCHAR(255),    
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_rol INT,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

ALTER TABLE usuarios
ADD COLUMN google_id VARCHAR(255) NULL AFTER imagen_nombre;
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);

CREATE TABLE categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO categorias (nombre) VALUES 
('Ramen'), ('Gyozas'), ('Bebidas'), ('Postres');

CREATE TABLE productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    id_categoria INT,
    stock INT DEFAULT 0,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'pendiente',
    tipo_entrega VARCHAR(20) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE detalles_pedido (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT,
    id_producto INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE direcciones_despacho (
    id_direccion INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT,
    calle VARCHAR(255) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
);

CREATE TABLE historial_inventario (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_producto INT,
    cantidad_anterior INT,
    cantidad_nueva INT,
    tipo_movimiento VARCHAR(50),
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT, 
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_pedidos_usuario ON pedidos(id_usuario);
CREATE INDEX idx_productos_categoria ON productos(id_categoria);

DELIMITER //
CREATE TRIGGER after_pedido_insert 
AFTER INSERT ON detalles_pedido
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET stock = stock - NEW.cantidad 
    WHERE id_producto = NEW.id_producto;
    
    INSERT INTO historial_inventario 
    (id_producto, cantidad_anterior, cantidad_nueva, tipo_movimiento)
    SELECT 
        NEW.id_producto,
        stock + NEW.cantidad,
        stock,
        'venta'
    FROM productos
    WHERE id_producto = NEW.id_producto;
END;
//
DELIMITER ;

CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires INT(11) UNSIGNED NOT NULL,
    data TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;