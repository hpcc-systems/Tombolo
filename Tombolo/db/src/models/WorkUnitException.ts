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
import { Cluster } from './Cluster.js';

@Table({
  tableName: 'work_unit_exceptions',
  updatedAt: false,
  paranoid: true,
  timestamps: true,
})
export class WorkUnitException extends Model {
  @PrimaryKey
  @Column(DataType.STRING(30))
  declare wuId: string;

  @PrimaryKey
  @ForeignKey(() => Cluster)
  @Column(DataType.UUID)
  declare clusterId: string;

  @PrimaryKey
  @Column(DataType.INTEGER)
  declare sequenceNo: number;

  @Column(DataType.STRING(20))
  declare severity?: string;

  @Column(DataType.STRING(40))
  declare source?: string;

  @Column(DataType.INTEGER)
  declare code?: number;

  @Column(DataType.STRING(200))
  declare message?: string;

  @Column(DataType.INTEGER)
  declare column?: number;

  @Column(DataType.INTEGER)
  declare lineNo?: number;

  @Column(DataType.STRING(210))
  declare fileName?: string;

  @Column(DataType.INTEGER)
  declare activity?: number;

  @Column(DataType.STRING(210))
  declare scope?: string;

  @Column(DataType.INTEGER)
  declare priority?: number;

  @Column(DataType.FLOAT)
  declare cost?: number;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: Date;

  // Associations
  @BelongsTo(() => Cluster)
  declare cluster?: Cluster;
}
