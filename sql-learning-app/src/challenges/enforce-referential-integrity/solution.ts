export const solutionQueries = {
  postgres: `CREATE TABLE products_inventory (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id)
);`,
  mysql: `CREATE TABLE products_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL CHECK (stock >= 0),
  warehouse_id INT NOT NULL,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);`,
};
