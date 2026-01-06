import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  HasMany,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { UserRole } from './UserRole.js';
import { UserApplication } from './UserApplication.js';
import { RefreshToken } from './RefreshToken.js';
import { Application } from './Application.js';
import { Cluster } from './Cluster.js';

@Table({
  tableName: 'users',
  paranoid: true,
  timestamps: true,
})
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare firstName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare lastName: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare username: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare hash: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare organization?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare phone?: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare emailVerified: CreationOptional<boolean>;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLoginAt?: Date | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare metaData?: Record<string, any> | null;

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
  @HasMany(() => UserRole)
  declare roles?: UserRole[];

  @HasMany(() => UserApplication)
  declare applications?: UserApplication[];

  @HasMany(() => RefreshToken)
  declare refreshTokens?: RefreshToken[];

  @HasMany(() => Application, 'creator')
  declare createdApplications?: Application[];

  @HasMany(() => Cluster, 'createdBy')
  declare createdClusters?: Cluster[];
}
