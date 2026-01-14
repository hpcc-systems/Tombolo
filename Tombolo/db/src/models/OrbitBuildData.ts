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
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'orbit_build_data',
  paranoid: true,
  timestamps: true,
})
export class OrbitBuildData extends Model<
  InferAttributes<OrbitBuildData>,
  InferCreationAttributes<OrbitBuildData>
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare BuildInstanceIdKey: number;

  @Column(DataType.BIGINT)
  declare BuildTemplateIdKey?: number | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare Name: string;

  @Column(DataType.STRING)
  declare HpccWorkUnit?: string | null;

  @Column(DataType.DATE)
  declare DateUpdated?: Date | null;

  @Column(DataType.STRING)
  declare Status_Code?: string | null;

  @Column(DataType.STRING)
  declare Version?: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare observed_at: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare stable: CreationOptional<boolean>;

  @Column(DataType.DATE)
  declare stable_at?: Date | null;

  @Column(DataType.DATE)
  declare last_analyzed_at?: Date | null;

  @Column(DataType.UUID)
  declare monitoring_id?: string | null;

  @Column(DataType.JSON)
  declare notification_state?: any | null;

  @Column(DataType.JSON)
  declare status_history?: any | null;

  @Column(DataType.JSON)
  declare metaData?: any | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare processed: CreationOptional<boolean>;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;
}
