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
  declare localDay?: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare usersCostInfo: any;

  @Column(DataType.JSON)
  declare metaData?: any;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt?: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date>;

  // Associations
  @BelongsTo(() => Cluster)
  declare cluster?: Cluster;

  // Static methods would need to be added separately if needed
}
