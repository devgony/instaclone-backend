import client from "../../client";
import { protectedResolver } from "../../users/users.utils";

export default {
  Query: {
    seeFeed: protectedResolver((_, __, { loggedInUser }) =>
      client.photo.findMany({
        where: {
          OR: [
            {
              // my following's photo
              user: {
                followers: {
                  some: {
                    id: loggedInUser.id,
                  },
                },
              },
            },
            { userId: loggedInUser.id }, // my photo
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    ),
  },
};
