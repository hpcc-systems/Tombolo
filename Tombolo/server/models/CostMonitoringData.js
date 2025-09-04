'use strict';

const { Model, Op, fn, col } = require('sequelize');
const logger = require('../config/logger');

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

    static getStartOfDayWhereClause() {
      return {
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
    }

    static async getDataTotals(monitoringId = null) {
      const whereClause = this.getStartOfDayWhereClause();

      // Add monitoringId filter if provided
      if (monitoringId) {
        whereClause.monitoringId = monitoringId;
      }

      const records = await this.findAll({
        attributes: [
          'monitoringId',
          'usersCostInfo',
          'clusterId',
          [col('Cluster.timezone_offset'), 'timezone_offset'],
          [col('Cluster.name'), 'clusterName'],
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
        const { monitoringId, usersCostInfo, timezone_offset, clusterId, clusterName } = record;

        const costInfo =
          typeof usersCostInfo === 'string'
            ? JSON.parse(usersCostInfo)
            : usersCostInfo;

        const usernames = Object.keys(costInfo);

        for (const username of usernames) {
          const key = `${monitoringId}-${clusterId}-${username}`;
          if (!groupedData[key]) {
            groupedData[key] = {
              id: key,
              monitoringId,
              username,
              clusterId,
              clusterName,
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
        // Ensure timezone_offset is stable per (monitoringId, clusterId)
        results.push({
          ...result,
          timezone_offset: Math.min(
            ...records
              .filter(
                r => r.monitoringId === result.monitoringId && r.clusterId === result.clusterId
              )
              .map(r => r.timezone_offset)
          ),
        });
      });

      return results;
    }

    /**
     * Represents aggregated cost totals for a single (monitoringId, clusterId) pair.
     * @typedef {Object} CostClusterTotals
     * @property {string} monitoringId - Unique identifier of the cost monitoring.
     * @property {string} clusterId - Unique identifier of the cluster.
     * @property {string} clusterName - Human-readable name of the cluster.
     * @property {number} timezone_offset - Minutes offset from UTC (e.g., -240 for UTC-4).
     * @property {number} totalCost - Total cost across compile, execute, and file access.
     * @property {number} compileCost - Compilation-related cost total.
     * @property {number} executeCost - Execution-related cost total.
     * @property {number} fileAccessCost - File access-related cost total.
     */

    /**
     * Computes total costs per cluster for the current cluster-local day.
     * If a monitoringId is provided, results are filtered to that monitoring; otherwise, totals for all active monitorings are returned.
     *
     * @param {?string} [monitoringId=null] - Optional monitoring ID (UUID) to filter the results by.
     * @returns {Promise<CostClusterTotals[]>} Promise resolving to an array of clustered totals with cluster metadata.
     */
    static async getClusterDataTotals(monitoringId = null) {
      const whereClause = this.getStartOfDayWhereClause();

      if (monitoringId) {
        whereClause.monitoringId = monitoringId;
      }

      const records = await this.findAll({
        attributes: [
          'monitoringId',
          'clusterId',
          'metaData',
          [col('Cluster.timezone_offset'), 'timezone_offset'],
          [col('Cluster.name'), 'clusterName'],
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

      // const results = [];
      const aggregatedCostsByCluster = {};
      let overallTotalCost = 0;

      for (const record of records) {
        const {
          monitoringId,
          metaData,
          timezone_offset,
          clusterName,
          clusterId,
        } = record;

        let costInfo;
        try {
          costInfo =
            typeof metaData === 'string' ? JSON.parse(metaData) : metaData;
        } catch (error) {
          logger.error(
            `Failed to parse metaData for monitoringId ${monitoringId}:`,
            error
          );
          continue;
        }

        if (costInfo === null || !('clusterCostData' in costInfo)) {
          continue;
        }
        const clusterCostInfo = costInfo.clusterCostData;
        if (!clusterCostInfo) {
          continue;
        }

        // Initialize aggregated costs for this clusterId if not already present
        if (!aggregatedCostsByCluster[clusterId]) {
          aggregatedCostsByCluster[clusterId] = {
            clusterName,
            timezone_offset,
            fileAccessCost: 0,
            executeCost: 0,
            compileCost: 0,
            totalCost: 0,
          };
        }

        // Aggregate the cost fields for this clusterId
        aggregatedCostsByCluster[clusterId].fileAccessCost +=
          parseFloat(clusterCostInfo.fileAccessCost) || 0;
        aggregatedCostsByCluster[clusterId].executeCost +=
          parseFloat(clusterCostInfo.executeCost) || 0;
        aggregatedCostsByCluster[clusterId].compileCost +=
          parseFloat(clusterCostInfo.compileCost) || 0;
        aggregatedCostsByCluster[clusterId].totalCost +=
          parseFloat(clusterCostInfo.totalCost) || 0;

        overallTotalCost += parseFloat(clusterCostInfo.totalCost) || 0;
      }

      return {
        aggregatedCostsByCluster,
        overallTotalCost,
      };
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
