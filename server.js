require("dotenv").config(); // should be on top of code
import { ApolloServer } from "apollo-server";
import schema from "./schema";

const server = new ApolloServer({ schema });

const PORT = process.env.PORT;

server
  .listen(PORT)
  .then(() => console.log(`🚀 Server is running on http://localhost:${PORT}`));
