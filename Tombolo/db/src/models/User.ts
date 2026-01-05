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
  HasOne,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
  paranoid: true,
  timestamps: true,
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

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
  declare organization?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare phone?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare emailVerified: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLoginAt?: Date;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare metaData?: Record<string, any>;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations will be added as we convert more models
  // @HasMany(() => UserRole)
  // roles?: UserRole[];

  // @HasMany(() => UserApplication)
  // applications?: UserApplication[];

  // @HasMany(() => RefreshToken)
  // refreshTokens?: RefreshToken[];

  // @HasMany(() => Application)
  // apps?: Application[];

  // @HasMany(() => Cluster)
  // createdClusters?: Cluster[];
}
