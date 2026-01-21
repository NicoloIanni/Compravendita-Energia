import { Request, Response, NextFunction } from "express";
import { consumerQueryService } from "../container";

export const getConsumerPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const consumerId = req.user?.userId;
    if (!consumerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { producerProfileId, energyType, from, to } = req.query;

    const result = await consumerQueryService.getPurchases({
      consumerId,
      producerProfileId: producerProfileId
        ? Number(producerProfileId)
        : undefined,
      energyType: energyType as string | undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getConsumerCarbon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const consumerId = req.user?.userId;
    if (!consumerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { from, to } = req.query;

    const result = await consumerQueryService.getCarbonFootprint({
      consumerId,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};
