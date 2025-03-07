CREATE TABLE bins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bin_id VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  fill_level INT NOT NULL,
  last_collection DATE NOT NULL
);

CREATE TABLE facilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  facility_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  status VARCHAR(255) NOT NULL
);

CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  load INT NOT NULL,
  eta DATE NOT NULL
);

CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  waste_type VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  source VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL
);