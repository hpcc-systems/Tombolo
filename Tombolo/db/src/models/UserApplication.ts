import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { User } from './User.js';
import { Application } from './Application.js';

@Table({
  tableName: 'user_applications',
  timestamps: true,
  paranoid: true,
})
export class UserApplication extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @AllowNull(false)
  @ForeignKey(() => Application)
  @Column(DataType.UUID)
  declare application_id: string;

  @AllowNull(false)
  @Column(DataType.ENUM('created', 'shared', 'assigned'))
  declare user_app_relation: 'created' | 'shared' | 'assigned';

  @AllowNull(false)
  @Column(DataType.UUID)
  declare createdBy: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt?: Date;

  // Associations
  @BelongsTo(() => User, 'user_id')
  declare user?: User;

  @BelongsTo(() => Application, 'application_id')
  declare application?: Application;
}
