import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Cluster } from './Cluster.js';
import { WorkUnit } from './WorkUnit.js';

@Table({
  tableName: 'work_unit_exceptions',
  updatedAt: false,
  paranoid: true,
  timestamps: true,
})
export class WorkUnitException extends Model<
  InferAttributes<WorkUnitException>,
  InferCreationAttributes<WorkUnitException>
> {
  @PrimaryKey
  @ForeignKey(() => WorkUnit)
  @Column(DataType.STRING(30))
  declare wuId: string;

  @PrimaryKey
  @ForeignKey(() => Cluster)
  @ForeignKey(() => WorkUnit)
  @Column(DataType.UUID)
  declare clusterId: string;

  @PrimaryKey
  @Column(DataType.INTEGER)
  declare sequenceNo: CreationOptional<number>;

  @Column(DataType.STRING(20))
  declare severity?: string | null;

  @Column(DataType.STRING(40))
  declare source?: string | null;

  @Column(DataType.INTEGER)
  declare code?: number | null;

  @Column(DataType.STRING(200))
  declare message?: string | null;

  @Column(DataType.INTEGER)
  declare column?: number | null;

  @Column(DataType.INTEGER)
  declare lineNo?: number | null;

  @Column(DataType.STRING(210))
  declare fileName?: string | null;

  @Column(DataType.INTEGER)
  declare activity?: number | null;

  @Column(DataType.STRING(210))
  declare scope?: string | null;

  @Column(DataType.INTEGER)
  declare priority?: number | null;

  @Column(DataType.FLOAT)
  declare cost?: number | null;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Cluster)
  declare cluster?: Cluster;

  // Constraints must be false to tell sequelize to rely on the database level composite key
  // Sequelize doesn't support composite foreign keys on the model level
  @BelongsTo(() => WorkUnit, {
    foreignKey: 'clusterId',
    targetKey: 'clusterId',
    constraints: false,
  })
  @BelongsTo(() => WorkUnit, {
    foreignKey: 'wuId',
    targetKey: 'wuId',
    constraints: false,
  })
  declare workUnit?: WorkUnit;
}

// Export creation attributes type for use in other files
export type WorkUnitExceptionCreationAttributes =
  InferCreationAttributes<WorkUnitException>;
