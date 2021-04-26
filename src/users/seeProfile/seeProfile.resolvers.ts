// import client from "../../client";
import { Resolvers } from "../../types";
import { protectedResolver } from "../users.utils";

const resolvers: Resolvers = {
  Query: {
    seeProfile: protectedResolver((_, { username }, { loggedInUser, client }) =>
      client.user.findUnique({
        where: { username },
        include: {
          following: true,
          followers: true,
        },
      })
    ),
  },
};

export default resolvers;
