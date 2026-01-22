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
import { MonitoringType } from './MonitoringType.js';
import { AsrDomain } from './AsrDomain.js';

@Table({
  tableName: 'asr_monitoring_type_to_domains_relations',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['monitoring_type_id', 'domain_id', 'deletedAt'],
    },
  ],
})
export class AsrMonitoringTypeToDomainsRelation extends Model<
  InferAttributes<AsrMonitoringTypeToDomainsRelation>,
  InferCreationAttributes<AsrMonitoringTypeToDomainsRelation>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @ForeignKey(() => MonitoringType)
  @Column(DataType.UUID)
  declare monitoring_type_id?: string | null;

  @ForeignKey(() => AsrDomain)
  @Column(DataType.UUID)
  declare domain_id?: string | null;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare updatedBy?: string | null;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string | null;

  @CreatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt?: Date | null;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsTo(() => User, 'updatedBy')
  declare updater?: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter?: User;

  @BelongsTo(() => MonitoringType, 'monitoring_type_id')
  declare monitoringType?: MonitoringType;

  @BelongsTo(() => AsrDomain, { foreignKey: 'domain_id', as: 'AsrDomain' })
  declare AsrDomain?: AsrDomain;
}
