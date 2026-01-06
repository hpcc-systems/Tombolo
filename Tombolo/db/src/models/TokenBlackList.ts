import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({
  tableName: 'token_black_list',
  timestamps: false,
})
export class TokenBlackList extends Model<
  InferAttributes<TokenBlackList>,
  InferCreationAttributes<TokenBlackList>
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare exp: number;
}
