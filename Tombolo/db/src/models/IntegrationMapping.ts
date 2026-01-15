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
import { Integration } from './Integration.js';

@Table({
  tableName: 'integration_mappings',
  paranoid: true,
  timestamps: true,
})
export class IntegrationMapping extends Model<
  InferAttributes<IntegrationMapping>,
  InferCreationAttributes<IntegrationMapping>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @ForeignKey(() => Integration)
  @Column(DataType.UUID)
  declare integration_id?: string | null;

  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare application_id?: string | null;

  @Column(DataType.JSON)
  declare metaData?: any | null;

  @CreatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Integration, 'integration_id')
  declare integration?: Integration;

  @BelongsTo(() => Application, 'application_id')
  declare application?: Application;
}
