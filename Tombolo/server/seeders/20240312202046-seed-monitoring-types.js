module.exports = {
  up: async queryInterface => {
    return queryInterface.bulkInsert('monitoring_types', [
      {
        id: uuidv4(),
        name: 'Job Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
      {
        id: uuidv4(),
        name: 'Directory Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
      {
        id: uuidv4(),
        name: 'Landing Zone Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
      {
        id: uuidv4(),
        name: 'Cost Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
      {
        id: uuidv4(),
        name: 'Cluster Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
    ]);
  },

  down: async queryInterface => {
    return queryInterface.bulkDelete('monitoring_types', null, {});
  },
};
