import request from "supertest";
import * as jwt from "jsonwebtoken";

import app from "../../src/app";
import { User } from "../../src/models";

describe("POST /auth/login", () => {
  let consumer: User;

  beforeAll(async () => {
    // utente già creato dal seed
    const found = await User.findOne({
      where: { role: "consumer" },
    });

    if (!found) {
      throw new Error("Seed consumer not found");
    }
    consumer = found;
  });

  it("login con credenziali corrette → 200 + accessToken", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password: "consumer123", // password del seed
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    const secret = process.env.JWT_SECRET;
    expect(secret).toBeDefined();

    const payload: any = jwt.verify(
      res.body.accessToken,
      secret as string
    );

    expect(payload.userId).toBe(consumer.id);
    expect(payload.role).toBe("consumer");
  });

  it("login con password sbagliata → 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password: "wrong",
      });

    expect(res.status).toBe(401);
  });

  it("login con email inesistente → 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "noone@example.com",
        password: "consumer123",
      });

    expect(res.status).toBe(401);
  });

  it("body incompleto → 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: consumer.email });

    expect(res.status).toBe(400);
  });
});
