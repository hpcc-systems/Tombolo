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
  CreationAttributes,
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
  indexes: [
    {
      name: 'work_unit_files_cluster_wu_idx',
      fields: ['clusterId', 'wuId'],
    },
  ],
})
export class WorkUnitFile extends Model<
  InferAttributes<WorkUnitFile>,
  InferCreationAttributes<WorkUnitFile>
> {
  @PrimaryKey
  @Column({ type: DataType.BIGINT.UNSIGNED, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => Cluster)
  @ForeignKey(() => WorkUnit)
  @Column(DataType.UUID)
  declare clusterId: string;

  @ForeignKey(() => WorkUnit)
  @Column(DataType.STRING(30))
  declare wuId: string;

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

export type WorkUnitFileCreationAttributes = CreationAttributes<WorkUnitFile>;
