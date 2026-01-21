import { Request, Response, NextFunction } from "express";
import { producerStatsService } from "../container";

/**
 * GET /producers/me/earnings
 */
export const getMyEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const producerProfileId = req.user!.profileId!;
    const { from, to } = req.query;

    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    if (
      (from && isNaN(fromDate!.getTime())) ||
      (to && isNaN(toDate!.getTime()))
    ) {
      return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
    }

    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({ error: "`from` must be <= `to`" });
    }

    const result = await producerStatsService.getEarnings({
      producerProfileId,
      from: fromDate,
      to: toDate,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /producers/me/stats
 */
export const getMyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const producerProfileId = req.user!.profileId!;
    const { from, to } = req.query;

    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    if (
      (from && isNaN(fromDate!.getTime())) ||
      (to && isNaN(toDate!.getTime()))
    ) {
      return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
    }

    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({ error: "`from` must be <= `to`" });
    }

    const result = await producerStatsService.getStats({
      producerProfileId,
      from: fromDate,
      to: toDate,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};