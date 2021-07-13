import { PrismaClient } from "@prisma/client";

const client = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});
client.$on("query", async e => {
  console.log(`${e.query} ${e.params}`);
});
export default client;
