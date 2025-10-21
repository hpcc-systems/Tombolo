'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkUnitDetails extends Model {
    static associate(models) {
      WorkUnitDetails.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        as: 'cluster',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      WorkUnitDetails.belongsTo(models.WorkUnit, {
        foreignKey: 'wuId',
        as: 'workUnit',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  WorkUnitDetails.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      clusterId: {
        type: DataTypes.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      wuId: {
        type: DataTypes.STRING(30),
        references: {
          model: 'work_units',
          key: 'wuId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scopeId: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      scopeName: {
        type: DataTypes.STRING(130),
        allowNull: false,
      },
      scopeType: {
        type: DataTypes.ENUM('activity', 'subgraph', 'graph', 'operation'),
        allowNull: false,
      },
      // Additional identifying columns extracted from properties
      label: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      kind: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: true,
      },
      fileName: {
        type: DataTypes.STRING(130),
        allowNull: true,
      },
      // Metric columns (nullable numeric fields for each relevant metric)
      // Time fields stored as seconds with microsecond precision (DECIMAL(13,6) can hold up to ~31,688 years)
      TimeElapsed: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgElapsed: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMinElapsed: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMaxElapsed: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeStdDevElapsed: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeLocalExecute: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgLocalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeMinLocalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeMaxLocalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeStdDevLocalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeTotalExecute: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgTotalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeMinTotalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeMaxTotalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeStdDevTotalExecute: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeDiskReadIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgDiskReadIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMinDiskReadIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMaxDiskReadIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeStdDevDiskReadIO: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeDiskWriteIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgDiskWriteIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMinDiskWriteIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMaxDiskWriteIO: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeStdDevDiskWriteIO: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeBlocked: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgBlocked: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMinBlocked: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMaxBlocked: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeStdDevBlocked: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeLookAhead: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeAvgLookAhead: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMinLookAhead: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeMaxLookAhead: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      TimeStdDevLookAhead: {
        type: DataTypes.DECIMAL(13, 6),
        allowNull: true,
      },
      TimeFirstRow: { type: DataTypes.DECIMAL(13, 6), allowNull: true },
      NumDiskRowsRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumAvgDiskRowsRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumMinDiskRowsRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumMaxDiskRowsRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumStdDevDiskRowsRead: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      SizeDiskRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeAvgDiskRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMinDiskRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMaxDiskRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeStdDevDiskRead: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumDiskReads: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumAvgDiskReads: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumMinDiskReads: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumMaxDiskReads: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      SizeDiskWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeAvgDiskWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMinDiskWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMaxDiskWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeStdDevDiskWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumDiskWrites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumAvgDiskWrites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumMinDiskWrites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumMaxDiskWrites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      MemoryUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      MemoryAvgUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      MemoryMinUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      MemoryMaxUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      PeakMemoryUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      PeakAvgMemoryUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      PeakMinMemoryUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      PeakMaxMemoryUsage: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      // SizePeakMemory fields removed - duplicates of PeakMemoryUsage
      SpillRowsWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillAvgRowsWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillMinRowsWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillMaxRowsWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillSizeWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillAvgSizeWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillMinSizeWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SpillMaxSizeWritten: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeGraphSpill: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeAvgGraphSpill: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMinGraphSpill: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMaxGraphSpill: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      // RowsProcessed fields removed - duplicates of NumRowsProcessed
      NumRowsProcessed: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumAvgRowsProcessed: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumMinRowsProcessed: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumMaxRowsProcessed: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SkewMinElapsed: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxElapsed: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMinLocalExecute: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxLocalExecute: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMinTotalExecute: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxTotalExecute: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMinDiskRowsRead: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxDiskRowsRead: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMinDiskRead: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxDiskRead: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMinDiskWrite: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxDiskWrite: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMinDiskReadIO: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxDiskReadIO: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SkewMaxDiskWriteIO: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      SizeNetworkWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeAvgNetworkWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMinNetworkWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      SizeMaxNetworkWrite: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumNetworkWrites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumAvgNetworkWrites: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      NumMinNetworkWrites: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      NumMaxNetworkWrites: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      MaxRowSize: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      NumIndexRecords: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumStarts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NumStops: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      OriginalSize: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      CompressedSize: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      ScansBlob: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      ScansIndex: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      WildSeeks: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      SeeksBlob: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      SeeksIndex: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      NodeMinElapsed: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxElapsed: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinLocalExecute: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      NodeMaxLocalExecute: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      NodeMinTotalExecute: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      NodeMaxTotalExecute: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      NodeMinDiskRowsRead: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      NodeMaxDiskRowsRead: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      NodeMinDiskRead: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxDiskRead: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinDiskWrite: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxDiskWrite: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinDiskReadIO: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxDiskReadIO: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinDiskWriteIO: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxDiskWriteIO: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinBlocked: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxBlocked: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinLookAhead: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxLookAhead: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMinFirstRow: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      NodeMaxFirstRow: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'WorkUnitDetails',
      tableName: 'work_unit_details',
      paranoid: true,
      indexes: [
        {
          name: 'work_unit_details_cluster_wu_idx',
          fields: ['clusterId', 'wuId'],
        },
        // {
        //   name: 'work_unit_details_scope_type_idx',
        //   fields: ['scopeType'],
        // },
        // {
        //   name: 'work_unit_details_scope_name_idx',
        //   fields: ['scopeName'],
        // },
        // {
        //   name: 'work_unit_details_scope_id_idx',
        //   fields: ['scopeId'],
        // },
      ],
    }
  );

  return WorkUnitDetails;
};
