import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Cluster } from './Cluster.js';
import { WorkUnit } from './WorkUnit.js';

@Table({
  tableName: 'work_unit_details',
  timestamps: false,
  paranoid: false,
  indexes: [
    {
      name: 'work_unit_details_cluster_wu_idx',
      fields: ['clusterId', 'wuId'],
    },
  ],
})
export class WorkUnitDetails extends Model<
  InferAttributes<WorkUnitDetails>,
  InferCreationAttributes<WorkUnitDetails>
> {
  @PrimaryKey
  @Column({ type: DataType.BIGINT.UNSIGNED, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => Cluster)
  @ForeignKey(() => WorkUnit)
  @Column(DataType.UUID)
  declare clusterId?: string | null;

  @ForeignKey(() => WorkUnit)
  @Column(DataType.STRING(30))
  declare wuId?: string | null;

  @Column(DataType.STRING(15))
  declare scopeId?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(130))
  declare scopeName: string;

  @AllowNull(false)
  @Column(DataType.ENUM('activity', 'subgraph', 'graph', 'operation'))
  declare scopeType: 'activity' | 'subgraph' | 'graph' | 'operation' | string;

  @Column(DataType.STRING(255))
  declare label?: string | null;

  @Column(DataType.SMALLINT.UNSIGNED)
  declare kind?: number | null;

  @Column(DataType.STRING(130))
  declare fileName?: string | null;

  // Time metrics (DECIMAL(13,6) for microsecond precision)
  @Column(DataType.DECIMAL(13, 6))
  declare TimeElapsed?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgElapsed?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinElapsed?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxElapsed?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevElapsed?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeLocalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgLocalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinLocalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxLocalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevLocalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeTotalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgTotalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinTotalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxTotalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevTotalExecute?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeDiskWriteIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgDiskWriteIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinDiskWriteIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxDiskWriteIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevDiskWriteIO?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeBlocked?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgBlocked?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinBlocked?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxBlocked?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevBlocked?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeLookAhead?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgLookAhead?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinLookAhead?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxLookAhead?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevLookAhead?: number | null;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeFirstRow?: number | null;

  // Numeric metrics
  @Column(DataType.BIGINT.UNSIGNED)
  declare NumDiskRowsRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumAvgDiskRowsRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMinDiskRowsRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMaxDiskRowsRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumStdDevDiskRowsRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeDiskRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgDiskRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinDiskRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxDiskRead?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeStdDevDiskRead?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumDiskReads?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumAvgDiskReads?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMinDiskReads?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMaxDiskReads?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeDiskWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgDiskWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinDiskWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxDiskWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeStdDevDiskWrite?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumDiskWrites?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumAvgDiskWrites?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMinDiskWrites?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMaxDiskWrites?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryAvgUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryMinUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryMaxUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakMemoryUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakAvgMemoryUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakMinMemoryUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakMaxMemoryUsage?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillRowsWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillAvgRowsWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMinRowsWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMaxRowsWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillSizeWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillAvgSizeWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMinSizeWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMaxSizeWritten?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeGraphSpill?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgGraphSpill?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinGraphSpill?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxGraphSpill?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumRowsProcessed?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumAvgRowsProcessed?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMinRowsProcessed?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMaxRowsProcessed?: number | null;

  // Skew metrics
  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinElapsed?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxElapsed?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinLocalExecute?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxLocalExecute?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinTotalExecute?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxTotalExecute?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskRowsRead?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskRowsRead?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskRead?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskRead?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskWrite?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskWrite?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskReadIO?: number | null;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskWriteIO?: number | null;

  // Network metrics
  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeNetworkWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgNetworkWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinNetworkWrite?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxNetworkWrite?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumNetworkWrites?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumAvgNetworkWrites?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMinNetworkWrites?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMaxNetworkWrites?: number | null;

  // Other metrics
  @Column(DataType.BIGINT.UNSIGNED)
  declare MaxRowSize?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumIndexRecords?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumStarts?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumStops?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare OriginalSize?: number | null;

  @Column(DataType.BIGINT.UNSIGNED)
  declare CompressedSize?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare ScansBlob?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare ScansIndex?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare WildSeeks?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare SeeksBlob?: number | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare SeeksIndex?: number | null;

  // Node metrics
  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinElapsed?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxElapsed?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinLocalExecute?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxLocalExecute?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinTotalExecute?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxTotalExecute?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskRowsRead?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskRowsRead?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskRead?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskRead?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskWrite?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskWrite?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskReadIO?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskReadIO?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskWriteIO?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskWriteIO?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinBlocked?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxBlocked?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinLookAhead?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxLookAhead?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinFirstRow?: number | null;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxFirstRow?: number | null;

  // Associations
  @BelongsTo(() => Cluster, 'clusterId')
  declare cluster?: Cluster;

  // Constraints must be false to tell sequelize to rely on the database level composite key
  // Sequelize doesn't support composite foreign keys on the model level
  @BelongsTo(() => WorkUnit, {
    foreignKey: 'clusterId',
    targetKey: 'clusterId',
    constraints: false,
  })
  @BelongsTo(() => WorkUnit, {
    foreignKey: 'wuId',
    targetKey: 'wuId',
    constraints: false,
  })
  declare workUnit?: WorkUnit;
}
