import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
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
import { AsrMonitoringTypeToDomainsRelation } from './AsrMonitoringTypeToDomainsRelation.js';
import { AsrProduct } from './AsrProduct.js';
import { AsrDomainToProductsRelation } from './AsrDomainToProductsRelation.js';

@Table({
  tableName: 'asr_domains',
  paranoid: true,
  timestamps: true,
})
export class AsrDomain extends Model<
  InferAttributes<AsrDomain>,
  InferCreationAttributes<AsrDomain>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare region: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare severityThreshold: number;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare severityAlertRecipients: any;

  @Column(DataType.JSON)
  declare metaData?: any | null;

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

  @BelongsToMany(() => MonitoringType, {
    through: () => AsrMonitoringTypeToDomainsRelation,
    foreignKey: 'domain_id',
    otherKey: 'monitoring_type_id',
    as: 'monitoringTypes',
  })
  declare monitoringTypes?: MonitoringType[];

  @BelongsToMany(() => AsrProduct, {
    through: () => AsrDomainToProductsRelation,
    foreignKey: 'domain_id',
    otherKey: 'product_id',
    as: 'associatedProducts',
  })
  declare associatedProducts?: AsrProduct[];
}
