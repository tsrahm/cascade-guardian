/**
 * @what Validation service for user input and business rules
 * @how Implements validation logic for user data and operations
 * @why Ensures data integrity and business rule compliance
 *
 * @param {CreateUserPayload} userData - User creation data to validate
 * @param {UpdateUserPayload} updateData - User update data to validate
 * @returns {void} Validation passes or throws error
 *
 * @sideeffects Validation checks, error throwing
 * @systemlayer Validation
 * @domain validation, business-rules, data-integrity
 * @tags validation, rules, integrity, business-logic
 */

import { CreateUserPayload, UpdateUserPayload } from '../models/User.js';

export class ValidationService {
  /**
   * @what Validates user creation payload
   * @how Checks required fields, email format, and password requirements
   * @why Ensures valid user data before creation
   *
   * @param {CreateUserPayload} userData - User data to validate
   * @returns {void} Validation passes
   * @throws {Error} If validation fails
   *
   * @sideeffects Validation logic
   * @systemlayer Validation
   * @domain validation, user-creation, business-rules
   * @tags validation, create, user, rules
   */
  validateCreateUserPayload(userData: CreateUserPayload): void {
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    if (!userData.password) {
      throw new Error('Password is required');
    }
    
    if (!userData.firstName) {
      throw new Error('First name is required');
    }
    
    if (!userData.lastName) {
      throw new Error('Last name is required');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Password validation
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Name validation
    if (userData.firstName.length < 2) {
      throw new Error('First name must be at least 2 characters');
    }
    
    if (userData.lastName.length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }
  }

  /**
   * @what Validates user update payload
   * @how Checks optional fields and data integrity
   * @why Ensures valid update data
   *
   * @param {UpdateUserPayload} updateData - Update data to validate
   * @returns {void} Validation passes
   * @throws {Error} If validation fails
   *
   * @sideeffects Validation logic
   * @systemlayer Validation
   * @domain validation, user-updates, business-rules
   * @tags validation, update, user, rules
   */
  validateUpdateUserPayload(updateData: UpdateUserPayload): void {
    if (!updateData.firstName && !updateData.lastName) {
      throw new Error('At least one field must be provided for update');
    }
    
    if (updateData.firstName && updateData.firstName.length < 2) {
      throw new Error('First name must be at least 2 characters');
    }
    
    if (updateData.lastName && updateData.lastName.length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }
  }

  /**
   * @what Validates email format
   * @how Uses regex to check email structure
   * @why Ensures email addresses are properly formatted
   *
   * @param {string} email - Email to validate
   * @returns {boolean} Email validity
   *
   * @sideeffects None
   * @systemlayer Validation
   * @domain validation, email, format
   * @tags validation, email, format, utility
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * @what Validates password strength
   * @how Checks length, complexity, and common patterns
   * @why Ensures passwords meet security requirements
   *
   * @param {string} password - Password to validate
   * @returns {boolean} Password strength
   *
   * @sideeffects None
   * @systemlayer Validation
   * @domain validation, password, security
   * @tags validation, password, security, strength
   */
  validatePasswordStrength(password: string): boolean {
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }
}
