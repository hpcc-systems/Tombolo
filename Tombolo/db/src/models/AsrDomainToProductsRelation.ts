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
import { AsrDomain } from './AsrDomain.js';
import { AsrProduct } from './AsrProduct.js';

@Table({
  tableName: 'asr_domain_to_products_relations',
  paranoid: true,
  timestamps: true,
})
export class AsrDomainToProductsRelation extends Model<
  InferAttributes<AsrDomainToProductsRelation>,
  InferCreationAttributes<AsrDomainToProductsRelation>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @ForeignKey(() => AsrDomain)
  @Column(DataType.UUID)
  declare domain_id?: string | null;

  @ForeignKey(() => AsrProduct)
  @Column(DataType.UUID)
  declare product_id?: string | null;

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

  @BelongsTo(() => AsrDomain, 'domain_id')
  declare domain?: AsrDomain;

  @BelongsTo(() => AsrProduct, 'product_id')
  declare product?: AsrProduct;
}
