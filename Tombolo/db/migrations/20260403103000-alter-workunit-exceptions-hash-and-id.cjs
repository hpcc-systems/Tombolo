'use strict';

const { createHash } = require('node:crypto');

async function hasConstraint(queryInterface, tableName, constraintName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT 1
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = :tableName
       AND CONSTRAINT_NAME = :constraintName
     LIMIT 1`,
    {
      replacements: {
        tableName,
        constraintName,
      },
    }
  );

  return rows.length > 0;
}

async function hasColumn(queryInterface, tableName, columnName) {
  const table = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(table, columnName);
}

async function hasIndex(queryInterface, tableName, indexName) {
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some(index => index.name === indexName);
}

async function hasPrimaryKey(queryInterface, tableName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT 1
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = :tableName
       AND CONSTRAINT_TYPE = 'PRIMARY KEY'
     LIMIT 1`,
    {
      replacements: { tableName },
    }
  );

  return rows.length > 0;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasColumn(queryInterface, 'work_unit_exceptions', 'id'))) {
      await queryInterface.addColumn('work_unit_exceptions', 'id', {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      });
    }

    if (
      !(await hasColumn(
        queryInterface,
        'work_unit_exceptions',
        'exceptionHash'
      ))
    ) {
      await queryInterface.addColumn('work_unit_exceptions', 'exceptionHash', {
        allowNull: true,
        type: Sequelize.STRING(64),
      });
    }

    const [existingRows] = await queryInterface.sequelize.query(
      `SELECT wuId, clusterId, sequenceNo, severity, source, code, message, lineNo, fileName, activity, scope, priority, createdAt
       FROM work_unit_exceptions
       ORDER BY wuId ASC, clusterId ASC, createdAt ASC, sequenceNo ASC`
    );

    const hashIdentity = row =>
      createHash('sha256')
        .update(
          [
            row.severity ?? '',
            row.source ?? '',
            String(row.code ?? 0),
            row.message ?? '',
            String(row.lineNo ?? 0),
            row.fileName ?? '',
            String(row.activity ?? 0),
            row.scope ?? '',
            String(row.priority ?? 0),
          ].join('|')
        )
        .digest('hex');

    for (const row of existingRows) {
      const exceptionHash = hashIdentity(row);
      await queryInterface.sequelize.query(
        `UPDATE work_unit_exceptions
         SET exceptionHash = :exceptionHash
         WHERE wuId = :wuId
           AND clusterId = :clusterId
           AND sequenceNo = :sequenceNo`,
        {
          replacements: {
            exceptionHash,
            wuId: row.wuId,
            clusterId: row.clusterId,
            sequenceNo: row.sequenceNo,
          },
        }
      );
    }

    const seenKeys = new Set();
    const duplicates = [];

    for (const row of existingRows) {
      const exceptionHash = hashIdentity(row);
      const dedupeKey = `${row.wuId}|${row.clusterId}|${exceptionHash}`;

      if (seenKeys.has(dedupeKey)) {
        duplicates.push({
          wuId: row.wuId,
          clusterId: row.clusterId,
          sequenceNo: row.sequenceNo,
        });
        continue;
      }

      seenKeys.add(dedupeKey);
    }

    for (const duplicate of duplicates) {
      await queryInterface.sequelize.query(
        `DELETE FROM work_unit_exceptions
         WHERE wuId = :wuId
           AND clusterId = :clusterId
           AND sequenceNo = :sequenceNo`,
        {
          replacements: duplicate,
        }
      );
    }

    const [remainingRows] = await queryInterface.sequelize.query(
      `SELECT wuId, clusterId, sequenceNo
       FROM work_unit_exceptions
       ORDER BY wuId ASC, clusterId ASC, sequenceNo ASC`
    );

    let nextId = 1;
    for (const row of remainingRows) {
      await queryInterface.sequelize.query(
        `UPDATE work_unit_exceptions
         SET id = :id
         WHERE wuId = :wuId
           AND clusterId = :clusterId
           AND sequenceNo = :sequenceNo`,
        {
          replacements: {
            id: nextId,
            wuId: row.wuId,
            clusterId: row.clusterId,
            sequenceNo: row.sequenceNo,
          },
        }
      );
      nextId += 1;
    }

    await queryInterface.changeColumn('work_unit_exceptions', 'exceptionHash', {
      allowNull: false,
      type: Sequelize.STRING(64),
    });

    await queryInterface.changeColumn('work_unit_exceptions', 'id', {
      allowNull: false,
      type: Sequelize.BIGINT.UNSIGNED,
    });

    if (
      await hasConstraint(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_workunit_fk'
      )
    ) {
      await queryInterface.removeConstraint(
        'work_unit_exceptions',
        'work_unit_exceptions_workunit_fk'
      );
    }

    if (await hasPrimaryKey(queryInterface, 'work_unit_exceptions')) {
      await queryInterface.sequelize.query(
        'ALTER TABLE work_unit_exceptions DROP PRIMARY KEY'
      );
    }

    if (!(await hasPrimaryKey(queryInterface, 'work_unit_exceptions'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE work_unit_exceptions MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (id)'
      );
    }

    if (await hasColumn(queryInterface, 'work_unit_exceptions', 'sequenceNo')) {
      await queryInterface.removeColumn('work_unit_exceptions', 'sequenceNo');
    }

    if (
      !(await hasIndex(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_cluster_wu_idx'
      ))
    ) {
      await queryInterface.addIndex(
        'work_unit_exceptions',
        ['clusterId', 'wuId'],
        {
          name: 'work_unit_exceptions_cluster_wu_idx',
        }
      );
    }

    if (
      !(await hasIndex(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_unique_hash_idx'
      ))
    ) {
      await queryInterface.addIndex(
        'work_unit_exceptions',
        ['wuId', 'clusterId', 'exceptionHash'],
        {
          name: 'work_unit_exceptions_unique_hash_idx',
          unique: true,
        }
      );
    }

    if (
      !(await hasConstraint(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_workunit_fk'
      ))
    ) {
      await queryInterface.addConstraint('work_unit_exceptions', {
        fields: ['wuId', 'clusterId'],
        type: 'foreign key',
        name: 'work_unit_exceptions_workunit_fk',
        references: {
          table: 'work_units',
          fields: ['wuId', 'clusterId'],
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    if (
      await hasConstraint(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_workunit_fk'
      )
    ) {
      await queryInterface.removeConstraint(
        'work_unit_exceptions',
        'work_unit_exceptions_workunit_fk'
      );
    }

    if (
      await hasIndex(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_unique_hash_idx'
      )
    ) {
      await queryInterface.removeIndex(
        'work_unit_exceptions',
        'work_unit_exceptions_unique_hash_idx'
      );
    }

    if (
      await hasIndex(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_cluster_wu_idx'
      )
    ) {
      await queryInterface.removeIndex(
        'work_unit_exceptions',
        'work_unit_exceptions_cluster_wu_idx'
      );
    }

    if (
      !(await hasColumn(queryInterface, 'work_unit_exceptions', 'sequenceNo'))
    ) {
      await queryInterface.addColumn('work_unit_exceptions', 'sequenceNo', {
        allowNull: true,
        type: Sequelize.INTEGER,
      });
    }

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, wuId, clusterId
       FROM work_unit_exceptions
       ORDER BY wuId ASC, clusterId ASC, createdAt ASC, id ASC`
    );

    let lastWuId = null;
    let lastClusterId = null;
    let nextSequenceNo = 0;

    for (const row of rows) {
      if (row.wuId !== lastWuId || row.clusterId !== lastClusterId) {
        lastWuId = row.wuId;
        lastClusterId = row.clusterId;
        nextSequenceNo = 0;
      }

      await queryInterface.sequelize.query(
        `UPDATE work_unit_exceptions
         SET sequenceNo = :sequenceNo
         WHERE id = :id`,
        {
          replacements: {
            sequenceNo: nextSequenceNo,
            id: row.id,
          },
        }
      );

      nextSequenceNo += 1;
    }

    await queryInterface.changeColumn('work_unit_exceptions', 'sequenceNo', {
      allowNull: false,
      type: Sequelize.INTEGER,
    });

    if (
      await hasColumn(queryInterface, 'work_unit_exceptions', 'exceptionHash')
    ) {
      await queryInterface.removeColumn(
        'work_unit_exceptions',
        'exceptionHash'
      );
    }

    await queryInterface.sequelize.query(
      'ALTER TABLE work_unit_exceptions MODIFY id BIGINT UNSIGNED NOT NULL'
    );

    if (await hasPrimaryKey(queryInterface, 'work_unit_exceptions')) {
      await queryInterface.sequelize.query(
        'ALTER TABLE work_unit_exceptions DROP PRIMARY KEY'
      );
    }

    if (!(await hasPrimaryKey(queryInterface, 'work_unit_exceptions'))) {
      await queryInterface.sequelize.query(
        'ALTER TABLE work_unit_exceptions ADD PRIMARY KEY (wuId, clusterId, sequenceNo)'
      );
    }

    if (await hasColumn(queryInterface, 'work_unit_exceptions', 'id')) {
      await queryInterface.removeColumn('work_unit_exceptions', 'id');
    }

    if (
      !(await hasConstraint(
        queryInterface,
        'work_unit_exceptions',
        'work_unit_exceptions_workunit_fk'
      ))
    ) {
      await queryInterface.addConstraint('work_unit_exceptions', {
        fields: ['wuId', 'clusterId'],
        type: 'foreign key',
        name: 'work_unit_exceptions_workunit_fk',
        references: {
          table: 'work_units',
          fields: ['wuId', 'clusterId'],
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  },
};
