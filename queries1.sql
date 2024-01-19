DROP TABLE IF EXISTS loginTable1;

CREATE TABLE loginTable1 (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(50),
  surname VARCHAR(50),
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255)
);

DROP TABLE IF EXISTS loginTable2;

CREATE TABLE loginTable2 (
  id SERIAL PRIMARY KEY,
  displayname VARCHAR(50),
  email VARCHAR(50) UNIQUE,
  googleId VARCHAR(255)
);
