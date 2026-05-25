const supabase = require('../supabaseClient');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: employee } = await supabase
      .from('employees')
      .select('*, roles(name)')
      .eq('auth_user_id', req.user.id)
      .single();

    if (!employee) {
      return res.status(403).json({ error: 'Employee record not found' });
    }

    req.employee = employee;
    const userRole = employee.roles?.name;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
