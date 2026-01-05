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
import { User } from './User.js';
// import { MonitoringType } from './MonitoringType.js';
// import { AsrProduct } from './AsrProduct.js';
// import { AsrMonitoringTypeToDomainsRelation } from './AsrMonitoringTypeToDomainsRelation.js';
// import { AsrDomainToProductsRelation } from './AsrDomainToProductsRelation.js';

@Table({
  tableName: 'asr_domains',
  paranoid: true,
  timestamps: true,
})
export class AsrDomain extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

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
  declare metaData?: any;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare updatedBy?: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string;

  @CreatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt?: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations
  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsTo(() => User, 'updatedBy')
  declare updater?: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter?: User;

  // @BelongsToMany(() => MonitoringType, () => AsrMonitoringTypeToDomainsRelation)
  // declare monitoringTypes?: MonitoringType[];

  // @BelongsToMany(() => AsrProduct, () => AsrDomainToProductsRelation)
  // declare associatedProducts?: AsrProduct[];
}
