import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
  BeforeBulkCreate,
  BeforeValidate,
  CreatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { createHash } from 'node:crypto';
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
    {
      name: 'work_unit_files_unique_file_idx',
      unique: true,
      fields: ['wuId', 'clusterId', 'fileType', 'fileNameHash'],
    },
  ],
})
export class WorkUnitFile extends Model<
  InferAttributes<WorkUnitFile>,
  InferCreationAttributes<WorkUnitFile>
> {
  static hashFileName(fileName: string): string {
    return createHash('sha256').update(fileName).digest('hex');
  }

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
  @Column(DataType.STRING(64))
  declare fileNameHash: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.ENUM('input', 'output'))
  declare fileType: 'input' | 'output';

  @CreatedAt
  @AllowNull(false)
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
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

  @BeforeValidate
  static setFileNameHash(instance: WorkUnitFile) {
    if (instance.fileName && !instance.fileNameHash) {
      instance.fileNameHash = WorkUnitFile.hashFileName(instance.fileName);
    }
  }

  @BeforeBulkCreate
  static setBulkFileNameHash(instances: WorkUnitFile[]) {
    for (const instance of instances) {
      if (instance.fileName && !instance.fileNameHash) {
        instance.fileNameHash = WorkUnitFile.hashFileName(instance.fileName);
      }
    }
  }
}

export type WorkUnitFileCreationAttributes = CreationAttributes<WorkUnitFile>;
