const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { sendEmail } = require('../config/mailer');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Authenticate user and return JWT + user profile
   */
  async login(email, password, ipAddress = null) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        customerProfile: true,
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error(`Your account is currently ${user.status.toLowerCase()}. Please contact administration.`);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record login in activity log
    await prisma.activityLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: `Successful login from role ${user.role}`,
        ipAddress,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        lastLoginAt: user.lastLoginAt,
        customerProfile: user.customerProfile,
        employeeProfile: user.employeeProfile,
      },
    };
  }

  /**
   * Register a new Customer account with Customer profile
   */
  async registerCustomer(customerData, actorId = null) {
    const existing = await prisma.user.findUnique({
      where: { email: customerData.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error('A user with this email already exists.');
    }

    const defaultPassword = customerData.password || 'Welcome@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: customerData.email.toLowerCase().trim(),
          passwordHash,
          role: 'CUSTOMER',
          fullName: customerData.fullName,
          phoneNumber: customerData.phoneNumber,
        },
      });

      const customerProfile = await tx.customer.create({
        data: {
          userId: user.id,
          address: customerData.address || null,
          city: customerData.city || null,
          pincode: customerData.pincode || null,
          propertyType: customerData.propertyType || null,
          kitchenDimensions: customerData.kitchenDimensions || null,
          estimatedBudget: customerData.estimatedBudget ? parseFloat(customerData.estimatedBudget) : null,
          preferredStyle: customerData.preferredStyle || null,
          preferredMaterials: customerData.preferredMaterials || null,
          leadSource: customerData.leadSource || 'Showroom Walk-in',
          requirementsNotes: customerData.requirementsNotes || null,
        },
      });

      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'CUSTOMER_REGISTERED',
            entityType: 'CUSTOMER',
            entityId: customerProfile.id,
            details: `Registered customer ${user.fullName} (${user.email})`,
          },
        });
      }

      return { user, customerProfile };
    });

    // Send welcome notification
    await sendEmail({
      to: result.user.email,
      subject: 'Welcome to CKTracker Modular Kitchens',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0f172a;">Welcome to CKTracker, ${result.user.fullName}!</h2>
          <p>Your modular kitchen customer portal has been registered successfully.</p>
          <p>You can track every stage of your dream kitchen, view 3D renders, approve quotations, and download invoices at any time.</p>
          <div style="background: #f8fafc; border-left: 4px solid #c59b27; padding: 12px; margin: 20px 0;">
            <p><strong>Login Email:</strong> ${result.user.email}</p>
            <p><strong>Temporary Password:</strong> ${defaultPassword}</p>
          </div>
          <p>Please log in and update your password.</p>
        </div>
      `,
    });

    return result;
  }

  /**
   * Change user password securely
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new Error('Current password is incorrect.');

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await prisma.activityLog.create({
      data: {
        actorId: userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: userId,
        details: 'User successfully updated password',
      },
    });

    return { message: 'Password updated successfully.' };
  }

  /**
   * Request password reset token
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return success anyway to avoid user enumeration
      return { message: 'If this email is registered, a password reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await sendEmail({
      to: user.email,
      subject: 'CKTracker - Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h3>Password Reset</h3>
          <p>A password reset was requested for your CKTracker account.</p>
          <p>Your reset token is: <strong>${resetToken}</strong></p>
          <p>This token expires in 1 hour.</p>
        </div>
      `,
    });

    return { message: 'If this email is registered, a password reset link has been sent.' };
  }

  /**
   * Reset password with valid token
   */
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  /**
   * Fetch current authenticated profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        phoneNumber: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        customerProfile: {
          include: {
            projects: {
              select: {
                id: true,
                projectCode: true,
                title: true,
                status: true,
                currentStageNumber: true,
              },
            },
          },
        },
        employeeProfile: true,
      },
    });

    if (!user) throw new Error('User not found.');
    return user;
  }
}

module.exports = new AuthService();
