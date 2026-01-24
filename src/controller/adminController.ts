import { Request, Response } from "express";
import { AdminService } from "../services/AdminService";

export class AdminController {
  constructor(private adminService: AdminService) {}

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
getProducers = async (req: Request, res: Response) => {
  try {
    const producers = await this.adminService.getAllProducers();
    return res.status(200).json(producers);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

getConsumers = async (req: Request, res: Response) => {
  try {
    const consumers = await this.adminService.getAllConsumers();
    return res.status(200).json(consumers);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};  

}
