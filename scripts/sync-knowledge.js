import "dotenv/config";
import { spawn } from "node:child_process";
import { isEmbeddingConfigured } from "../src/embeddings.js";
import { supabase } from "../src/supabase.js";

const shouldSyncEmbeddings = process.env.SYNC_EMBEDDINGS !== "false";

async function main() {
  await runStep("sync:voom", ["node", "scripts/sync-line-voom.js"]);
  await runStep("sync:official", ["node", "scripts/sync-official-website.js"]);

  if (shouldSyncEmbeddings && supabase && isEmbeddingConfigured()) {
    await runStep("sync:embeddings", ["node", "scripts/sync-embeddings.js"]);
  } else {
    console.log(
      "Skipped sync:embeddings. Set OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and keep SYNC_EMBEDDINGS!=false to enable it."
    );
  }
}

function runStep(label, command) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${label}...`);
    const child = spawn(command[0], command.slice(1), {
      stdio: "inherit",
      env: process.env
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
