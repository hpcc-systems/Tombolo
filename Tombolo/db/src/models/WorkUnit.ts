import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
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
  tableName: 'work_units',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      name: 'work_units_timestamp_idx',
      fields: ['workUnitTimestamp'],
    },
    {
      name: 'work_units_cluster_timestamp_idx',
      fields: ['clusterId', 'workUnitTimestamp'],
    },
    {
      name: 'work_units_owner_idx',
      fields: ['owner'],
    },
    {
      name: 'work_units_state_idx',
      fields: ['state'],
    },
    {
      name: 'work_units_details_fetched_idx',
      fields: ['detailsFetchedAt'],
    },
    {
      name: 'work_units_exceptions_fetched_idx',
      fields: ['exceptionsFetchedAt'],
    },
  ],
})
export class WorkUnit extends Model<
  InferAttributes<WorkUnit>,
  InferCreationAttributes<WorkUnit>
> {
  @PrimaryKey
  @Column(DataType.STRING(30))
  declare wuId: string;

  @PrimaryKey
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare clusterId: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare workUnitTimestamp: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare owner: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare engine: string;

  @Column(DataType.STRING)
  declare jobName?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare stateId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare state: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare protected: boolean;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare action: number;

  @Column(DataType.STRING)
  declare actionEx?: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare isPausing: boolean;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare thorLcr: boolean;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare totalClusterTime: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare executeCost: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare fileAccessCost: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare compileCost: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare totalCost: number;

  @Column(DataType.DATE)
  declare detailsFetchedAt?: Date;

  @Column(DataType.DATE)
  declare exceptionsFetchedAt?: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare clusterDeleted: CreationOptional<boolean>;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date>;

  // Associations
  @BelongsTo(() => Cluster)
  declare cluster?: Cluster;
}
