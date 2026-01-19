import { Request, Response, NextFunction } from "express";
import type { Transaction } from "sequelize";
import { sequelize } from "../db";
import { producerSlotService } from "../services/producerSlotServiceInstance";

function getProducerProfileId(req: Request): number {
  if (!req.user?.profileId) {
    const err = new Error("Producer profile missing");
    (err as any).status = 403;
    throw err;
  }
  return req.user.profileId;
}

export const patchCapacity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body: any[] = req.body;

  if (!Array.isArray(body)) {
    return res.status(400).json({
      error: "Request body must be an array of slots",
    });
  }

  let t: Transaction | null = null;

  try {
    const profileId = getProducerProfileId(req);

    t = await sequelize.transaction();

    await producerSlotService.batchUpdateCapacity(profileId, body, {
      transaction: t,
    });

    await t.commit();
    res.status(200).json({ success: true });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

export const patchPrice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body: any[] = req.body;

  if (!Array.isArray(body)) {
    return res.status(400).json({
      error: "Request body must be an array of slots",
    });
  }

  let t: Transaction | null = null;

  try {
    const profileId = getProducerProfileId(req);

    t = await sequelize.transaction();

    await producerSlotService.batchUpdatePrice(profileId, body, {
      transaction: t,
    });

    await t.commit();
    res.status(200).json({ success: true });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};
