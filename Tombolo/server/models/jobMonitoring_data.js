"use strict";
module.exports = (sequelize, DataTypes) => {
  const JobMonitoringData = sequelize.define(
    "jobMonitoring_Data",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "jobMonitoring",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      metaData: {
        allowNull: false,
        type: DataTypes.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "jobMonitoring_Data",
      timestamps: true,
      paranoid: true,
    }
  );
  JobMonitoringData.associate = function (models) {
    JobMonitoringData.belongsTo(models.application, {
      foreignKey: "jobMonitoring",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };
  const timeSeriesAnalysisAndAlert = (data) => {
    const jobMonitoringData = sequelize.models.jobMonitoring_Data;
    const notificationQueue = sequelize.models.notificationQueue;

    if (!data.monitoringId) {
      //this should never happen, but throw an error if it does
      logger.error(
        "No monitoring ID was provided for Time series analysis - " +
          JSON.stringify(data)
      );
      return;
    }
    //get the last 10 records with the same monitoringId
    const last10 = jobMonitoringData.findAll({
      where: {
        monitoringId: data.monitoringId,
        id: !data.id, //exclude the current record
      },
      //only get the top level info, as this is all we analyze - PLACEHOLDER FOR NOW
      attributes: ["date", "metaData"],
      order: [["date", "DESC"]],
      limit: 10,
    });

    //only do analysis if there are at least 2 other records to compare to
    if (!last10.length || last10.length < 2) {
      logger.verbose(
        "Not enough records to perform time series analysis for monitoring ID " +
          data.monitoringId
      );
      return; //if there are not enough records, we can't do any analysis
    }

    //calculate the average of the last 10 records for important stuff - PLACEHOLDER
    let average = [];

    last10.forEach((record) => {
      //add each desired calculation point to the average array - PLACEHOLDER
      //e.g. average.cost += record.metaData.cost;
    });

    //divide each point by the number of records to get the average - PLACEHOLDER
    //average.cost = average.cost / last10.length;

    let alertAttributes = [];
    //compare the current record to the average - PLACEHOLDER
    average.forEach((point) => {
      //if the current record is more than 20% higher than the average, send an alert - PLACEHOLDER
      //e.g. if (data.metaData.cost > point.cost * 1.2) {
      //  alertAttributes.push({'cost'});
      //}
    });

    if (!alertAttributes.length) {
      logger.verbose("No alerts needed for monitoring ID " + data.monitoringId);
      return;
    }

    //Build the data that will build the data table for the last 10 and current
    let dataTable = [];

    alertAttributes.forEach((attribute) => {
      dataTable.push({
        attribute: attribute,
        current: data.metaData[attribute],
        average: average[attribute],
        last10: last10.map((record) => record.metaData[attribute]),
      });
    });

    //send the alert
    //notificationQueue create

    return;
  };
  JobMonitoringData.addHook("afterCreate", async (instance, options) => {
    timeSeriesAnalysisAndAlert({ data: instance });
  });

  return JobMonitoringData;
};
