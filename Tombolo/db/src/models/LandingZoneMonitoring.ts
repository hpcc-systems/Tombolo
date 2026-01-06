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

@Table({
  tableName: 'directory_monitorings',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'deletedAt'],
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
  @Column(DataType.UUID)
  declare application_id: string;

  @AllowNull(false)
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare cluster_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @Column(DataType.STRING)
  declare cron?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare active: boolean;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare machine: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare landingZone: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare directory: string;

  @Column(DataType.JSON)
  declare metaData?: any;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare approved: boolean;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare approvalStatus: string;

  @Column(DataType.STRING)
  declare approvalNote?: string;

  @Column(DataType.STRING)
  declare approvedBy?: string;

  @Column(DataType.DATE)
  declare approvedAt?: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare createdBy: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare updatedBy: string;

  @CreatedAt
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
  @BelongsTo(() => Application, 'application_id')
  declare application?: Application;

  @BelongsTo(() => Cluster, 'cluster_id')
  declare cluster?: Cluster;
}
