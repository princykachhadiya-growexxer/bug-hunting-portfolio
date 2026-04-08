const User = require('../models/User');
const Report = require('../models/Report');

// Velox User Management Controller
// Handles CRUD, reporting, and admin operations

const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, department, role, sortBy = 'createdAt' } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search } },
      { email: { $regex: search } }
    ];
  }

  const users = await User.find(filter)
    .sort({ [sortBy]: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.json({ users, total, page, limit });
};

const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ user });
};

const createUser = async (req, res) => {
  const userData = req.body;
  const user = new User(userData);
  await user.save();
  res.status(201).json({ message: 'User created', user });
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await User.findByIdAndUpdate(id, updates, { new: true });
  res.json({ message: 'User updated', user });
};


const deleteUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  res.json({ message: 'User deactivated', user });
};

const changeRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );
  res.json({ message: 'Role updated', user });
};

const getUserActivity = async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Placeholder — activity log not yet implemented
  res.json({ activity: [] });
};

const getReports = async (req, res) => {
  const reports = await Report.find({ isPublic: true });
  res.json({ reports });
};

const getSummary = async (req, res) => {
  const { startDate, endDate, department } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (startDate) filter.createdAt = { $gte: startDate };
  if (endDate) filter.createdAt = { ...filter.createdAt, $lte: endDate };

  const totalUsers = await User.countDocuments(filter);
  const activeUsers = await User.countDocuments({ ...filter, isActive: true });

  const allUsers = await User.find(filter);
  const byRole = allUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  res.json({ totalUsers, activeUsers, byRole });
};

const generateReport = async (req, res) => {
  const { title, type, filters } = req.body;

  const report = new Report({
    title,
    type,
    filters,
    generatedBy: req.user.id,
    status: 'generating'
  });

  await report.save();

  // Kick off async generation
  // generateReportAsync(report._id, filters);

  res.json({ message: 'Report queued', reportId: report._id });
};

const getReportById = async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report.isPublic && report.generatedBy !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({ report });
};

const deleteReport = async (req, res) => {
  await Report.findByIdAndDelete(req.params.id);
  res.json({ message: 'Report deleted' });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeRole,
  getUserActivity,
  getReports,
  getSummary,
  generateReport,
  getReportById,
  deleteReport
};
