import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Cluster } from './Cluster.js';

@Table({
  tableName: 'cost_monitoring_data',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      name: 'idx_cmd_cluster_localday_notdeleted',
      fields: ['clusterId', 'localDay', 'deletedAt'],
    },
  ],
})
export class CostMonitoringData extends Model<
  InferAttributes<CostMonitoringData>,
  InferCreationAttributes<CostMonitoringData>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare clusterId: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare date: Date;

  @Column(DataType.DATEONLY)
  declare localDay?: string | null;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare usersCostInfo: any;

  @Column(DataType.JSON)
  declare metaData?: any | null;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt?: Date | null;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Cluster, 'clusterId')
  declare cluster?: Cluster;

  // Static methods
  static async getDataTotals(monitoringId: string | null = null) {
    const whereClause = await this.buildWhereClauseForMonitoring(monitoringId);
    if (monitoringId && !whereClause) return [];

    const records = await this.findAll({
      attributes: [
        'usersCostInfo',
        'clusterId',
        [this.sequelize!.col('Cluster.timezone_offset'), 'timezone_offset'],
        [this.sequelize!.col('Cluster.name'), 'clusterName'],
      ],
      include: [
        {
          model: Cluster,
          attributes: [],
          as: 'cluster',
          required: true,
        },
      ],
      where: whereClause,
      raw: true,
    });

    const results: any[] = [];
    const groupedData: Record<string, any> = {};

    for (const record of records as any) {
      const { usersCostInfo, timezone_offset, clusterId, clusterName } = record;

      const costInfo =
        typeof usersCostInfo === 'string'
          ? JSON.parse(usersCostInfo)
          : usersCostInfo;

      const usernames = Object.keys(costInfo);

      for (const username of usernames) {
        const key = `${clusterId}-${username}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            id: key,
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

        const userCosts = costInfo[username] || {};
        const compileCost = Number(userCosts.compileCost) || 0;
        const fileAccessCost = Number(userCosts.fileAccessCost) || 0;
        const executeCost = Number(userCosts.executeCost) || 0;

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

    Object.values(groupedData).forEach(result => {
      results.push({
        ...result,
        timezone_offset: Math.min(
          ...(records as any)
            .filter((r: any) => r.clusterId === result.clusterId)
            .map((r: any) => r.timezone_offset)
        ),
      });
    });

    return results;
  }

  static async getClusterDataTotals(monitoringId: string | null = null) {
    const whereClause = await this.buildWhereClauseForMonitoring(monitoringId);
    if (monitoringId && !whereClause)
      return { aggregatedCostsByCluster: {}, overallTotalCost: 0 };

    const records = await this.findAll({
      attributes: [
        'clusterId',
        'metaData',
        [this.sequelize!.col('Cluster.timezone_offset'), 'timezone_offset'],
        [this.sequelize!.col('Cluster.name'), 'clusterName'],
      ],
      include: [
        {
          model: Cluster,
          attributes: [],
          as: 'cluster',
          required: true,
        },
      ],
      where: whereClause,
      raw: true,
    });

    const aggregatedCostsByCluster: Record<string, any> = {};
    let overallTotalCost = 0;

    for (const record of records as any) {
      const { metaData, timezone_offset, clusterName, clusterId } = record;

      let costInfo;
      try {
        costInfo =
          typeof metaData === 'string' ? JSON.parse(metaData) : metaData;
      } catch (error) {
        console.error(
          `Failed to parse metaData for clusterId ${clusterId}:`,
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

  private static async buildWhereClauseForMonitoring(
    monitoringId: string | null = null
  ) {
    const whereClause = this.getStartOfDayWhereClause();
    if (monitoringId) {
      const { CostMonitoring } = this.sequelize!.models as any;
      const monitoring = await CostMonitoring.findOne({
        where: { id: monitoringId },
      });
      if (!monitoring) return null;
      const clusterIds = monitoring.clusterIds;
      if (Array.isArray(clusterIds) && clusterIds.length > 0) {
        (whereClause as any).clusterId = clusterIds;
      }
    }
    return whereClause;
  }

  private static getStartOfDayWhereClause() {
    return {
      deletedAt: null,
      localDay: this.sequelize!.literal('CURRENT_DATE'),
    };
  }
}
