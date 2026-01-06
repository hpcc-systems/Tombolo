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
import { User } from './User.js';
import { Application } from './Application.js';
import { Cluster } from './Cluster.js';

@Table({
  tableName: 'file_monitoring',
  paranoid: true,
  timestamps: true,
})
export class FileMonitoring extends Model<
  InferAttributes<FileMonitoring>,
  InferCreationAttributes<FileMonitoring>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare monitoringName: string;

  @Column(DataType.STRING)
  declare description?: string;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare applicationId: string;

  @AllowNull(false)
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare clusterId: string;

  @AllowNull(false)
  @Column(DataType.ENUM('stdLogicalFile', 'superFile'))
  declare fileMonitoringType: 'stdLogicalFile' | 'superFile';

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isActive?: boolean;

  @AllowNull(false)
  @Column(DataType.ENUM('approved', 'rejected', 'pending'))
  declare approvalStatus: 'approved' | 'rejected' | 'pending';

  @Column(DataType.JSON)
  declare metaData?: any;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare approvedBy?: string;

  @Column(DataType.DATE)
  declare approvedAt?: Date;

  @Column(DataType.STRING)
  declare approverComment?: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare lastUpdatedBy?: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string;

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
  @BelongsTo(() => Application)
  declare application?: Application;

  @BelongsTo(() => Cluster)
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
