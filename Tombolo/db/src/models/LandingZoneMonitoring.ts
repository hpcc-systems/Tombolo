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
import { Cluster } from './Cluster.js';
import { User } from './User.js';

@Table({
  tableName: 'landing_zone_monitorings',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['monitoringName', 'deletedAt'],
    },
  ],
})
export class LandingZoneMonitoring extends Model<
  InferAttributes<LandingZoneMonitoring>,
  InferCreationAttributes<LandingZoneMonitoring>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column({ type: DataType.UUID, field: 'applicationId' })
  declare applicationId: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING, field: 'monitoringName' })
  declare monitoringName: string;

  @AllowNull(false)
  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'isActive' })
  declare isActive: boolean;

  @AllowNull(false)
  @Column({ type: DataType.ENUM('fileCount', 'spaceUsage', 'fileMovement'), field: 'lzMonitoringType' })
  declare lzMonitoringType: 'fileCount' | 'spaceUsage' | 'fileMovement';

  @AllowNull(false)
  @Default('pending')
  @Column({ type: DataType.ENUM('approved', 'rejected', 'pending'), field: 'approvalStatus' })
  declare approvalStatus: 'approved' | 'rejected' | 'pending';

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'approvedBy' })
  declare approvedBy?: string | null;

  @Column({ type: DataType.DATE, field: 'approvedAt' })
  declare approvedAt?: Date | null;

  @Column({ type: DataType.STRING, field: 'approverComment' })
  declare approverComment?: string | null;

  @AllowNull(false)
  @Column({ type: DataType.TEXT, field: 'description' })
  declare description: string;

  @AllowNull(false)
  @ForeignKey(() => Cluster)
  @Column({ type: DataType.UUID, field: 'clusterId' })
  declare clusterId: string;

  @Column({ type: DataType.JSON, field: 'lastRunDetails' })
  declare lastRunDetails?: any | null;

  @AllowNull(false)
  @Column({ type: DataType.JSON, field: 'metaData' })
  declare metaData: any;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'createdBy' })
  declare createdBy: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'lastUpdatedBy' })
  declare lastUpdatedBy: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'deletedBy' })
  declare deletedBy?: string | null;

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @AllowNull(false)
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Application, 'applicationId')
  declare application?: Application;

  @BelongsTo(() => Cluster, 'clusterId')
  declare cluster?: Cluster;

  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsTo(() => User, 'lastUpdatedBy')
  declare updater?: User;

  @BelongsTo(() => User, 'approvedBy')
  declare approver?: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter?: User;
}
