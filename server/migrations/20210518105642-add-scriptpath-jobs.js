'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'job',
        'scriptPath', Sequelize.STRING, {
           after: 'wuid'
        }
      ),
      queryInterface.addColumn(
        'job',
        'sprayFileName', Sequelize.STRING, {
           after: 'scriptPath'
        }
      ),
      queryInterface.addColumn(
        'job',
        'sprayDropZone', Sequelize.STRING, {
           after: 'sprayFileName'
        }
      ),
      queryInterface.addColumn(
        'job',
        'sprayedFileScope', Sequelize.STRING, {
           after: 'sprayDropZone'
        }
      )      
    ]);          
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('job','scriptPath'),
      queryInterface.removeColumn('job','sprayFileName'),
      queryInterface.removeColumn('job','sprayDropZone'),
      queryInterface.removeColumn('job','sprayedFileScope')
    ]);
  }
};