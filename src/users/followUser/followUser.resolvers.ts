import client from "../../client";
import { protectedResolver } from "../users.utils";

export default {
  Mutation: {
    followUser: protectedResolver(async (_, { username }, { loggedInUser }) => {
      const ok = await client.user.findUnique({ where: { username } });
      if (!ok) {
        return {
          ok: false,
          error: "That user does not exist.",
        };
      }
      try {
        await client.user.update({
          where: {
            id: loggedInUser.id,
          },
          data: {
            following: {
              connect: {
                username,
              },
            },
          },
        });
        return { ok: true };
      } catch (error) {
        console.log(error);
        return { ok: false, error: "Could not follow." };
      }
    }),
  },
};
