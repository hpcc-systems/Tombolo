'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'work_unit_details',
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
        },
        clusterId: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        wuId: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        scopeId: {
          type: Sequelize.STRING(15),
          allowNull: true,
        },
        scopeName: {
          type: Sequelize.STRING(130),
          allowNull: false,
        },
        scopeType: {
          type: Sequelize.ENUM('activity', 'subgraph', 'graph', 'operation'),
          allowNull: false,
        },
        // Additional identifying columns extracted from properties
        label: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        kind: {
          type: Sequelize.SMALLINT.UNSIGNED,
          allowNull: true,
        },
        fileName: {
          type: Sequelize.STRING(130),
          allowNull: true,
        },
        // Metric columns (nullable numeric fields for each relevant metric)
        // Time fields stored as seconds with microsecond precision (DECIMAL(13,6) can hold up to ~31,688 years)
        TimeElapsed: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgElapsed: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMinElapsed: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMaxElapsed: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeStdDevElapsed: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeLocalExecute: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgLocalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeMinLocalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeMaxLocalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeStdDevLocalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeTotalExecute: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgTotalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeMinTotalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeMaxTotalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeStdDevTotalExecute: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeDiskReadIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgDiskReadIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMinDiskReadIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMaxDiskReadIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeStdDevDiskReadIO: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeDiskWriteIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgDiskWriteIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMinDiskWriteIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMaxDiskWriteIO: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeStdDevDiskWriteIO: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeBlocked: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgBlocked: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMinBlocked: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMaxBlocked: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeStdDevBlocked: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeLookAhead: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeAvgLookAhead: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMinLookAhead: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeMaxLookAhead: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        TimeStdDevLookAhead: {
          type: Sequelize.DECIMAL(13, 6),
          allowNull: true,
        },
        TimeFirstRow: { type: Sequelize.DECIMAL(13, 6), allowNull: true },
        NumDiskRowsRead: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        NumAvgDiskRowsRead: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumMinDiskRowsRead: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumMaxDiskRowsRead: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumStdDevDiskRowsRead: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SizeDiskRead: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeAvgDiskRead: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeMinDiskRead: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeMaxDiskRead: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeStdDevDiskRead: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumDiskReads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumAvgDiskReads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumMinDiskReads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumMaxDiskReads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        SizeDiskWrite: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeAvgDiskWrite: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeMinDiskWrite: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeMaxDiskWrite: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeStdDevDiskWrite: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumDiskWrites: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumAvgDiskWrites: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumMinDiskWrites: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumMaxDiskWrites: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        MemoryUsage: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        MemoryAvgUsage: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        MemoryMinUsage: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        MemoryMaxUsage: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        PeakMemoryUsage: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        PeakAvgMemoryUsage: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        PeakMinMemoryUsage: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        PeakMaxMemoryUsage: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        // SizePeakMemory fields removed - duplicates of PeakMemoryUsage
        SpillRowsWritten: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SpillAvgRowsWritten: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SpillMinRowsWritten: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SpillMaxRowsWritten: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SpillSizeWritten: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SpillAvgSizeWritten: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SpillMinSizeWritten: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SpillMaxSizeWritten: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SizeGraphSpill: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeAvgGraphSpill: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeMinGraphSpill: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeMaxGraphSpill: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        // RowsProcessed fields removed - duplicates of NumRowsProcessed
        NumRowsProcessed: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        NumAvgRowsProcessed: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumMinRowsProcessed: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumMaxRowsProcessed: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SkewMinElapsed: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxElapsed: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMinLocalExecute: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxLocalExecute: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMinTotalExecute: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxTotalExecute: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMinDiskRowsRead: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxDiskRowsRead: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMinDiskRead: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxDiskRead: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMinDiskWrite: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxDiskWrite: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMinDiskReadIO: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxDiskReadIO: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SkewMaxDiskWriteIO: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
        SizeNetworkWrite: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        SizeAvgNetworkWrite: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SizeMinNetworkWrite: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        SizeMaxNetworkWrite: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        NumNetworkWrites: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumAvgNetworkWrites: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        NumMinNetworkWrites: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        NumMaxNetworkWrites: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        MaxRowSize: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        NumIndexRecords: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumStarts: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NumStops: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        OriginalSize: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        CompressedSize: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        ScansBlob: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        ScansIndex: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        WildSeeks: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        SeeksBlob: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        SeeksIndex: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        NodeMinElapsed: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMaxElapsed: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMinLocalExecute: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMaxLocalExecute: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMinTotalExecute: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMaxTotalExecute: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMinDiskRowsRead: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMaxDiskRowsRead: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMinDiskRead: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMaxDiskRead: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMinDiskWrite: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMaxDiskWrite: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMinDiskReadIO: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMaxDiskReadIO: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMinDiskWriteIO: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMaxDiskWriteIO: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        NodeMinBlocked: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMaxBlocked: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMinLookAhead: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMaxLookAhead: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMinFirstRow: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
        NodeMaxFirstRow: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
      },
      {
        rowFormat: 'COMPRESSED',
        keyBlockSize: 8,
      }
    );

    // Add foreign key constraints
    await queryInterface.addConstraint('work_unit_details', {
      fields: ['clusterId'],
      type: 'foreign key',
      name: 'work_unit_details_cluster_fk',
      references: {
        table: 'clusters',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('work_unit_details', {
      fields: ['wuId', 'clusterId'],
      type: 'foreign key',
      name: 'work_unit_details_workunit_fk',
      references: {
        table: 'work_units',
        fields: ['wuId', 'clusterId'],
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Add indexes
    await queryInterface.addIndex('work_unit_details', ['clusterId', 'wuId'], {
      name: 'work_unit_details_cluster_wu_idx',
    });

    await queryInterface.addIndex('work_unit_details', ['wuId', 'clusterId', 'scopeId'], {
      name: 'work_unit_details_uniq_wuid_clusterid_scope_idx',
      unique: true,
    });

    // await queryInterface.addIndex('work_unit_details', ['scopeType'], {
    //   name: 'work_unit_details_scope_type_idx',
    // });
    //
    // await queryInterface.addIndex('work_unit_details', ['scopeName'], {
    //   name: 'work_unit_details_scope_name_idx',
    // });
    //
    // await queryInterface.addIndex('work_unit_details', ['scopeId'], {
    //   name: 'work_unit_details_scope_id_idx',
    // });
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints first
    await queryInterface.removeConstraint(
      'work_unit_details',
      'work_unit_details_workunit_fk'
    );
    await queryInterface.removeConstraint(
      'work_unit_details',
      'work_unit_details_cluster_fk'
    );

    // Remove indexes
    // await queryInterface.removeIndex(
    //   'work_unit_details',
    //   'work_unit_details_scope_id_idx'
    // );
    // await queryInterface.removeIndex(
    //   'work_unit_details',
    //   'work_unit_details_scope_name_idx'
    // );
    // await queryInterface.removeIndex(
    //   'work_unit_details',
    //   'work_unit_details_scope_type_idx'
    // );
    await queryInterface.removeIndex(
      'work_unit_details',
      'work_unit_details_cluster_wu_idx'
    );

    // Drop table
    await queryInterface.dropTable('work_unit_details');
  },
};
