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
import { Application } from './Application.js';
// import { JobMonitoring } from './JobMonitoring.js';

@Table({
  tableName: 'job_monitoring_data_archives',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['monitoringId', 'wuId'],
      name: 'jm_data_archive_unique_monitoringId_wuId',
    },
  ],
})
export class JobMonitoringDataArchive extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

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
  declare analyzed: boolean;

  @Column(DataType.JSONB)
  declare metaData?: any;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations
  @BelongsTo(() => Application)
  declare application?: Application;

  // @BelongsTo(() => JobMonitoring, 'monitoringId')
  // declare jobMonitoring?: JobMonitoring;
}
