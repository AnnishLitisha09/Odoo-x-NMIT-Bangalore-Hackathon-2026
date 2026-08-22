const { Op } = require('sequelize');
const { LeaveRequest, LeaveBalance, Employee, PublicHoliday, User } = require('../models');

async function applyLeave(req, res) {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'User is not linked to an employee profile.' });
    }

    const { type, startDate, endDate, allocationDays, remarks } = req.body;
    let attachmentUrl = null;

    if (req.file) {
      // Setup file upload path
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    if (!type || !startDate || !endDate) {
      return res.status(400).json({ message: 'Type, start date, and end date are required.' });
    }

    // Attachment validation: medical certificate required for sick leave
    if (type === 'sick' && !attachmentUrl) {
      return res.status(400).json({ message: 'Medical certificate attachment is required for sick leave.' });
    }

    // Calculate auto allocation days count if not provided
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start date or end date format.' });
    }

    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
    }

    const diffTime = Math.abs(end - start);
    const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const daysCount = allocationDays ? parseFloat(allocationDays) : calculatedDays;

    // Check balance if paid or sick
    if (type !== 'unpaid') {
      const balance = await LeaveBalance.findOne({
        where: { employeeId, year: new Date(startDate).getFullYear() }
      });

      if (!balance) {
        return res.status(400).json({ message: 'No leave balance record found for this year.' });
      }

      if (type === 'paid' && parseFloat(balance.paidDaysAvailable) < daysCount) {
        return res.status(400).json({ message: `Insufficient paid leaves. Available: ${balance.paidDaysAvailable} days.` });
      }

      if (type === 'sick' && parseFloat(balance.sickDaysAvailable) < daysCount) {
        return res.status(400).json({ message: `Insufficient sick leaves. Available: ${balance.sickDaysAvailable} days.` });
      }
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId,
      type,
      startDate,
      endDate,
      allocationDays: daysCount,
      attachmentUrl,
      remarks,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leaveRequest,
    });
  } catch (error) {
    console.error('Error applying for leave:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getLeaveRequests(req, res) {
  try {
    const { employeeId, status, type } = req.query;
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    const whereClause = {};

    if (!isAdminOrHr) {
      // Force filter to self
      whereClause.employeeId = req.user.employeeId;
    } else if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    const requests = await LeaveRequest.findAll({
      where: whereClause,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobPosition', 'profilePicUrl'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function reviewLeaveRequest(req, res) {
  const { id } = req.params;
  const { action, reviewerComment } = req.body; // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be approve or reject.' });
  }

  try {
    const request = await LeaveRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Leave request has already been ${request.status}.` });
    }

    const year = new Date(request.startDate).getFullYear();

    if (action === 'approve') {
      // Deduct balance
      if (request.type !== 'unpaid') {
        const balance = await LeaveBalance.findOne({
          where: { employeeId: request.employeeId, year }
        });

        if (!balance) {
          return res.status(400).json({ message: 'Employee leave balance record not found for this year.' });
        }

        const allocation = parseFloat(request.allocationDays);

        if (request.type === 'paid') {
          if (parseFloat(balance.paidDaysAvailable) < allocation) {
            return res.status(400).json({ message: 'Insufficient paid leave balance to approve.' });
          }
          balance.paidDaysAvailable = parseFloat((parseFloat(balance.paidDaysAvailable) - allocation).toFixed(1));
        } else if (request.type === 'sick') {
          if (parseFloat(balance.sickDaysAvailable) < allocation) {
            return res.status(400).json({ message: 'Insufficient sick leave balance to approve.' });
          }
          balance.sickDaysAvailable = parseFloat((parseFloat(balance.sickDaysAvailable) - allocation).toFixed(1));
        }

        await balance.save();
      }

      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    request.reviewerId = req.user.id;
    request.reviewerComment = reviewerComment || null;
    await request.save();

    return res.status(200).json({
      message: `Leave request successfully ${request.status}.`,
      request,
    });
  } catch (error) {
    console.error('Error reviewing leave request:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getMyLeaveBalance(req, res) {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'User is not linked to an employee profile.' });
    }

    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      where: { employeeId, year: currentYear }
    });

    // If balance for current year does not exist, auto-create it
    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId,
        paidDaysAvailable: 24.0,
        sickDaysAvailable: 7.0,
        year: currentYear
      });
    }

    return res.status(200).json(balance);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getHolidays(req, res) {
  try {
    const holidays = await PublicHoliday.findAll({
      order: [['date', 'ASC']]
    });
    return res.status(200).json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getAllLeaveBalances(req, res) {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const balances = await LeaveBalance.findAll({
      where: { year: targetYear },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'jobPosition', 'department', 'profilePicUrl']
      }],
      order: [[{ model: Employee, as: 'employee' }, 'firstName', 'ASC']]
    });
    return res.status(200).json(balances);
  } catch (error) {
    console.error('Error fetching all leave balances:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateLeaveBalance(req, res) {
  try {
    const { employeeId } = req.params;
    const { paidDaysAvailable, sickDaysAvailable, year } = req.body;
    const targetYear = parseInt(year) || new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ where: { employeeId, year: targetYear } });
    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId,
        paidDaysAvailable: paidDaysAvailable ?? 24.0,
        sickDaysAvailable: sickDaysAvailable ?? 7.0,
        year: targetYear
      });
    } else {
      if (paidDaysAvailable !== undefined) balance.paidDaysAvailable = parseFloat(paidDaysAvailable);
      if (sickDaysAvailable !== undefined) balance.sickDaysAvailable = parseFloat(sickDaysAvailable);
      await balance.save();
    }
    return res.status(200).json({ message: 'Leave balance updated.', balance });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  applyLeave,
  getLeaveRequests,
  reviewLeaveRequest,
  getMyLeaveBalance,
  getHolidays,
  getAllLeaveBalances,
  updateLeaveBalance,
};
