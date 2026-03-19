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
  Length,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { User } from './User.js';
import { DeleteMixin } from '../mixins/DeleteMixin.js';

@Table({
  tableName: 'analytics_filters',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'createdBy', 'deletedAt'],
    },
    {
      fields: ['createdBy'],
    },
  ],
})
export class AnalyticsFilter extends DeleteMixin(Model)<
  InferAttributes<AnalyticsFilter>,
  InferCreationAttributes<AnalyticsFilter>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Length({ max: 30 })
  @Column(DataType.STRING(30))
  declare name: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare conditions: string;

  @Length({ max: 255 })
  @Column(DataType.STRING(255))
  declare description?: string | null;

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

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @AllowNull(false)
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date | null;

  // Relationships
  @BelongsTo(() => User, {
    foreignKey: 'createdBy',
    as: 'analyticsFilterCreatedBy',
  })
  declare analyticsFilterCreatedBy?: User;

  @BelongsTo(() => User, {
    foreignKey: 'updatedBy',
    as: 'analyticsFilterUpdatedBy',
  })
  declare analyticsFilterUpdatedBy?: User;

  @BelongsTo(() => User, {
    foreignKey: 'deletedBy',
    as: 'analyticsFilterDeletedBy',
  })
  declare analyticsFilterDeletedBy?: User;
}

export type AnalyticsFilterCreationAttributes =
  InferCreationAttributes<AnalyticsFilter>;
export type AnalyticsFilterAttributes = InferAttributes<AnalyticsFilter>;
