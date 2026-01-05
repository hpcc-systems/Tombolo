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
// import { MonitoringNotification } from './MonitoringNotification.js';

@Table({
  tableName: 'orbit_builds',
  paranoid: true,
  timestamps: true,
})
export class OrbitBuilds extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare application_id: string;

  @Column(DataType.UUID)
  declare monitoring_id?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare wuid: string;

  @Column(DataType.JSON)
  declare metaData?: any;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare build_id: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations
  @BelongsTo(() => Application, 'application_id')
  declare application?: Application;

  // @HasMany(() => MonitoringNotification, 'application_id')
  // declare monitoringNotifications?: MonitoringNotification[];
}
