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

@Table({
  tableName: 'failed_notifications',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['idempotencyKey', 'deletedAt'],
    },
  ],
})
export class FailedNotification extends Model<
  InferAttributes<FailedNotification>,
  InferCreationAttributes<FailedNotification>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare searchableNotificationId: string;

  @Column(DataType.STRING)
  declare idempotencyKey?: string | null;

  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare applicationId?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare notificationOrigin: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare notificationChannel: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare notificationTitle: string;

  @Column(DataType.TEXT)
  declare notificationDescription?: string | null;

  @Column(DataType.JSON)
  declare recipients?: any | null;

  @Column(DataType.INTEGER)
  declare attemptCount?: number | null;

  @Column(DataType.STRING)
  declare lastErrorCode?: string | null;

  @Column(DataType.TEXT)
  declare lastErrorMessage?: string | null;

  @Column(DataType.JSON)
  declare failureReason?: any | null;

  @Column(DataType.DATE)
  declare failedAt?: Date | null;

  @AllowNull(false)
  @Default({ name: 'System', email: 'N/A' })
  @Column(DataType.JSON)
  declare createdBy: any;

  @Column(DataType.JSON)
  declare updatedBy?: any | null;

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

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt: CreationOptional<Date | null>;

  @BelongsTo(() => Application)
  declare application?: Application;
}
