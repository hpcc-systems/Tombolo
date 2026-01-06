import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'licenses',
  freezeTableName: true,
  timestamps: true,
})
export class License extends Model<
  InferAttributes<License>,
  InferCreationAttributes<License>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  @Column(DataType.STRING)
  declare name?: string | null;

  @Column(DataType.STRING)
  declare url?: string | null;

  @Column(DataType.STRING)
  declare description?: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreationOptional<Date>;
}
