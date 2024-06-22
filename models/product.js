'use strict';
module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define('products', {
    Id: DataTypes.INTEGER,
    Name: DataTypes.VARCHAR,
    Price: DataTypes.VARCHAR,
    Stock: DataTypes.INTEGER,
    Deskripsi: DataTypes.VARCHAR
  }, {
    timestamps: true,
    tableName: 'products',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  posts.associate = function(models) {
    // associations can be defined here
  };
  return posts;
};