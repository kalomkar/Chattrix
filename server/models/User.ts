import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.ts';

interface UserAttributes {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  photoURL?: string;
  isVerified: boolean;
  isLocked: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  ghostMode?: any;
  autoReply?: any;
  about?: string;
  status?: string;
  firebaseUid?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isVerified' | 'isLocked' | 'loginAttempts'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public fullName!: string;
  public username!: string;
  public email!: string;
  public phoneNumber!: string;
  public passwordHash!: string;
  public photoURL?: string;
  public isVerified!: boolean;
  public isLocked!: boolean;
  public loginAttempts!: number;
  public lockUntil?: Date;
  public ghostMode?: any;
  public autoReply?: any;
  public about?: string;
  public status?: string;
  public firebaseUid?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Hey there! I am using Chattrix.'
    },
    firebaseUid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'online'
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photoURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ghostMode: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { hideOnline: false, hideTyping: false, hideBlueTicks: false }
    },
    autoReply: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { enabled: false, message: '' }
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] }
    ]
  }
);

export default User;
