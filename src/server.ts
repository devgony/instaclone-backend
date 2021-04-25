require("dotenv").config(); // should be on top of code
import * as express from "express";
import * as logger from "morgan";
import { ApolloServer } from "apollo-server-express";
import { resolvers, typeDefs } from "./schema";
import { getUser } from "./users/users.utils";
import client from "./client";

const PORT = process.env.PORT;
const apollo = new ApolloServer({
  resolvers,
  typeDefs,
  // schema,
  context: async ({ req }) => ({
    loggedInUser: await getUser(req.headers.token),
    client,
  }),
});

// order of middle ware is important (logger should be earlier than apollo)
const app = express();
app.use(logger("tiny"));
app.use("/static", express.static("uploads"));
apollo.applyMiddleware({ app });

app.listen({ port: PORT }, () =>
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
);
