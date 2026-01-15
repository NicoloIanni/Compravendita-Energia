import request from "supertest";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

import app from "../../src/app";
import { sequelize } from "../../src/db";
import { User } from "../../src/models";

describe("POST /auth/login", () => {
  const password = "Password123!";

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      email: "test@example.com",
      passwordHash,
      role: "consumer",
    } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("login con credenziali corrette → 200 + accessToken", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    const secret = process.env.JWT_SECRET;
    expect(typeof secret).toBe("string"); // se manca, lo vedi subito

    const payload: any = jwt.verify(res.body.accessToken, secret as string);

    expect(payload.userId).toBeGreaterThan(0);
    expect(payload.role).toBe("consumer");
  });

  it("login con password sbagliata → 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("login con email inesistente → 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "noone@example.com", password });

    expect(res.status).toBe(401);
  });

  it("body incompleto → 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
  });
});
