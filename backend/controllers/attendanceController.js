const { Op } = require('sequelize');
const { Attendance, Employee, SalaryStructure, LeaveRequest } = require('../models');

async function checkIn(req, res) {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'User is not linked to an employee profile.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if attendance already exists for today
    let attendance = await Attendance.findOne({
      where: { employeeId, date: todayStr }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: todayStr,
      });
    }

    attendance.checkIn = new Date();
    attendance.status = 'present'; // Temporary status while active
    await attendance.save();

    return res.status(200).json({
      message: 'Checked in successfully.',
      attendance,
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    return res.status(500).json({ message: 'Internal server error during check-in.' });
  }
}

async function checkOut(req, res) {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'User is not linked to an employee profile.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      where: { employeeId, date: todayStr }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Cannot check out: No check-in record found for today.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today.' });
    }

    const checkInTime = new Date(attendance.checkIn);
    const checkOutTime = new Date();

    // Calculate work hours as decimal
    const diffMs = checkOutTime - checkInTime;
    const workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Get salary structure to find standard work hours per day
    const salary = await SalaryStructure.findOne({ where: { employeeId } });
    const standardHours = salary ? parseFloat(salary.workingHoursPerDay) : 8.0;

    // Calculate status and extra hours
    let status = 'present';
    const halfDayThreshold = standardHours * 0.5;

    if (workHours < halfDayThreshold) {
      status = 'half_day';
    }

    const extraHours = Math.max(0, workHours - standardHours);

    attendance.checkOut = checkOutTime;
    attendance.workHours = workHours;
    attendance.extraHours = parseFloat(extraHours.toFixed(2));
    attendance.status = status;

    await attendance.save();

    return res.status(200).json({
      message: 'Checked out successfully.',
      attendance,
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    return res.status(500).json({ message: 'Internal server error during check-out.' });
  }
}

async function getAttendanceLogs(req, res) {
  try {
    const { employeeId, date } = req.query;
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    // If employee, they can only view their own logs
    if (!isAdminOrHr && employeeId && parseInt(employeeId) !== req.user.employeeId) {
      return res.status(403).json({ message: 'Access denied: You can only query your own logs.' });
    }

    const filterDate = date || new Date().toISOString().split('T')[0];
    const whereClause = { date: filterDate };

    if (!isAdminOrHr) {
      // Force filter to self
      whereClause.employeeId = req.user.employeeId;
    } else if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const logs = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobPosition', 'profilePicUrl'] }
      ]
    });

    if (isAdminOrHr && !employeeId) {
      // Return a complete list of all employees with their attendance for this date (default to 'absent' if not present)
      const allEmployees = await Employee.findAll({
        attributes: ['id', 'firstName', 'lastName', 'jobPosition', 'profilePicUrl']
      });

      const logMap = new Map(logs.map(l => [l.employeeId, l]));

      // Query active leaves for this date
      const activeLeaves = await LeaveRequest.findAll({
        where: {
          status: 'approved',
          startDate: { [Op.lte]: filterDate },
          endDate: { [Op.gte]: filterDate }
        }
      });
      const leaveMap = new Map(activeLeaves.map(l => [l.employeeId, l]));

      const fullLogs = allEmployees.map(emp => {
        if (logMap.has(emp.id)) {
          return logMap.get(emp.id);
        }
        const hasLeave = leaveMap.has(emp.id);
        return {
          id: `temp-${emp.id}`,
          employeeId: emp.id,
          date: filterDate,
          checkIn: null,
          checkOut: null,
          workHours: 0.00,
          extraHours: 0.00,
          status: hasLeave ? 'leave' : 'absent',
          employee: emp
        };
      });

      return res.status(200).json(fullLogs);
    }

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getMyAttendanceSummary(req, res) {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'User is not linked to an employee profile.' });
    }

    const { from, to } = req.query;

    const startDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = to || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // Find attendances
    const logs = await Attendance.findAll({
      where: {
        employeeId,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    });

    // Summary counters
    let daysPresent = 0;
    let daysHalfDay = 0;
    let daysAbsent = 0;
    let totalWorkHours = 0.0;

    logs.forEach(log => {
      totalWorkHours += parseFloat(log.workHours || 0);
      if (log.status === 'present') daysPresent++;
      else if (log.status === 'half_day') daysHalfDay++;
      else if (log.status === 'absent') daysAbsent++;
    });

    // Query approved leave requests within range
    const leaveRequests = await LeaveRequest.findAll({
      where: {
        employeeId,
        status: 'approved',
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } }
        ]
      }
    });

    let leavesTaken = 0.0;
    leaveRequests.forEach(req => {
      leavesTaken += parseFloat(req.allocationDays);
    });

    return res.status(200).json({
      logs,
      summary: {
        daysPresent,
        daysHalfDay,
        daysAbsent,
        leavesTaken,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      }
    });
  } catch (error) {
    console.error('Error fetching own attendance summary:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  checkIn,
  checkOut,
  getAttendanceLogs,
  getMyAttendanceSummary,
};
