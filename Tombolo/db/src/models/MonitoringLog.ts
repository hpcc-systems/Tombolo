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
import { Cluster } from './Cluster.js';
// import { MonitoringType } from './MonitoringType.js';

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
export class MonitoringLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

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
  declare metaData?: any;

  @CreatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt?: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations
  @BelongsTo(() => Cluster, 'cluster_id')
  declare cluster?: Cluster;

  // @BelongsTo(() => MonitoringType, 'monitoring_type_id')
  // declare monitoring_types?: MonitoringType;
}
