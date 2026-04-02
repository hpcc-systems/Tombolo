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
  tableName: 'work_unit_files',
  updatedAt: false,
  paranoid: true,
  timestamps: true,
})
export class WorkUnitFiles extends Model<
  InferAttributes<WorkUnitFiles>,
  InferCreationAttributes<WorkUnitFiles>
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

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare fileName: string;

  @AllowNull(false)
  @Column(DataType.ENUM('input', 'output'))
  declare fileType: 'input' | 'output';

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  @BelongsTo(() => Cluster, {
    foreignKey: 'clusterId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare cluster?: Cluster;

  @BelongsTo(() => WorkUnit, {
    foreignKey: 'wuId',
    targetKey: 'wuId',
    constraints: false,
  })
  declare workUnit?: WorkUnit;
}
