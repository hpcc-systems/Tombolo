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
  tableName: 'work_unit_exceptions',
  updatedAt: false,
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      name: 'work_unit_exceptions_cluster_wu_idx',
      fields: ['clusterId', 'wuId'],
    },
    {
      name: 'work_unit_exceptions_unique_hash_idx',
      unique: true,
      fields: ['wuId', 'clusterId', 'exceptionHash'],
    },
  ],
})
export class WorkUnitException extends Model<
  InferAttributes<WorkUnitException>,
  InferCreationAttributes<WorkUnitException>
> {
  static hashExceptionIdentity(
    severity: string,
    source: string,
    code: number,
    message: string,
    lineNo: number,
    fileName: string,
    activity: number,
    scope: string,
    priority: number
  ): string {
    return createHash('sha256')
      .update(
        [
          severity,
          source,
          String(code),
          message,
          String(lineNo),
          fileName,
          String(activity),
          scope,
          String(priority),
        ].join('|')
      )
      .digest('hex');
  }

  @PrimaryKey
  @Column({ type: DataType.BIGINT.UNSIGNED, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => WorkUnit)
  @Column(DataType.STRING(30))
  declare wuId: string;

  @ForeignKey(() => Cluster)
  @ForeignKey(() => WorkUnit)
  @Column(DataType.UUID)
  declare clusterId: string;

  @AllowNull(false)
  @Column(DataType.STRING(64))
  declare exceptionHash: CreationOptional<string>;

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
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare createdAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @BelongsTo(() => Cluster, {
    foreignKey: 'clusterId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare cluster?: Cluster;

  // Composite foreign key relationship - using both clusterId and wuId
  // Sequelize doesn't fully support composite foreign keys, so constraints are disabled
  @BelongsTo(() => WorkUnit, {
    foreignKey: 'wuId',
    targetKey: 'wuId',
    constraints: false,
  })
  declare workUnit?: WorkUnit;

  @BeforeValidate
  static setExceptionHash(instance: WorkUnitException) {
    if (instance.exceptionHash) {
      return;
    }

    instance.exceptionHash = WorkUnitException.hashExceptionIdentity(
      instance.severity ?? '',
      instance.source ?? '',
      instance.code ?? 0,
      instance.message ?? '',
      instance.lineNo ?? 0,
      instance.fileName ?? '',
      instance.activity ?? 0,
      instance.scope ?? '',
      instance.priority ?? 0
    );
  }

  @BeforeBulkCreate
  static setBulkExceptionHash(instances: WorkUnitException[]) {
    for (const instance of instances) {
      WorkUnitException.setExceptionHash(instance);
    }
  }
}

// Export creation attributes type for use in other files
export type WorkUnitExceptionCreationAttributes =
  CreationAttributes<WorkUnitException>;
