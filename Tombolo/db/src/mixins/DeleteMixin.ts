import { Op, Model, Transaction } from 'sequelize';

export interface DeleteOptions {
  id: string | string[];
  deletedByUserId: string;
  transaction?: Transaction | null;
  deleteKey?: 'id' | 'domain_id';
}

type Constructor<T = {}> = abstract new (...args: any[]) => T;

/**
 * Mixin for shared delete functionality in Sequelize models
 * @param superclass - The Sequelize model class to extend
 * @returns The extended Sequelize model class with delete functionality
 */
export function DeleteMixin<TBase extends Constructor<Model>>(
  superclass: TBase
) {
  abstract class DeleteMixinClass extends superclass {
    /**
     * Soft deletes a record and sets the deletedBy field.
     * @param options - Options for the operation
     * @param options.id - UUID of the record to soft delete or an array of UUIDs
     * @param options.deletedByUserId - UUID of the user performing the soft deletion
     * @param options.transaction - Sequelize transaction object (optional)
     * @param options.deleteKey - The key to use for the where clause (default: 'id')
     * @returns Number of records soft deleted (1 if successful, 0 if not found)
     * @throws {Error} If id or deletedByUserId is missing or record not found
     */
    static async handleDelete({
      id,
      deletedByUserId,
      transaction = null,
      deleteKey = 'id',
    }: DeleteOptions): Promise<number> {
      if (!id || !deletedByUserId) {
        throw new Error('Missing required parameters: id or deletedByUserId');
      }

      const allowedKeys: Array<'id' | 'domain_id'> = ['id', 'domain_id'];
      if (deleteKey && !allowedKeys.includes(deleteKey)) {
        throw new Error(`Unsupported deleteKey: ${deleteKey}`);
      }

      const buildWhere = (value: string | string[]) =>
        Array.isArray(value)
          ? { [deleteKey]: { [Op.in]: value } }
          : { [deleteKey]: value };

      const executeDelete = async (t: Transaction) => {
        // Update deletedBy field
        await (this as any).update(
          { deletedBy: deletedByUserId },
          {
            where: buildWhere(id),
            transaction: t,
          }
        );

        // Perform soft delete
        return await (this as any).destroy({
          where: buildWhere(id),
          transaction: t,
        });
      };

      // Execute with the provided transaction or create a new one
      return transaction
        ? executeDelete(transaction)
        : (this as any).sequelize!.transaction(executeDelete);
    }
  }
  return DeleteMixinClass;
}
