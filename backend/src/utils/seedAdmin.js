import connectDatabase from "../config/db.js";
import { ensureDefaultAdmin } from "./adminBootstrap.js";

const run = async () => {
  try {
    await connectDatabase();
    await ensureDefaultAdmin();
    console.log("Admin seed completed.");
    process.exit(0);
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exit(1);
  }
};

run();
