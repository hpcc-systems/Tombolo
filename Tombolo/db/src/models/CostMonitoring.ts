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
import { User } from './User.js';
import { Application } from './Application.js';

@Table({
  tableName: 'cost_monitorings',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['monitoringName', 'deletedAt'],
    },
  ],
})
export class CostMonitoring extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare applicationId: string;

  @AllowNull(false)
  @Default('clusters')
  @Column(DataType.STRING)
  declare monitoringScope: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare monitoringName: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isSummed: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @AllowNull(false)
  @Column(DataType.ENUM('approved', 'rejected', 'pending'))
  declare approvalStatus: 'approved' | 'rejected' | 'pending';

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare approvedBy?: string;

  @Column(DataType.DATE)
  declare approvedAt?: Date;

  @Column(DataType.STRING)
  declare approverComment?: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.JSON)
  declare clusterIds?: string[];

  @Column(DataType.JSON)
  declare lastJobRunDetails?: any;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare metaData: any;

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

  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsTo(() => User, 'lastUpdatedBy')
  declare updater?: User;

  @BelongsTo(() => User, 'approvedBy')
  declare approver?: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter?: User;
}
