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
// import { AsrDomain } from './AsrDomain.js';
// import { AsrDomainToProductsRelation } from './AsrDomainToProductsRelation.js';

@Table({
  tableName: 'asr_products',
  paranoid: true,
  timestamps: true,
})
export class AsrProduct extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare shortCode: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare tier: number;

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

  // @BelongsToMany(() => AsrDomain, () => AsrDomainToProductsRelation)
  // declare associatedDomains?: AsrDomain[];
}
