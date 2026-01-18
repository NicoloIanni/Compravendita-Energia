import dotenv from "dotenv";
dotenv.config();
import app  from './app';
import { env } from './config/env';
import { sequelize } from './db';

async function bootstrap() {
  await sequelize.authenticate(); // fail fast se DB non raggiungibile
  console.log('DB connected');

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`API listening on 0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((e) => {
  console.error('Startup failed:', e);
  process.exit(1);
});
