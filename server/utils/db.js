module.exports = {
    mongoUrl() {
        return  "mongodb://{Connection String},cluster0-shard-00-03-yzwxy.mongodb.net:27017/admin?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";
    },

    mongoDbName() {
        return "tombolo";
    }
}