import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.ts';

class PasswordResetToken extends Model {
  public token!: string;
  public userId!: string;
  public expiresAt!: Date;
}

PasswordResetToken.init(
  {
    token: {
      type: DataTypes.STRING,
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
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
  }
);

export default PasswordResetToken;
