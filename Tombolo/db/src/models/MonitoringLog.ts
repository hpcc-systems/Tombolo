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
import { MonitoringType } from './MonitoringType.js';

@Table({
  tableName: 'monitoring_logs',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['cluster_id', 'monitoring_type_id', 'deletedAt'],
    },
  ],
})
export class MonitoringLog extends Model<
  InferAttributes<MonitoringLog>,
  InferCreationAttributes<MonitoringLog>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare cluster_id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare monitoring_type_id: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare scan_time: Date;

  @Column(DataType.JSON)
  declare metaData?: any | null;

  @CreatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt?: Date | null;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Cluster, 'cluster_id')
  declare cluster?: Cluster;

  @BelongsTo(() => MonitoringType, 'monitoring_type_id')
  declare monitoring_types?: MonitoringType;
}
