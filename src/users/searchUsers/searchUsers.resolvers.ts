import client from "../../client";

export default {
  Query: {
    searchUsers: async (_, { keyword }) =>
      // do pagination
      await client.user.findMany({
        where: {
          username: {
            startsWith: keyword.toLowerCase(),
          },
        },
      }),
  },
};
