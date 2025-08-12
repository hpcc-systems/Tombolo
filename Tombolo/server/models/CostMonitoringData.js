'use strict';

const { Model, Op, fn, col } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CostMonitoringData extends Model {
    static associate(models) {
      CostMonitoringData.belongsTo(models.Application, {
        foreignKey: 'applicationId',
        as: 'application',
      });
      CostMonitoringData.belongsTo(models.CostMonitoring, {
        foreignKey: 'monitoringId',
        as: 'costMonitoring',
      });
      CostMonitoringData.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        as: 'cluster',
      });
    }

    static async getDataTotals(monitoringId = null) {
      const whereClause = {
        deletedAt: null,
        [Op.and]: [
          this.sequelize.where(
            fn(
              'DATE',
              fn(
                'DATE_ADD',
                col('CostMonitoringData.date'),
                this.sequelize.literal('INTERVAL timezone_offset MINUTE')
              )
            ),
            '=',
            fn(
              'DATE',
              fn(
                'DATE_ADD',
                fn('CURRENT_TIMESTAMP'),
                this.sequelize.literal('INTERVAL timezone_offset MINUTE')
              )
            )
          ),
        ],
      };

      // Add monitoringId filter if provided
      if (monitoringId) {
        whereClause.monitoringId = monitoringId;
      }

      const records = await this.findAll({
        attributes: [
          'monitoringId',
          'usersCostInfo',
          [col('Cluster.timezone_offset'), 'timezone_offset'],
        ],
        include: [
          {
            model: this.sequelize.models.Cluster,
            attributes: [],
            as: 'cluster',
            required: true, // INNER JOIN
          },
        ],
        where: whereClause,
        raw: true,
      });

      // Process records to extract usernames and aggregate costs
      const results = [];
      const groupedData = {};

      for (const record of records) {
        const { monitoringId, usersCostInfo, timezone_offset } = record;

        const costInfo =
          typeof usersCostInfo === 'string'
            ? JSON.parse(usersCostInfo)
            : usersCostInfo;

        const usernames = Object.keys(costInfo);

        for (const username of usernames) {
          const key = `${monitoringId}-${username}`;
          if (!groupedData[key]) {
            groupedData[key] = {
              id: key,
              monitoringId,
              username,
              timezone_offset,
              compileCost: 0,
              fileAccessCost: 0,
              executeCost: 0,
              totalCost: 0,
            };
          }

          // Extract costs and convert to numbers, default to 0 if null/undefined
          const userCosts = costInfo[username] || {};
          const compileCost = Number(userCosts.compileCost) || 0;
          const fileAccessCost = Number(userCosts.fileAccessCost) || 0;
          const executeCost = Number(userCosts.executeCost) || 0;

          // Aggregate costs
          groupedData[key].compileCost += parseFloat(compileCost.toFixed(5));
          groupedData[key].fileAccessCost += parseFloat(
            fileAccessCost.toFixed(5)
          );
          groupedData[key].executeCost += parseFloat(executeCost.toFixed(5));
          groupedData[key].totalCost += parseFloat(
            (compileCost + fileAccessCost + executeCost).toFixed(5)
          );
        }
      }

      // Convert groupedData to array
      Object.values(groupedData).forEach(result => {
        // Ensure timezone_offset is the minimum (though typically the same for a monitoringId)
        results.push({
          ...result,
          timezone_offset: Math.min(
            ...records
              .filter(r => r.monitoringId === result.monitoringId)
              .map(r => r.timezone_offset)
          ),
        });
      });

      return results;
    }
  }

  CostMonitoringData.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      clusterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'cost_monitorings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      usersCostInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      analyzed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notificationSentDate: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'CostMonitoringData',
      tableName: 'cost_monitoring_data',
      timestamps: true,
      paranoid: true,
      indexes: [],
    }
  );

  return CostMonitoringData;
};
