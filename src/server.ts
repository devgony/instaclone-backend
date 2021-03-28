require("dotenv").config(); // should be on top of code
import { ApolloServer } from "apollo-server";
import { resolvers, typeDefs } from "./schema";
import { getUser } from "./users/users.utils";
import client from "./client";

const server = new ApolloServer({
  resolvers,
  typeDefs,
  // schema,
  context: async ({ req }) => ({
    loggedInUser: await getUser(req.headers.token),
    client,
  }),
});

const PORT = process.env.PORT;

server
  .listen(PORT)
  .then(() => console.log(`🚀 Server is running on http://localhost:${PORT}`));
