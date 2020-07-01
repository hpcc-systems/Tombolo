'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'workflowdetails',
        'wu_start', Sequelize.STRING, {
           after: 'instance_id'
        }
      ),
      queryInterface.addColumn(
        'workflowdetails',
        'wu_end', Sequelize.STRING, {
           after: 'instance_id'
        }
      ),
      queryInterface.addColumn(
        'workflowdetails',
        'wu_duration', Sequelize.STRING, {
           after: 'instance_id'
        }
      )      
    ]);      
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('workflowdetails','wu_start'),
      queryInterface.removeColumn('workflowdetails','wu_end'),
      queryInterface.removeColumn('workflowdetails','wu_duration')
    ]);
  }
};