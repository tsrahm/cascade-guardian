/**
 * @what User model representing application users with authentication and profile data
 * @how Defines the User interface with properties for authentication, profile information, and metadata
 * @why Provides type safety and structure for user data throughout the application
 *
 * @param {string} id - Unique user identifier
 * @param {string} email - User email address for login
 * @param {string} password - Hashed password (never stored in plain text)
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {Date} createdAt - Account creation timestamp
 * @param {Date} updatedAt - Last profile update timestamp
 * @returns {User} User object with all properties
 *
 * @sideeffects Database operations, password hashing
 * @systemlayer Model
 * @domain user-management, authentication, data-model
 * @tags user, model, authentication, profile, typescript
 */

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @what User creation payload interface for registration and profile updates
 * @how Defines required fields for creating new users or updating existing profiles
 * @why Ensures data consistency and validation for user operations
 *
 * @param {string} email - User email (must be unique)
 * @param {string} password - Plain text password (will be hashed)
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {CreateUserPayload} User creation data
 *
 * @sideeffects None
 * @systemlayer Model
 * @domain user-management, validation
 * @tags user, creation, payload, validation
 */

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * @what User update payload for profile modifications
 * @how Defines optional fields that can be updated without affecting other user data
 * @why Allows partial updates while maintaining data integrity
 *
 * @param {string} firstName - Optional first name update
 * @param {string} lastName - Optional last name update
 * @returns {UpdateUserPayload} User update data
 *
 * @sideeffects None
 * @systemlayer Model
 * @domain user-management, updates
 * @tags user, update, payload, profile
 */

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
}
