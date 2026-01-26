import "dotenv/config";
import request from "supertest";
import * as jwt from "jsonwebtoken";

import app from "../../src/app";
import { User } from "../../src/models";

// Test suite per l’endpoint di login
describe("POST /auth/login", () => {
  let consumer: User;

  // Prima di eseguire i test:
  // recupera dal database un utente consumer creato tramite seed
  beforeAll(async () => {
    const found = await User.findOne({
      where: { role: "consumer" },
    });

    // Se il seed non è presente, il test non può proseguire
    if (!found) {
      throw new Error("Seed consumer not found");
    }

    consumer = found;
  });

  // =========================
  // Caso OK: credenziali corrette
  // =========================
  it("login con credenziali corrette → 200 + accessToken", async () => {
    // Esegue la chiamata HTTP al login
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password: "consumer123",
      });

    // Verifica status HTTP
    expect(res.status).toBe(200);

    // Verifica che il token sia presente
    expect(res.body.accessToken).toBeDefined();

    // Recupera la chiave segreta JWT dall’ambiente
    const secret = process.env.JWT_SECRET;
    expect(secret).toBeDefined();

    // Decodifica e verifica il token JWT
    const payload: any = jwt.verify(
      res.body.accessToken,
      secret as string
    );

    // Verifica che il payload contenga i dati corretti
    expect(payload.userId).toBe(consumer.id);
    expect(payload.role).toBe("consumer");
  });

  // =========================
  // Caso NO: password errata
  // =========================
  it("login con password sbagliata → 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password: "wrong",
      });

    // Credenziali errate → Unauthorized
    expect(res.status).toBe(401);
  });

  // =========================
  // Caso NO: email inesistente
  // =========================
  it("login con email inesistente → 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "noone@example.com",
        password: "consumer123",
      });

    // Utente non trovato → Unauthorized
    expect(res.status).toBe(401);
  });

  // =========================
  // Caso NO: body incompleto
  // =========================
  it("body incompleto → 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: consumer.email });

    // Mancano campi obbligatori → Bad Request
    expect(res.status).toBe(400);
  });
});
