import "dotenv/config";
import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT ?? 8787);

app.listen(port, () => {
  console.log(`RWA Credit Sentinel API listening on http://localhost:${port}`);
});
