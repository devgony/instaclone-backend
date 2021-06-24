require("dotenv").config(); // should be on top of code
import * as express from "express";
import * as logger from "morgan";
import { ApolloServer } from "apollo-server-express";
import { resolvers, typeDefs } from "./schema";
import { getUser } from "./users/users.utils";
import client from "./client";
import pubsub from "./pubsub";
import * as http from "http";
import { graphqlUploadExpress } from "graphql-upload";
const cors = require("cors");

const PORT = process.env.PORT;
const apollo = new ApolloServer({
  resolvers,
  typeDefs,
  playground: true,
  introspection: true,
  // schema,
  context: async ctx => {
    if (ctx.req) {
      // when resolver is using http
      return {
        loggedInUser: await getUser(ctx.req.headers.token),
        client,
      };
    } else {
      // when resolver is using ws
      const {
        connection: { context },
      } = ctx;
      return {
        loggedInUser: context.loggedInUser,
      };
    }
  },
  subscriptions: {
    onConnect: async ({ token }: { token: string }) => {
      if (!token) {
        throw new Error("You can't listen.");
      }
      const loggedInUser = await getUser(token);
      return { loggedInUser }; // goes to context
    },
  },
});

// order of middle ware is important (logger should be earlier than apollo)
const app = express();
app.use(cors());
// app.use(graphqlUploadExpress({ maxFileSize: 1000000000, maxFiles: 10 }));
// app.use(logger("tiny"));
apollo.applyMiddleware({ app });
app.use("/static", express.static("uploads"));
const httpServer = http.createServer(app);
apollo.installSubscriptionHandlers(httpServer);
// app.listen({ port: PORT }, () =>
httpServer.listen(PORT, () =>
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
);

if (process.env.NODE_ENV === "dev") {
  const localtunnel = require("localtunnel");
  (async () => {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: process.env.SUBDOMAIN,
    });
    console.log(
      `${process.env.NODE_ENV}:localtunnel.url: ${tunnel.url}/graphql`
    );
    tunnel.on("close", () => {
      console.log("localtunnel closed");
    });
  })();
}
