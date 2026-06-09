/**
 * @what User service handling business logic for user operations
 * @how Implements CRUD operations, authentication, and validation for user management
 * @why Centralizes user business logic and provides a clean API for user operations
 *
 * @param {User} user - User object for operations
 * @param {string} email - Email for user lookup
 * @param {string} password - Password for authentication
 * @returns {User} Processed user data or authentication results
 *
 * @sideeffects Database operations, password hashing, token generation
 * @systemlayer Business Logic
 * @domain user-management, authentication, business-logic
 * @tags user, service, authentication, crud, business-logic
 */

import { User, CreateUserPayload, UpdateUserPayload } from '../models/User.js';
import { DatabaseService } from './DatabaseService.js';
import { AuthService } from './AuthService.js';
import { ValidationService } from './ValidationService.js';

export class UserService {
  private dbService: DatabaseService;
  private authService: AuthService;
  private validationService: ValidationService;

  constructor() {
    this.dbService = new DatabaseService();
    this.authService = new AuthService();
    this.validationService = new ValidationService();
  }

  /**
   * @what Creates a new user with validation and password hashing
   * @how Validates input, hashes password, and stores user in database
   * @why Provides secure user creation with proper validation
   *
   * @param {CreateUserPayload} userData - User creation data
   * @returns {Promise<User>} Created user object
   *
   * @sideeffects Database write, password hashing
   * @systemlayer Business Logic
   * @domain user-management, creation, authentication
   * @tags user, create, registration, validation
   */
  async createUser(userData: CreateUserPayload): Promise<User> {
    // Validate input data
    this.validationService.validateCreateUserPayload(userData);
    
    // Check if user already exists
    const existingUser = await this.dbService.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await this.authService.hashPassword(userData.password);
    
    // Create user object
    const user: User = {
      id: this.generateUserId(),
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to database
    return await this.dbService.createUser(user);
  }

  /**
   * @what Authenticates user with email and password
   * @how Validates credentials and returns user with authentication token
   * @why Provides secure authentication with token generation
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: User, token: string}>} Authentication result
   *
   * @sideeffects Database read, password verification, token generation
   * @systemlayer Business Logic
   * @domain authentication, login, security
   * @tags user, authenticate, login, token, security
   */
  async authenticateUser(email: string, password: string): Promise<{user: User, token: string}> {
    // Find user by email
    const user = await this.dbService.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await this.authService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = this.authService.generateToken(user);
    
    return { user, token };
  }

  /**
   * @what Updates user profile information
   * @how Validates input and updates user data in database
   * @why Allows users to modify their profile information
   *
   * @param {string} userId - User identifier
   * @param {UpdateUserPayload} updateData - Data to update
   * @returns {Promise<User>} Updated user object
   *
   * @sideeffects Database write, validation
   * @systemlayer Business Logic
   * @domain user-management, updates, profile
   * @tags user, update, profile, modification
   */
  async updateUser(userId: string, updateData: UpdateUserPayload): Promise<User> {
    // Validate input
    this.validationService.validateUpdateUserPayload(updateData);
    
    // Find user
    const existingUser = await this.dbService.findUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Update user data
    const updatedUser: User = {
      ...existingUser,
      ...updateData,
      updatedAt: new Date()
    };
    
    return await this.dbService.updateUser(updatedUser);
  }

  /**
   * @what Retrieves user by ID
   * @how Queries database for user with specified ID
   * @why Provides access to user data for other services
   *
   * @param {string} userId - User identifier
   * @returns {Promise<User>} User object
   *
   * @sideeffects Database read
   * @systemlayer Business Logic
   * @domain user-management, retrieval, data-access
   * @tags user, get, retrieve, find
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.dbService.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * @what Deletes user account
   * @how Removes user from database after validation
   * @why Provides account deletion functionality
   *
   * @param {string} userId - User identifier
   * @returns {Promise<void>} Deletion confirmation
   *
   * @sideeffects Database deletion
   * @systemlayer Business Logic
   * @domain user-management, deletion, cleanup
   * @tags user, delete, remove, account
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.dbService.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    await this.dbService.deleteUser(userId);
  }

  /**
   * @what Generates unique user ID
   * @how Creates UUID-based identifier
   * @why Ensures unique identification for all users
   *
   * @returns {string} Unique user identifier
   *
   * @sideeffects None
   * @systemlayer Business Logic
   * @domain user-management, identification, utility
   * @tags user, id, generate, uuid, utility
   */
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
