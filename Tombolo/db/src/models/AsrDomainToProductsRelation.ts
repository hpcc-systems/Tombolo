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
// import { AsrDomain } from './AsrDomain.js';
// import { AsrProduct } from './AsrProduct.js';

@Table({
  tableName: 'asr_domain_to_products_relations',
  paranoid: true,
  timestamps: true,
})
export class AsrDomainToProductsRelation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.UUID)
  declare domain_id?: string;

  @Column(DataType.UUID)
  declare product_id?: string;

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

  // @BelongsTo(() => AsrDomain, 'domain_id')
  // declare domain?: AsrDomain;

  // @BelongsTo(() => AsrProduct, 'product_id')
  // declare product?: AsrProduct;
}
