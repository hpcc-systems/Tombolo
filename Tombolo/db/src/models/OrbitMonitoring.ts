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
  HasMany,
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
import { MonitoringNotification } from './MonitoringNotification.js';

@Table({
  tableName: 'orbit_monitorings',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'deletedAt'],
    },
  ],
})
export class OrbitMonitoring extends Model<
  InferAttributes<OrbitMonitoring>,
  InferCreationAttributes<OrbitMonitoring>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare application_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare cron?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare build: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare businessUnit: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare product: string;

  @AllowNull(false)
  @Column(DataType.TINYINT)
  declare severityCode: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare host: string;

  @Column(DataType.STRING)
  declare primaryContact?: string | null;

  @Column(DataType.STRING)
  declare secondaryContact?: string | null;

  @Column(DataType.JSON)
  declare metaData?: any | null;

  @Column(DataType.BOOLEAN)
  declare isActive?: boolean | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Application, 'application_id')
  declare application?: Application;

  @HasMany(() => MonitoringNotification, 'application_id')
  declare monitoringNotifications?: MonitoringNotification[];
}
