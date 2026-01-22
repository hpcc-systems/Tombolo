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
import { DeleteMixin } from '../mixins/DeleteMixin.js';

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
export class CostMonitoring extends DeleteMixin(Model)<
  InferAttributes<CostMonitoring>,
  InferCreationAttributes<CostMonitoring>
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
  @Default('clusters')
  @Column(DataType.STRING)
  declare monitoringScope: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare monitoringName: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isSummed: CreationOptional<boolean>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isActive: CreationOptional<boolean>;

  @AllowNull(false)
  @Column(DataType.ENUM('approved', 'rejected', 'pending'))
  declare approvalStatus: 'approved' | 'rejected' | 'pending';

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare approvedBy?: string | null;

  @Column(DataType.DATE)
  declare approvedAt?: Date | null;

  @Column(DataType.STRING)
  declare approverComment?: string | null;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.JSON)
  declare clusterIds?: string[] | null;

  @Column(DataType.JSON)
  declare lastJobRunDetails?: any | null;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare metaData: any;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'lastUpdatedBy' })
  declare lastUpdatedBy?: string | null;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string | null;

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

  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsTo(() => User, 'lastUpdatedBy')
  declare updater?: User;

  @BelongsTo(() => User, 'approvedBy')
  declare approver?: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter?: User;
}
