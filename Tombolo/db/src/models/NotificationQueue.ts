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
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'notification_queue',
  freezeTableName: true,
  timestamps: true,
})
export class NotificationQueue extends Model<
  InferAttributes<NotificationQueue>,
  InferCreationAttributes<NotificationQueue>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.ENUM('msTeams', 'email'))
  declare type: 'msTeams' | 'email';

  @AllowNull(false)
  @Column(DataType.STRING)
  declare notificationOrigin: string;

  @Column(DataType.UUID)
  declare originationId?: string | null;

  @AllowNull(false)
  @Column(DataType.ENUM('immediate', 'scheduled'))
  declare deliveryType: 'immediate' | 'scheduled';

  @Column(DataType.DATE)
  declare deliveryTime?: Date | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare templateName: string;

  @Column(DataType.DATE)
  declare lastScanned?: Date | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare attemptCount: CreationOptional<number>;

  @Column(DataType.DATE)
  declare reTryAfter?: Date | null;

  @Column(DataType.JSON)
  declare failureMessage?: any | null;

  @AllowNull(false)
  @Default('System')
  @Column(DataType.STRING)
  declare createdBy: CreationOptional<string>;

  @AllowNull(false)
  @Default('System')
  @Column(DataType.STRING)
  declare updatedBy: CreationOptional<string>;

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
}
