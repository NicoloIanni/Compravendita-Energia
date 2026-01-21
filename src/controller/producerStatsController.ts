import { Request, Response, NextFunction } from "express";

import { producerStatsService } from "../container";

export const getProducerEarnings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const producerProfileId = req.user?.profileId;
    if (!producerProfileId) {
      return res.status(403).json({ error: "Producer profile missing" });
    }

    const { from, to } = req.query;

    const result = await producerStatsService.getEarnings({
      producerProfileId,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getProducerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const producerProfileId = req.user?.profileId;
    if (!producerProfileId) {
      return res.status(403).json({ error: "Producer profile missing" });
    }

    const { from, to } = req.query;

    const result = await producerStatsService.getStats({
      producerProfileId,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};
