import mongoose from "mongoose";

/**
 * Execute a function within a MongoDB transaction
 * Automatically handles commit/rollback
 * @param {Function} callback - Async function that receives session as parameter
 * @returns {Promise<any>} Result of the callback function
 */
export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Execute multiple database operations atomically
 * @param {Array<Function>} operations - Array of async functions
 * @param {mongoose.ClientSession} session - MongoDB session
 * @returns {Promise<Array>} Results of all operations
 */
export const executeAtomically = async (operations, session) => {
  const results = [];
  for (const operation of operations) {
    const result = await operation(session);
    results.push(result);
  }
  return results;
};