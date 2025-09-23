import { skip } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma.js';

// Create a new assignment
const createAssignment = async (req, res, next) => {
  try {
    const { stationId, staffId } = req.body;

    if (!stationId || !staffId) {
      return res.status(400).json({
        success: false,
        message: 'stationId and staffId are required',
      });
    }

    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!station || !staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Station or Staff not found' });
    }

    const existingAssignment = await prisma.stationStaff.findFirst({
      where: { stationId, userId: staffId },
    });

    if (existingAssignment) {
      return res
        .status(409)
        .json({ success: false, message: 'Assignment already exists' });
    }

    const assignment = await prisma.stationStaff.create({
      data: {
        station: { connect: { id: stationId } },
        user: { connect: { id: staffId } },
      },
      select: {
        id: true,
        station: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    next(error);
  }
};

// Get all assignments
const getAssignments = async (req, res, next) => {
  try {
    const assignments = await prisma.stationStaff.findMany();

    if (assignments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No assignments found' });
    }

    return res.status(200).json({ assignments });
  } catch (error) {
    next(error);
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.stationStaff.findUnique({ where: { id } });

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found' });
    }

    return res.status(200).json({ assignment });
  } catch (error) {
    next(error);
  }
};

// Update assignment by ID
const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stationId, staffId } = req.body;

    await prisma.stationStaff.update({
      where: { id },
      data: {
        stationId: stationId || skip,
        userId: staffId || skip,
      },
    });

    return res.status(200).json({ message: 'Assignment updated' });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.stationStaff.findUnique({ where: { id } });

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found' });
    }

    await prisma.stationStaff.delete({ where: { id } });

    return res
      .status(200)
      .json({ data: assignment, message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
};

export {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
};
