const { Sequelize } = require('sequelize');

/**
 * Configuración de base de datos.
 * 
 * Si se provee DATABASE_URL (Postgres), se usa eso. De lo contrario, usa SQLite local para facilitar el desarrollo.
 */

const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'sqlite');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite', {
  dialect,
  storage: dialect === 'sqlite' ? (process.env.DB_STORAGE || './database.sqlite') : undefined,
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
});

module.exports = sequelize;
