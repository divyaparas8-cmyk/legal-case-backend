const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/jwt');

const login = async (credentials) => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: {
      roles: true
    }
  });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.is_active) {
    const error = new Error('Account is deactivated');
    error.statusCode = 403;
    throw error;
  }

  // Fallback if migration hasn't completed or new user has no UserRole records
  const userRoles = user.roles?.length > 0 ? user.roles.map(r => r.role) : [user.role];

  const token = generateToken({ id: user.id, roles: userRoles });
  
  // Record last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() }
  });
  
  const { password_hash: _, roles: __, ...userWithoutPassword } = user;
  userWithoutPassword.roles = userRoles;
  
  return { user: userWithoutPassword, token };
};

const register = async (userData) => {
  const { email, password, full_name, role } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      full_name,
      role: role || 'client',
    },
  });

  const token = generateToken({ id: user.id, role: user.role });
  
  const { password_hash: _, ...userWithoutPassword } = user;
  
  return { user: userWithoutPassword, token };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  // Validate new password
  if (newPassword.length < 4) {
    const error = new Error('New password must be at least 4 characters long');
    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('New password cannot be the same as the current password');
    error.statusCode = 400;
    throw error;
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      password_hash,
      must_reset_password: false,
    },
  });

  return { success: true, message: 'Password updated successfully' };
};

const updateSignature = async (userId, signature) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { signature },
    select: { id: true, signature: true }
  });
};

const verifyInvite = async (token) => {
  const user = await prisma.user.findFirst({
    where: {
      invite_token: token,
      invite_token_expires: { gte: new Date() }
    }
  });

  if (!user) {
    const error = new Error('This invitation link is invalid or has expired. Please contact our office.');
    error.statusCode = 410;
    throw error;
  }

  // Activate and verify email
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      invite_token: null,
      invite_token_expires: null,
      is_active: true,
    }
  });

  const tokenJWT = generateToken({ id: updatedUser.id, roles: [updatedUser.role] });

  // Audit activity log
  await prisma.activity.create({
    data: {
      actor_user_id: updatedUser.id,
      entity_type: 'client',
      entity_id: updatedUser.id,
      action: 'portal_activated',
      description: `Client activated portal account: ${updatedUser.email}`
    }
  });

  const { password_hash: _, ...userWithoutPassword } = updatedUser;
  return { user: userWithoutPassword, token: tokenJWT };
};

const requestMagicLink = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  // Security note: Do not throw if user not found to prevent email scanning. Return success always.
  if (!user || user.role !== 'client' || !user.is_active) {
    return { success: true, message: 'If the email exists, a login link has been sent.' };
  }

  const crypto = require('crypto');
  const loginToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15-minute token lifetime

  await prisma.user.update({
    where: { id: user.id },
    data: {
      magic_link_token: loginToken,
      magic_link_expires: expires
    }
  });

  // Outward dispatch link
  console.log(`[Email Dispatch] Transactional Portal Login Link: http://localhost:5173/login/verify?token=${loginToken}`);

  return { success: true, message: 'If the email exists, a login link has been sent.' };
};

const verifyMagicLink = async (token) => {
  const user = await prisma.user.findFirst({
    where: {
      magic_link_token: token,
      magic_link_expires: { gte: new Date() }
    }
  });

  if (!user) {
    const error = new Error('Your secure login link is invalid or has expired. Please request a new link.');
    error.statusCode = 401;
    throw error;
  }

  // Clear token and update verification status
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      magic_link_token: null,
      magic_link_expires: null,
      email_verified: true, // Auto verify email on magic link click
    }
  });

  const tokenJWT = generateToken({ id: updatedUser.id, roles: [updatedUser.role] });

  // Audit activity log - Portal view login event
  await prisma.activity.create({
    data: {
      actor_user_id: updatedUser.id,
      entity_type: 'client',
      entity_id: updatedUser.id,
      action: 'portal_login',
      description: `Client logged in to portal: ${updatedUser.email}`
    }
  });

  const { password_hash: _, ...userWithoutPassword } = updatedUser;
  return { user: userWithoutPassword, token: tokenJWT };
};

module.exports = {
  login,
  register,
  changePassword,
  updateSignature,
  verifyInvite,
  requestMagicLink,
  verifyMagicLink
};
