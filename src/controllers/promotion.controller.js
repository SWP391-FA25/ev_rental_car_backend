/**id                String             @id @default(auto()) @map("_id") @db.ObjectId
  code              String             @unique // Unique promotion code
  description       String?
  discount          Float // phần trăm hoặc số tiền (chọn 1 convention)
  validFrom         DateTime
  validUntil        DateTime
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  promotionBookings PromotionBooking[]

  @@index([validFrom, validUntil]) */
import { prisma } from '../lib/prisma.js';

// CREATE - Create a new promotion
const createPromotion = async (req, res, next) => {
  try {
    const { code, description, discount, validFrom, validUntil } = req.body;

    // Check if promotion code already exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { code },
    });

    if (existingPromotion) {
      return res.status(409).json({
        success: false,
        message: 'Promotion code already exists',
      });
    }

    // Create the promotion
    const promotion = await prisma.promotion.create({
      data: {
        code,
        description,
        discount,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get all promotions
const getPromotions = async (req, res, next) => {
  try {
    const promotions = await prisma.promotion.findMany({
      include: {
        promotionBookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (promotions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No promotions found',
      });
    }

    res.json({
      success: true,
      data: { promotions },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get promotion by ID
const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        promotionBookings: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get promotion by code
const getPromotionByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const promotion = await prisma.promotion.findUnique({
      where: { code },
      include: {
        promotionBookings: true,
      },
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    // Check if promotion is currently valid
    const now = new Date();
    const isValid = now >= promotion.validFrom && now <= promotion.validUntil;

    res.json({
      success: true,
      data: {
        promotion: {
          ...promotion,
          isCurrentlyValid: isValid,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get active promotions
const getActivePromotions = async (req, res, next) => {
  try {
    const now = new Date();

    const activePromotions = await prisma.promotion.findMany({
      where: {
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      include: {
        promotionBookings: true,
      },
      orderBy: { discount: 'desc' },
    });

    if (activePromotions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active promotions found',
      });
    }

    res.json({
      success: true,
      data: { promotions: activePromotions },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE - Update promotion
const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, description, discount, validFrom, validUntil } = req.body;

    // Check if promotion exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id },
    });

    if (!existingPromotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    // Check if new code already exists (if code is being updated)
    if (code && code !== existingPromotion.code) {
      const codeExists = await prisma.promotion.findUnique({
        where: { code },
      });

      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: 'Promotion code already exists',
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (discount !== undefined) updateData.discount = discount;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);

    const updatedPromotion = await prisma.promotion.update({
      where: { id },
      data: updateData,
      include: {
        promotionBookings: true,
      },
    });

    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: { promotion: updatedPromotion },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Delete promotion
const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if promotion exists
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        promotionBookings: true,
      },
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    // Check if promotion has active bookings
    if (promotion.promotionBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete promotion with active bookings',
      });
    }

    await prisma.promotion.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Promotion deleted successfully',
      data: {
        deletedPromotion: {
          id: promotion.id,
          code: promotion.code,
          description: promotion.description,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createPromotion,
  getPromotions,
  getPromotionById,
  getPromotionByCode,
  getActivePromotions,
  updatePromotion,
  deletePromotion,
};
