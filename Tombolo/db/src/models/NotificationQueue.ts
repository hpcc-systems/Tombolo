import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'notification_queue',
  freezeTableName: true,
  timestamps: true,
})
export class NotificationQueue extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.ENUM('msTeams', 'email'))
  declare type: 'msTeams' | 'email';

  @AllowNull(false)
  @Column(DataType.STRING)
  declare notificationOrigin: string;

  @Column(DataType.UUID)
  declare originationId?: string;

  @AllowNull(false)
  @Column(DataType.ENUM('immediate', 'scheduled'))
  declare deliveryType: 'immediate' | 'scheduled';

  @Column(DataType.DATE)
  declare deliveryTime?: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare templateName: string;

  @Column(DataType.DATE)
  declare lastScanned?: Date;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare attemptCount: number;

  @Column(DataType.DATE)
  declare reTryAfter?: Date;

  @Column(DataType.JSON)
  declare failureMessage?: any;

  @AllowNull(false)
  @Default('System')
  @Column(DataType.STRING)
  declare createdBy: string;

  @AllowNull(false)
  @Default('System')
  @Column(DataType.STRING)
  declare updatedBy: string;

  @Column(DataType.JSON)
  declare metaData?: any;

  @CreatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
