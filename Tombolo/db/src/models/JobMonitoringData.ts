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
import { Application } from './Application.js';
import { JobMonitoring } from './JobMonitoring.js';

@Table({
  tableName: 'job_monitoring_data',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['monitoringId', 'wuId'],
      name: 'jmd_unique_monitoringId_wuId',
    },
  ],
})
export class JobMonitoringData extends Model<
  InferAttributes<JobMonitoringData>,
  InferCreationAttributes<JobMonitoringData>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare applicationId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare wuId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare wuState: string;

  @AllowNull(false)
  @ForeignKey(() => JobMonitoring)
  @Column(DataType.UUID)
  declare monitoringId: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare date: Date;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare wuTopLevelInfo: any;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare wuDetailInfo: any;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare analyzed: CreationOptional<boolean>;

  @Column(DataType.JSONB)
  declare metaData?: any | null;

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
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Application, 'applicationId')
  declare application?: Application;

  @BelongsTo(() => JobMonitoring, 'monitoringId')
  declare jobMonitoring?: JobMonitoring;
}
