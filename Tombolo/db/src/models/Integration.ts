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
  HasMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Application } from './Application.js';
// import { IntegrationMapping } from './IntegrationMapping.js';

@Table({
  tableName: 'integrations',
  freezeTableName: true,
  timestamps: false,
})
export class Integration extends Model {
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
  declare description: string;

  @Column(DataType.JSON)
  declare metaData?: any;

  // Associations
  // @HasMany(() => IntegrationMapping)
  // declare integrationMappings?: IntegrationMapping[];
}
