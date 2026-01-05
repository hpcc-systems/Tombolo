import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'token_black_list',
  timestamps: false,
})
export class TokenBlackList extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare exp: number;
}
