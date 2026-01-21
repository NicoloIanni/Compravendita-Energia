import { Request, Response, NextFunction } from "express";
import { settlementService } from "../container";

/**
 * POST /producers/me/requests/resolve?date=YYYY-MM-DD
 *
 * Risolve le richieste PENDING per il produttore autenticato.
 * La transaction è gestita internamente dal SettlementService.
 */
export const resolveProducerRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const producerProfileId = req.user?.profileId;
    const { date } = req.query;

    if (!producerProfileId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!date || typeof date !== "string") {
        return res.status(400).json({ message: "Missing or invalid date" });
    }

    try {
        const result = await settlementService.resolveDay(
            producerProfileId,
            date
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};