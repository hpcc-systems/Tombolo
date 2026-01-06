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
  declare id: number;

  @ForeignKey(() => Cluster)
  @ForeignKey(() => WorkUnit)
  @Column(DataType.UUID)
  declare clusterId?: string;

  @ForeignKey(() => WorkUnit)
  @Column(DataType.STRING(30))
  declare wuId?: string;

  @Column(DataType.STRING(15))
  declare scopeId?: string;

  @AllowNull(false)
  @Column(DataType.STRING(130))
  declare scopeName: string;

  @AllowNull(false)
  @Column(DataType.ENUM('activity', 'subgraph', 'graph', 'operation'))
  declare scopeType: 'activity' | 'subgraph' | 'graph' | 'operation';

  @Column(DataType.STRING(255))
  declare label?: string;

  @Column(DataType.SMALLINT.UNSIGNED)
  declare kind?: number;

  @Column(DataType.STRING(130))
  declare fileName?: string;

  // Time metrics (DECIMAL(13,6) for microsecond precision)
  @Column(DataType.DECIMAL(13, 6))
  declare TimeElapsed?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgElapsed?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinElapsed?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxElapsed?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevElapsed?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeLocalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgLocalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinLocalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxLocalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevLocalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeTotalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgTotalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinTotalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxTotalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevTotalExecute?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeDiskReadIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgDiskReadIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinDiskReadIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxDiskReadIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevDiskReadIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeDiskWriteIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgDiskWriteIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinDiskWriteIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxDiskWriteIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevDiskWriteIO?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeBlocked?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgBlocked?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinBlocked?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxBlocked?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevBlocked?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeLookAhead?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeAvgLookAhead?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMinLookAhead?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeMaxLookAhead?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeStdDevLookAhead?: number;

  @Column(DataType.DECIMAL(13, 6))
  declare TimeFirstRow?: number;

  // Numeric metrics
  @Column(DataType.BIGINT.UNSIGNED)
  declare NumDiskRowsRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumAvgDiskRowsRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMinDiskRowsRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMaxDiskRowsRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumStdDevDiskRowsRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeDiskRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgDiskRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinDiskRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxDiskRead?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeStdDevDiskRead?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumDiskReads?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumAvgDiskReads?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMinDiskReads?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMaxDiskReads?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeDiskWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgDiskWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinDiskWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxDiskWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeStdDevDiskWrite?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumDiskWrites?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumAvgDiskWrites?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMinDiskWrites?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMaxDiskWrites?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryAvgUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryMinUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare MemoryMaxUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakMemoryUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakAvgMemoryUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakMinMemoryUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare PeakMaxMemoryUsage?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillRowsWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillAvgRowsWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMinRowsWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMaxRowsWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillSizeWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillAvgSizeWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMinSizeWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SpillMaxSizeWritten?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeGraphSpill?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgGraphSpill?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinGraphSpill?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxGraphSpill?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumRowsProcessed?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumAvgRowsProcessed?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMinRowsProcessed?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare NumMaxRowsProcessed?: number;

  // Skew metrics
  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinElapsed?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxElapsed?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinLocalExecute?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxLocalExecute?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinTotalExecute?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxTotalExecute?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskRowsRead?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskRowsRead?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskRead?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskRead?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskWrite?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskWrite?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMinDiskReadIO?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskReadIO?: number;

  @Column(DataType.DECIMAL(8, 2))
  declare SkewMaxDiskWriteIO?: number;

  // Network metrics
  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeNetworkWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeAvgNetworkWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMinNetworkWrite?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare SizeMaxNetworkWrite?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumNetworkWrites?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumAvgNetworkWrites?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMinNetworkWrites?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumMaxNetworkWrites?: number;

  // Other metrics
  @Column(DataType.BIGINT.UNSIGNED)
  declare MaxRowSize?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumIndexRecords?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumStarts?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare NumStops?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare OriginalSize?: number;

  @Column(DataType.BIGINT.UNSIGNED)
  declare CompressedSize?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare ScansBlob?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare ScansIndex?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare WildSeeks?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare SeeksBlob?: number;

  @Column(DataType.INTEGER.UNSIGNED)
  declare SeeksIndex?: number;

  // Node metrics
  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinElapsed?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxElapsed?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinLocalExecute?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxLocalExecute?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinTotalExecute?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxTotalExecute?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskRowsRead?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskRowsRead?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskRead?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskRead?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskWrite?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskWrite?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskReadIO?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskReadIO?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinDiskWriteIO?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxDiskWriteIO?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinBlocked?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxBlocked?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinLookAhead?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxLookAhead?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMinFirstRow?: number;

  @Column(DataType.TINYINT.UNSIGNED)
  declare NodeMaxFirstRow?: number;

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
