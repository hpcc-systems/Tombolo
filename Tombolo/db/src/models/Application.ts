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
  BelongsTo,
  ForeignKey,
  DeletedAt,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { User } from './User.js';
import { UserApplication } from './UserApplication.js';
import { FileMonitoring } from './FileMonitoring.js';
import { IntegrationMapping } from './IntegrationMapping.js';
import { JobMonitoringData } from './JobMonitoringData.js';
import { JobMonitoringDataArchive } from './JobMonitoringDataArchive.js';
import { LandingZoneMonitoring } from './LandingZoneMonitoring.js';
import { JobMonitoring } from './JobMonitoring.js';
import { CostMonitoring } from './CostMonitoring.js';
import { OrbitProfileMonitoring } from './OrbitProfileMonitoring.js';

@Table({
  tableName: 'applications',
  paranoid: true,
  timestamps: true,
})
export class Application extends Model<
  InferAttributes<Application>,
  InferCreationAttributes<Application>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare creator: string;

  @AllowNull(false)
  @Default('Private')
  @Column(DataType.ENUM('Public', 'Private'))
  declare visibility: CreationOptional<'Public' | 'Private'>;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt?: CreationOptional<Date> | null;

  // Associations
  @HasMany(() => UserApplication, 'application_id')
  declare userApplications?: UserApplication[];

  @HasMany(() => FileMonitoring, 'applicationId')
  declare fileMonitorings?: FileMonitoring[];

  @HasMany(() => IntegrationMapping, 'application_id')
  declare integrationMappings?: IntegrationMapping[];

  @HasMany(() => JobMonitoringData, 'applicationId')
  declare jobMonitoringData?: JobMonitoringData[];

  @HasMany(() => JobMonitoringDataArchive, 'applicationId')
  declare jobMonitoringDataArchive?: JobMonitoringDataArchive[];

  @HasMany(() => LandingZoneMonitoring, 'applicationId')
  declare landingZoneMonitorings?: LandingZoneMonitoring[];

  @HasMany(() => JobMonitoring, 'applicationId')
  declare jobMonitorings?: JobMonitoring[];

  @HasMany(() => CostMonitoring, 'applicationId')
  declare costMonitorings?: CostMonitoring[];

  @HasMany(() => OrbitProfileMonitoring, 'applicationId')
  declare orbitProfileMonitorings?: OrbitProfileMonitoring[];

  @BelongsTo(() => User, {
    foreignKey: 'creator',
    as: 'application_creator',
    onDelete: 'CASCADE',
  })
  declare application_creator?: User;
}
