import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  HasMany,
  HasOne,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
  BeforeBulkDestroy,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { UserRole } from './UserRole.js';
import { UserApplication } from './UserApplication.js';
import { RefreshToken } from './RefreshToken.js';
import { Application } from './Application.js';
import { AccountVerificationCode } from './AccountVerificationCode.js';
import { PasswordResetLink } from './PasswordResetLink.js';
import { InstanceSettings } from './InstanceSettings.js';
import { LandingZoneMonitoring } from './LandingZoneMonitoring.js';
import { CostMonitoring } from './CostMonitoring.js';
import { FileMonitoring } from './FileMonitoring.js';
import { JobMonitoring } from './JobMonitoring.js';
import { ClusterMonitoring } from './ClusterMonitoring.js';
import { AsrDomain } from './AsrDomain.js';
import { AsrProduct } from './AsrProduct.js';

@Table({
  tableName: 'users',
  paranoid: true,
  timestamps: true,
})
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare firstName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare lastName: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare hash?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare registrationMethod: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare verifiedUser: CreationOptional<boolean>;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare verifiedAt?: Date | null;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.STRING)
  declare registrationStatus: CreationOptional<string>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare forcePasswordReset: CreationOptional<boolean>;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare passwordExpiresAt?: Date | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare loginAttempts: CreationOptional<number>;

  @AllowNull(true)
  @Default({ isLocked: false, lockedReason: [] })
  @Column(DataType.JSON)
  declare accountLocked?: CreationOptional<{
    isLocked: boolean;
    lockedReason: string[];
  }> | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLoginAt?: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastAccessedAt?: Date | null;

  @AllowNull(true)
  @Default({})
  @Column(DataType.JSON)
  declare metaData?: CreationOptional<Record<string, any>> | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Hooks
  @BeforeBulkDestroy
  static async beforeBulkDestroyHook(user: any) {
    await RefreshToken.destroy({
      where: { userId: user.where.id },
    });

    await UserRole.destroy({
      where: { userId: user.where.id },
    });

    await UserApplication.destroy({
      where: { user_id: user.where.id },
    });

    await PasswordResetLink.destroy({
      where: { userId: user.where.id },
    });

    await AccountVerificationCode.destroy({
      where: { userId: user.where.id },
    });
  }

  // Associations
  @HasMany(() => UserRole, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare roles?: UserRole[];

  @HasMany(() => UserApplication, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
  })
  declare applications?: UserApplication[];

  @HasMany(() => RefreshToken, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    hooks: true,
  })
  declare refreshTokens?: RefreshToken[];

  @HasMany(() => PasswordResetLink, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    hooks: true,
  })
  declare PasswordResetLinks?: PasswordResetLink[];

  @HasMany(() => AccountVerificationCode, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare AccountVerificationCodes?: AccountVerificationCode[];

  @HasOne(() => InstanceSettings, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare creator?: InstanceSettings;

  @HasOne(() => InstanceSettings, {
    foreignKey: 'updatedBy',
    onDelete: 'NO ACTION',
  })
  declare updater?: InstanceSettings;

  @HasMany(() => Application, {
    foreignKey: 'creator',
    onDelete: 'CASCADE',
  })
  declare apps?: Application[];

  @HasMany(() => LandingZoneMonitoring, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare createdLandingZoneMonitorings?: LandingZoneMonitoring[];

  @HasMany(() => LandingZoneMonitoring, {
    foreignKey: 'lastUpdatedBy',
    onDelete: 'NO ACTION',
  })
  declare updatedLandingZoneMonitorings?: LandingZoneMonitoring[];

  @HasMany(() => LandingZoneMonitoring, {
    foreignKey: 'approvedBy',
    onDelete: 'NO ACTION',
  })
  declare approvedLandingZoneMonitorings?: LandingZoneMonitoring[];

  @HasMany(() => LandingZoneMonitoring, {
    foreignKey: 'deletedBy',
    onDelete: 'NO ACTION',
  })
  declare deletedLandingZoneMonitorings?: LandingZoneMonitoring[];

  @HasMany(() => CostMonitoring, {
    foreignKey: 'approvedBy',
    onDelete: 'NO ACTION',
  })
  declare approvedCostMonitorings?: CostMonitoring[];

  @HasMany(() => CostMonitoring, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare createdCostMonitorings?: CostMonitoring[];

  @HasMany(() => CostMonitoring, {
    foreignKey: 'lastUpdatedBy',
    onDelete: 'NO ACTION',
  })
  declare updatedCostMonitorings?: CostMonitoring[];

  @HasMany(() => CostMonitoring, {
    foreignKey: 'deletedBy',
    onDelete: 'NO ACTION',
  })
  declare deletedCostMonitorings?: CostMonitoring[];

  @HasMany(() => FileMonitoring, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare createdFileMonitorings?: FileMonitoring[];

  @HasMany(() => FileMonitoring, {
    foreignKey: 'lastUpdatedBy',
    onDelete: 'NO ACTION',
  })
  declare updatedFileMonitorings?: FileMonitoring[];

  @HasMany(() => FileMonitoring, {
    foreignKey: 'approvedBy',
    onDelete: 'NO ACTION',
  })
  declare approvedFileMonitorings?: FileMonitoring[];

  @HasMany(() => FileMonitoring, {
    foreignKey: 'deletedBy',
    onDelete: 'NO ACTION',
  })
  declare deletedFileMonitorings?: FileMonitoring[];

  @HasMany(() => JobMonitoring, {
    foreignKey: 'approvedBy',
    onDelete: 'NO ACTION',
  })
  declare approvedJobMonitorings?: JobMonitoring[];

  @HasMany(() => JobMonitoring, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare createdJobMonitorings?: JobMonitoring[];

  @HasMany(() => JobMonitoring, {
    foreignKey: 'lastUpdatedBy',
    onDelete: 'NO ACTION',
  })
  declare updatedJobMonitorings?: JobMonitoring[];

  @HasMany(() => JobMonitoring, {
    foreignKey: 'deletedBy',
    onDelete: 'NO ACTION',
  })
  declare deletedJobMonitorings?: JobMonitoring[];

  @HasMany(() => ClusterMonitoring, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare clusterMonitoringCreator?: ClusterMonitoring[];

  @HasMany(() => ClusterMonitoring, {
    foreignKey: 'lastUpdatedBy',
    onDelete: 'NO ACTION',
  })
  declare clusterMonitoringUpdater?: ClusterMonitoring[];

  @HasMany(() => ClusterMonitoring, {
    foreignKey: 'approvedBy',
    onDelete: 'NO ACTION',
  })
  declare clusterMonitoringApprover?: ClusterMonitoring[];

  @HasMany(() => AsrDomain, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare asrDomainCreator?: AsrDomain[];

  @HasMany(() => AsrDomain, {
    foreignKey: 'updatedBy',
    onDelete: 'NO ACTION',
  })
  declare asrDomainUpdater?: AsrDomain[];

  @HasMany(() => AsrDomain, {
    foreignKey: 'updatedBy',
    onDelete: 'NO ACTION',
  })
  declare asrDomainDeleter?: AsrDomain[];

  @HasMany(() => AsrProduct, {
    foreignKey: 'createdBy',
    onDelete: 'NO ACTION',
  })
  declare asrProductCreator?: AsrProduct[];

  @HasMany(() => AsrProduct, {
    foreignKey: 'updatedBy',
    onDelete: 'NO ACTION',
  })
  declare asrProductUpdater?: AsrProduct[];

  @HasMany(() => AsrProduct, {
    foreignKey: 'updatedBy',
    onDelete: 'NO ACTION',
  })
  declare asrProductDeleter?: AsrProduct[];
}
