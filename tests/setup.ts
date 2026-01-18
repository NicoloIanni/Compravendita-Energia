import { execSync } from "child_process";

beforeAll(() => {
  console.log("🔧 Reset DB, migrations, seed (TEST ENV)");

  execSync("npm run db:reset", { stdio: "inherit" });
  execSync("npm run db:migrate", { stdio: "inherit" });
  execSync("npm run db:seed", { stdio: "inherit" });
});
