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
import { Cluster } from './Cluster.js';

@Table({
  tableName: 'cluster_monitorings',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['monitoringName', 'deletedAt'],
    },
  ],
})
export class ClusterMonitoring extends Model<
  InferAttributes<ClusterMonitoring>,
  InferCreationAttributes<ClusterMonitoring>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare monitoringName: string;

  @AllowNull(false)
  @Default(['status', 'usage'])
  @Column(DataType.ARRAY(DataType.STRING))
  declare clusterMonitoringType: string[];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isActive: CreationOptional<boolean>;

  @AllowNull(false)
  @Default('pending')
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

  @AllowNull(false)
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare clusterId: string;

  @Column(DataType.JSON)
  declare lastRunDetails?: any;

  @AllowNull(false)
  @Default({
    contacts: {
      primaryContacts: [],
      secondaryContacts: [],
      notifyContacts: [],
    },
    monitoringData: {},
    asrSpecificMetaData: {},
  })
  @Column(DataType.JSON)
  declare metaData: any;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare lastUpdatedBy: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string;

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
  declare deletedAt?: CreationOptional<Date>;

  // Associations
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
