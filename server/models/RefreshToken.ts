import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.ts';

class RefreshToken extends Model {
  public token!: string;
  public userId!: string;
  public expiresAt!: Date;
}

RefreshToken.init(
  {
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
  }
);

export default RefreshToken;
