'use strict';

/**
 * Mixin for shared delete functionality in Sequelize models
 * @param {typeof import('sequelize').Model} superclass - The Sequelize model class to extend
 * @returns {typeof import('sequelize').Model & typeof DeleteMixin} - The extended Sequelize model class with delete functionality
 */
const DeleteMixin = superclass =>
  class extends superclass {
    /**
     * Soft deletes a record and sets the deletedBy field.
     * @param {Object} options - Options for the operation
     * @param {string} options.id - UUID of the record to soft delete
     * @param {string} options.deletedByUserId - UUID of the user performing the soft deletion
     * @param {Object} [options.transaction] - Sequelize transaction object (optional)
     * @returns {Promise<number>} Number of records soft deleted (1 if successful, 0 if not found)
     * @throws {Error} If id or deletedByUserId is missing or record not found
     */
    static async handleDelete({ id, deletedByUserId, transaction = null }) {
      if (!id || !deletedByUserId) {
        throw new Error('Missing required parameters: id or deletedByUserId');
      }

      const executeDelete = async t => {
        // Update deletedBy field
        await this.update(
          { deletedBy: deletedByUserId },
          {
            where: { id },
            transaction: t,
          }
        );

        // Perform soft delete
        return await this.destroy({
          where: { id },
          transaction: t,
        });
      };

      // Execute with the provided transaction or create a new one
      return transaction
        ? executeDelete(transaction)
        : this.sequelize.transaction(executeDelete);
    }
  };

// Export the mixin for use in model definitions
module.exports = { DeleteMixin };
