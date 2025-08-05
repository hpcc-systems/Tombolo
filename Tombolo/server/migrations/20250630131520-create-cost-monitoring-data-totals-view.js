'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
CREATE OR REPLACE VIEW cost_monitoring_data_totals AS
WITH filtered_data AS (
    SELECT
        t.monitoringId,
        t.usersCostInfo,
        c.timezone_offset
    FROM cost_monitoring_data t
             INNER JOIN clusters c ON c.id = t.clusterId
    WHERE t.deletedAt IS NULL
      AND DATE(DATE_ADD(t.date, INTERVAL c.timezone_offset MINUTE)) = DATE(DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL c.timezone_offset MINUTE))
)
SELECT
    CONCAT(fd.monitoringId, '-', user_keys.username) as id,
    fd.monitoringId,
    user_keys.username,
    MIN(fd.timezone_offset) as timezone_offset,
    SUM(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(fd.usersCostInfo, CONCAT('$.', user_keys.username, '.compileCost'))) AS DECIMAL(10,5)), 0)) AS compileCost,
    SUM(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(fd.usersCostInfo, CONCAT('$.', user_keys.username, '.fileAccessCost'))) AS DECIMAL(10,5)), 0)) AS fileAccessCost,
    SUM(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(fd.usersCostInfo, CONCAT('$.', user_keys.username, '.executeCost'))) AS DECIMAL(10,5)), 0)) AS executeCost,
    SUM(
            COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(fd.usersCostInfo, CONCAT('$.', user_keys.username, '.compileCost'))) AS DECIMAL(10,5)), 0) +
            COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(fd.usersCostInfo, CONCAT('$.', user_keys.username, '.fileAccessCost'))) AS DECIMAL(10,5)), 0) +
            COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(fd.usersCostInfo, CONCAT('$.', user_keys.username, '.executeCost'))) AS DECIMAL(10,5)), 0)
    ) AS totalCost
FROM filtered_data fd
         CROSS JOIN JSON_TABLE(
        JSON_KEYS(fd.usersCostInfo),
        '$[*]' COLUMNS (
            username VARCHAR(255) PATH '$'
            )
                    ) AS user_keys
GROUP BY fd.monitoringId, user_keys.username;
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(
      'DROP VIEW IF EXISTS cost_monitoring_data_totals;'
    );
  },
};
