import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.ts';

class EmailVerificationToken extends Model {
  public token!: string;
  public userId!: string;
  public expiresAt!: Date;
}

EmailVerificationToken.init(
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
    modelName: 'EmailVerificationToken',
    tableName: 'email_verification_tokens',
  }
);

export default EmailVerificationToken;
