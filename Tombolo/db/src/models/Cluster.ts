import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  HasMany,
  BelongsTo,
  ForeignKey,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'clusters',
  paranoid: true,
  timestamps: true,
})
export class Cluster extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare thor_host: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare thor_port: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare roxie_host: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare roxie_port: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare username?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare hash?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare defaultEngine: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare timezone_offset: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare allowSelfSigned: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare containerized: boolean;

  @AllowNull(false)
  @Default('USD')
  @Column(DataType.STRING(10))
  declare currencyCode: string;

  @Default({})
  @Column(DataType.JSON)
  declare accountMetaData?: Record<string, any>;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare adminEmails?: any[];

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare reachabilityInfo?: Record<string, any>;

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare storageUsageHistory?: Record<string, any>;

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare metaData?: Record<string, any>;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare createdBy: string;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare updatedBy?: string;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare deletedBy?: string;

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
  // @HasMany(() => FileMonitoring)
  // fileMonitorings?: FileMonitoring[];

  // @BelongsTo(() => User, 'createdBy')
  // creator?: User;

  // @BelongsTo(() => User, 'updatedBy')
  // updater?: User;

  // @BelongsTo(() => User, 'deletedBy')
  // deleter?: User;
}

// Need to import User - will be uncommented once User model is in place
import { User } from './User.js';
