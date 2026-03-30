import { db, negotiationsTable } from "../src/index";
import { desc } from "drizzle-orm";

async function check() {
  console.log("Checking negotiations...");
  const results = await db.select().from(negotiationsTable).orderBy(desc(negotiationsTable.id)).limit(5);
  
  results.forEach(n => {
    console.log(`\nNegotiation ID: ${n.id}`);
    console.log(`Status: ${n.status}`);
    console.log(`Rounds: ${n.rounds}`);
    console.log(`History length: ${Array.isArray(n.messageHistory) ? n.messageHistory.length : 'NOT AN ARRAY'}`);
    console.log(`History:`, JSON.stringify(n.messageHistory, null, 2));
  });
  
  process.exit(0);
}

check().catch(console.error);
