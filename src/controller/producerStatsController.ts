/**
 * Producer Stats Controller
 *
 * Espone statistiche aggregate e guadagni del produttore.
 * Tutte le query sono filtrabili per intervallo temporale.
 *
 * Questo controller non fa calcoli:
 * - prepara input
 * - valida query
 * - delega tutto al Service Layer
 */

import { Request, Response, NextFunction } from "express";
import { producerStatsService } from "../container";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { registerFont } from "canvas";
import type { ChartConfiguration } from "chart.js";

registerFont(
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  { family: "DejaVu Sans" }
);

const chartCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 400,
  chartCallback: (ChartJS) => {
    ChartJS.defaults.font.family = "DejaVu Sans";
    ChartJS.defaults.font.size = 12;
  },
});

/**
 * GET /producers/me/earnings
 *
 * Calcola i guadagni del produttore in un intervallo temporale.
 *
 * Formula logica:
 * somma( allocatedKwh * pricePerKwh )
 *
 * Query params:
 * - from=YYYY-MM-DD
 * - to=YYYY-MM-DD
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
 *
 * Ritorna, per ogni fascia oraria:
 * - % minima di energia venduta
 * - % massima
 * - % media
 * - deviazione standard
 *
 * Query params:
 * - from=YYYY-MM-DD
 * - to=YYYY-MM-DD
 */
export const getMyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const producerProfileId = req.user!.profileId!;

    const { fromDate, toDate, fromHour, toHour } = req.query;

    let fromDt: Date | undefined;
    let toDt: Date | undefined;
    let fromHr: number | undefined;
    let toHr: number | undefined;

    // parse fromDate
    if (fromDate && typeof fromDate === "string") {
      fromDt = new Date(fromDate);
      if (isNaN(fromDt.getTime())) {
        return res.status(400).json({ error: "INVALID_fromDate_FORMAT" });
      }
    }

    // parse toDate
    if (toDate && typeof toDate === "string") {
      toDt = new Date(toDate);
      if (isNaN(toDt.getTime())) {
        return res.status(400).json({ error: "INVALID_toDate_FORMAT" });
      }
    }

    // parse fromHour
    if (fromHour !== undefined) {
      fromHr = Number(fromHour);
      if (Number.isNaN(fromHr) || fromHr < 0 || fromHr > 23) {
        return res.status(400).json({ error: "INVALID_fromHour_VALUE" });
      }
    }

    // parse toHour
    if (toHour !== undefined) {
      toHr = Number(toHour);
      if (Number.isNaN(toHr) || toHr < 0 || toHr > 23) {
        return res.status(400).json({ error: "INVALID_toHour_VALUE" });
      }
    }

    // check date range
    if (fromDt && toDt && fromDt > toDt) {
      return res.status(400).json({ error: "fromDate must be <= toDate" });
    }

    const stats = await producerStatsService.getStats({
      producerProfileId,
      fromDate: fromDt,
      toDate: toDt,
      fromHour: fromHr,
      toHour: toHr,
    });

    return res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};


/**
 * GET / producers / me / stats / chart
 *
 * Fornisce statistiche in formato PNG(con grafico a barre e linea)
 * Query param:
 * - fromDate, toDate
* - fromHour, toHour
*/
export const getMyStatsChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const producerProfileId = req.user!.profileId!;

    const { fromDate, toDate, fromHour, toHour } = req.query;

    let fromDt: Date | undefined;
    let toDt: Date | undefined;
    let fromHr: number | undefined;
    let toHr: number | undefined;

    // -----------------------
    // Parsing date
    // -----------------------
    if (fromDate && typeof fromDate === "string") {
      fromDt = new Date(fromDate);
      if (isNaN(fromDt.getTime())) {
        return res.status(400).json({ error: "INVALID_fromDate_FORMAT" });
      }
    }

    if (toDate && typeof toDate === "string") {
      toDt = new Date(toDate);
      if (isNaN(toDt.getTime())) {
        return res.status(400).json({ error: "INVALID_toDate_FORMAT" });
      }
    }

    // -----------------------
    // Parsing hour
    // -----------------------
    if (fromHour !== undefined) {
      fromHr = Number(fromHour);
      if (Number.isNaN(fromHr) || fromHr < 0 || fromHr > 23) {
        return res.status(400).json({ error: "INVALID_fromHour_VALUE" });
      }
    }

    if (toHour !== undefined) {
      toHr = Number(toHour);
      if (Number.isNaN(toHr) || toHr < 0 || toHr > 23) {
        return res.status(400).json({ error: "INVALID_toHour_VALUE" });
      }
    }

    // Validazione range date
    if (fromDt && toDt && fromDt > toDt) {
      return res.status(400).json({ error: "fromDate must be <= toDate" });
    }

    // -----------------------
    // Recupero statistiche
    // -----------------------
    const stats = await producerStatsService.getStats({
      producerProfileId,
      fromDate: fromDt,
      toDate: toDt,
      fromHour: fromHr,
      toHour: toHr,
    });

    // -----------------------
    // Costruzione dati chart
    // -----------------------
    const labels: string[] = [];
    const minValues: number[] = [];
    const avgValues: number[] = [];
    const maxValues: number[] = [];
    const stdValues: number[] = [];

    for (const dayStats of stats) {
      for (const h of dayStats.hours) {
        labels.push(`${dayStats.date} ${h.hour}:00`);
        minValues.push(h.minPercent);
        avgValues.push(h.avgPercent);
        maxValues.push(h.maxPercent);
        stdValues.push(h.stdDev);
      }
    }

    const config: any = {
      data: {
        labels,
        datasets: [
          {
            label: "% minima energia venduta",
            data: minValues,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            type: "bar",
          },
          {
            label: "% media energia venduta",
            data: avgValues,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            type: "bar",
          },
          {
            label: "% massima energia venduta",
            data: maxValues,
            backgroundColor: "rgba(255, 159, 64, 0.6)",
            type: "bar",
          },
          {
            label: "Deviazione standard",
            data: stdValues,
            borderColor: "rgba(153, 102, 255, 1)",
            backgroundColor: "rgba(153, 102, 255, 0.2)",
            fill: false,
            type: "line",
            tension: 0.4,
          },
        ],
      },
      options: {
        scales: {
          y: {
            title: { display: true, text: "%" },
            min: 0,
            max: 100,
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
