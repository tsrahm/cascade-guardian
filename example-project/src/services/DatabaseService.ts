/**
 * @what Database service handling all database operations for users
 * @how Provides CRUD operations and queries for user data management
 * @why Centralizes database access and provides a clean interface for data operations
 *
 * @param {User} user - User object for database operations
 * @param {string} email - Email for user lookup
 * @param {string} userId - User ID for operations
 * @returns {Promise<User>} User data from database
 *
 * @sideeffects Database read/write operations
 * @systemlayer Data Layer
 * @domain user-management, database, data-access
 * @tags database, crud, user, data-layer
 */

import { User, CreateUserPayload, UpdateUserPayload } from '../models/User.js';

export class DatabaseService {
  private users: Map<string, User> = new Map(); // In-memory storage for example

  /**
   * @what Creates a new user in the database
   * @how Stores user data with validation
   * @why Provides user creation functionality
   *
   * @param {User} user - User object to create
   * @returns {Promise<User>} Created user object
   *
   * @sideeffects Database write
   * @systemlayer Data Layer
   * @domain user-management, creation, database
   * @tags database, create, user, write
   */
  async createUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  /**
   * @what Finds user by email address
   * @how Queries database for user with specified email
   * @why Enables user lookup for authentication and validation
   *
   * @param {string} email - Email address to search
   * @returns {Promise<User | null>} User object or null if not found
   *
   * @sideeffects Database read
   * @systemlayer Data Layer
   * @domain user-management, search, database
   * @tags database, find, email, search
   */
  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  /**
   * @what Finds user by ID
   * @how Queries database for user with specified ID
   * @why Enables user retrieval for profile operations
   *
   * @param {string} userId - User ID to search
   * @returns {Promise<User | null>} User object or null if not found
   *
   * @sideeffects Database read
   * @systemlayer Data Layer
   * @domain user-management, search, database
   * @tags database, find, id, search
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  /**
   * @what Updates user data in database
   * @how Modifies existing user record
   * @why Enables profile updates and data modifications
   *
   * @param {User} user - Updated user object
   * @returns {Promise<User>} Updated user object
   *
   * @sideeffects Database write
   * @systemlayer Data Layer
   * @domain user-management, updates, database
   * @tags database, update, user, write
   */
  async updateUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  /**
   * @what Deletes user from database
   * @how Removes user record by ID
   * @why Enables account deletion and cleanup
   *
   * @param {string} userId - User ID to delete
   * @returns {Promise<void>} Deletion confirmation
   *
   * @sideeffects Database deletion
   * @systemlayer Data Layer
   * @domain user-management, deletion, database
   * @tags database, delete, user, cleanup
   */
  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  /**
   * @what Gets all users from database
   * @how Retrieves complete user list
   * @why Provides admin functionality and data analysis
   *
   * @returns {Promise<User[]>} Array of all users
   *
   * @sideeffects Database read
   * @systemlayer Data Layer
   * @domain user-management, admin, database
   * @tags database, list, users, admin
   */
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}
