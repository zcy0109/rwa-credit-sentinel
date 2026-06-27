import dotenv from "dotenv";
import { runCasperRealModePreflight } from "../src/index.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

try {
  const result = await runCasperRealModePreflight();
  console.log(JSON.stringify(result, null, 2));

  if (!result.hasSufficientBalance) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}
