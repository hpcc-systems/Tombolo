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
  DeletedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'orbit_build_data',
  paranoid: true,
  timestamps: true,
})
export class OrbitBuildData extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare BuildInstanceIdKey: number;

  @Column(DataType.BIGINT)
  declare BuildTemplateIdKey?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare Name: string;

  @Column(DataType.STRING)
  declare HpccWorkUnit?: string;

  @Column(DataType.DATE)
  declare DateUpdated?: Date;

  @Column(DataType.STRING)
  declare Status_Code?: string;

  @Column(DataType.STRING)
  declare Version?: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare observed_at: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare stable: boolean;

  @Column(DataType.DATE)
  declare stable_at?: Date;

  @Column(DataType.DATE)
  declare last_analyzed_at?: Date;

  @Column(DataType.UUID)
  declare monitoring_id?: string;

  @Column(DataType.JSON)
  declare notification_state?: any;

  @Column(DataType.JSON)
  declare status_history?: any;

  @Column(DataType.JSON)
  declare metaData?: any;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare processed: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;
}
