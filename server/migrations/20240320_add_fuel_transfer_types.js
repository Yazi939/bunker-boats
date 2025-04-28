module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new transaction types to the enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_fuel_transactions_type ADD VALUE IF NOT EXISTS 'base_to_bunker';
      ALTER TYPE enum_fuel_transactions_type ADD VALUE IF NOT EXISTS 'bunker_to_base';
    `);

    // Add new columns for source and destination
    await queryInterface.addColumn('FuelTransactions', 'source', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('FuelTransactions', 'destination', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns
    await queryInterface.removeColumn('FuelTransactions', 'source');
    await queryInterface.removeColumn('FuelTransactions', 'destination');

    // Note: We cannot remove values from an enum type in PostgreSQL
    // The only way would be to create a new type without these values
    // and update all existing records, which is risky for a rollback
  }
}; 