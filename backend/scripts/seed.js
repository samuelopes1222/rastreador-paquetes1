const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const Driver = require('../src/models/Driver');
const Package = require('../src/models/Package');
const TrackingHistory = require('../src/models/TrackingHistory');
const { mockDrivers, mockPackages } = require('../../SEED_DATA');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando poblamiento de base de datos...');

    // Sincronizar base de datos
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos sincronizada');

    // Crear drivers con contraseñas hasheadas
    for (const driverData of mockDrivers) {
      const { password, ...driverFields } = driverData;
      const passwordHash = await bcrypt.hash(password, 10);

      await Driver.create({
        ...driverFields,
        passwordHash,
      });
    }
    console.log('✅ Drivers creados');

    // Crear paquetes
    for (const packageData of mockPackages) {
      await Package.create(packageData);
    }
    console.log('✅ Paquetes creados');

    console.log('🎉 Base de datos poblada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();