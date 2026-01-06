import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  BelongsToMany,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { AsrDomain } from './AsrDomain.js';
import { AsrMonitoringTypeToDomainsRelation } from './AsrMonitoringTypeToDomainsRelation.js';

@Table({
  tableName: 'monitoring_types',
  freezeTableName: true,
  timestamps: false,
})
export class MonitoringType extends Model<
  InferAttributes<MonitoringType>,
  InferCreationAttributes<MonitoringType>
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
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt?: Date;

  @Column(DataType.DATE)
  declare deletedAt?: Date;

  @AllowNull(false)
  @Default({ firstName: null, lastName: 'System', email: 'NA' })
  @Column(DataType.JSON)
  declare createdBy: any;

  @Column(DataType.JSON)
  declare updatedBy?: any;

  @Column(DataType.JSON)
  declare deletedBy?: any;

  // Associations
  @BelongsToMany(() => AsrDomain, () => AsrMonitoringTypeToDomainsRelation)
  declare asr_domains?: AsrDomain[];
}
