/**
 * AdminController
 *
 * Controller basato su classe (a differenza degli altri che esportano funzioni).
 * Espone operazioni riservate ad admin:
 * - creare producer
 * - creare consumer
 * - listare producer
 * - listare consumer
 */

import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/AdminService";

export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  /**
   * POST /admin/producers
   * Crea un producer con tutti i campi richiesti
   */
  createProducer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await this.adminService.createProducer(req.body);

      return res.status(201).json({
        message: "Producer creato correttamente",
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /admin/consumers
   * Crea un consumer con credito iniziale
   */
  createConsumer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await this.adminService.createConsumer(req.body);

      return res.status(201).json({
        message: "Consumer creato correttamente",
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /admin/producers
   * Lista tutti i producer
   */
  getProducers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const producers = await this.adminService.getAllProducers();
      return res.status(200).json(producers);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /admin/consumers
   * Lista tutti i consumer
   */
  getConsumers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const consumers = await this.adminService.getAllConsumers();
      return res.status(200).json(consumers);
    } catch (err) {
      next(err);
    }
  };
}
