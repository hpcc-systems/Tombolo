import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
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
import { Application } from './Application.js';
import { FileMonitoring } from './FileMonitoring.js';
import { JobMonitoring } from './JobMonitoring.js';

@Table({
  tableName: 'monitoring_notifications',
  paranoid: true,
  timestamps: true,
})
export class MonitoringNotification extends Model<
  InferAttributes<MonitoringNotification>,
  InferCreationAttributes<MonitoringNotification>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @Column(DataType.STRING)
  declare monitoring_type?: string;

  @Column(DataType.UUID)
  declare monitoring_id?: string;

  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare application_id?: string;

  @Column(DataType.STRING)
  declare file_name?: string;

  @Column(DataType.STRING)
  declare notification_reason?: string;

  @Column(DataType.STRING)
  declare notification_channel?: string;

  @Column(DataType.STRING)
  declare status?: string;

  @Column(DataType.DATE)
  declare responded_on?: Date;

  @Column(DataType.JSON)
  declare metaData?: any;

  @Column(DataType.TEXT)
  declare comment?: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date>;

  // Associations
  @BelongsTo(() => Application, 'application_id')
  declare application?: Application;

  @BelongsTo(() => FileMonitoring, 'monitoring_id')
  declare fileMonitoring?: FileMonitoring;

  @BelongsTo(() => JobMonitoring, 'monitoring_id')
  declare jobMonitoring?: JobMonitoring;
}
