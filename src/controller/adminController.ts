/**
 * AdminController
 *
 * Controller basato su classe (a differenza degli altri che esportano funzioni).
 * Espone operazioni tipicamente riservate ad admin:
 * - creare producer
 * - creare consumer
 * - listare producer/consumer
 *
 * Nota: Gli errori con try/catch e res.status(400),
 * mentre negli altri controller delegate al middleware errorHandler.
 * Non è “sbagliato”, ma è incoerente.
 */

import { Request, Response } from "express";
import { AdminService } from "../services/AdminService";

export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * POST /admin/producers
   * Crea un producer con tutti i campi richiesti (energyType, co2, ecc.)
   */
  createProducer = async (req: Request, res: Response) => {
    try {
      await this.adminService.createProducer(req.body);

      return res.status(201).json({
        message: "Producer creato correttamente",
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

 /**
   * POST /admin/consumers
   * Crea un consumer con credito iniziale.
   */
  createConsumer = async (req: Request, res: Response) => {
    try {
      await this.adminService.createConsumer(req.body);

      return res.status(201).json({
        message: "Consumer creato correttamente",
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

    /**
   * GET /admin/producers
   * Lista producer.
   */
getProducers = async (req: Request, res: Response) => {
  try {
    const producers = await this.adminService.getAllProducers();
    return res.status(200).json(producers);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

  /**
   * GET /admin/consumers
   * Lista consumer.
   */
getConsumers = async (req: Request, res: Response) => {
  try {
    const consumers = await this.adminService.getAllConsumers();
    return res.status(200).json(consumers);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};  

}
