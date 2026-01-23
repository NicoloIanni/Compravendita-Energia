import { Request, Response, NextFunction } from "express";
import { producerStatsService } from "../container";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const width = 800;
const height = 400;
const chartCanvas = new ChartJSNodeCanvas({ width, height });

/**
 * GET /producers/me/earnings
 */
export const getMyEarnings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
 * → statistiche GIORNALIERE
 */
export const getMyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const stats = await producerStatsService.getStats({
      producerProfileId,
      from: fromDate,
      to: toDate,
    });

    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /producers/me/stats/chart
 * → grafico PNG per GIORNO (avgPercent)
 */
export const getMyStatsChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const producerProfileId = req.user!.profileId!;
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
    }

    const stats = await producerStatsService.getStats({
      producerProfileId,
      from: new Date(date),
      to: new Date(date),
    });

    const dayStats = stats.find(s => s.date === date);
    if (!dayStats) {
      return res.status(404).json({ error: "No data for this date" });
    }

    const labels = dayStats.hours.map(h => `${h.hour}:00`);
    const avgValues = dayStats.hours.map(h => h.avgPercent);

    const config = {
      type: "bar" as const,
      data: {
        labels,
        datasets: [
          {
            label: "% media energia venduta",
            data: avgValues,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
        ],
      },
      options: {
        scales: {
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: "%",
            },
          },
        },
      },
    };

    const image = await chartCanvas.renderToBuffer(config);

    res.setHeader("Content-Type", "image/png");
    res.send(image);
  } catch (err) {
    next(err);
  }
};