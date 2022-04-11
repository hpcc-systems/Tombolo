'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('dataflow', 'dataFlowClusterCredId', {
        type: Sequelize.UUID,
        after: "clusterId"
      }),
       queryInterface.addColumn('dataflow', 'metaData', {
        type: Sequelize.JSON,
        after: "dataFlowClusterCredId"
      })
    ])
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('dataflow', 'dataFlowClusterCredId'),
      queryInterface.removeColumn('dataflow', 'metaData')
    ])
  }
};