require("dotenv").config(); // should be on top of code
import { ApolloServer } from "apollo-server";
import schema from "./schema";
import { getUser } from "./users/users.utils";

const server = new ApolloServer({
  schema,
  context: async ({ req }) => ({
    loggedInUser: await getUser(req.headers.token),
  }),
});

const PORT = process.env.PORT;

server
  .listen(PORT)
  .then(() => console.log(`🚀 Server is running on http://localhost:${PORT}`));
