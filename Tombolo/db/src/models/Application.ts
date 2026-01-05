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
  BelongsTo,
  ForeignKey,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'applications',
  paranoid: true,
  timestamps: true,
})
export class Application extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare creator: string;

  @AllowNull(false)
  @Default('Private')
  @Column(DataType.ENUM('Public', 'Private'))
  declare visibility: 'Public' | 'Private';

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations will be added here as we convert more models
  // @HasMany(() => UserApplication)
  // userApplications?: UserApplication[];

  // @HasMany(() => FileMonitoring)
  // fileMonitorings?: FileMonitoring[];

  // @BelongsTo(() => User, 'creator')
  // application_creator?: User;
}
