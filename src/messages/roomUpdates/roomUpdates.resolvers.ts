import { withFilter } from "graphql-subscriptions";
import client from "../../client";
import { NEW_MESSAGE } from "../../constants";
import pubsub from "../../pubsub";

export default {
  Subscription: {
    roomUpdates: {
      // subscribe: () => pubsub.asyncIterator(NEW_MESSAGE),
      // subscribe: withFilter(
      //   () => pubsub.asyncIterator(NEW_MESSAGE),
      //   ({ roomUpdates }, { id }) => {
      //     // if this returns true, update
      //     return roomUpdates.roomId === id;
      //   }
      // ),
      subscribe: async (root, args, context, info) => {
        console.log(context);
        const room = await client.room.findFirst({
          where: {
            id: args.id,
            users: {
              some: { id: context.loggedInUser.id },
            },
          },
          select: { id: true },
        });
        if (!room) {
          throw new Error("You shall not see this.");
        }
        return withFilter(
          () => pubsub.asyncIterator(NEW_MESSAGE),
          async ({ roomUpdates }, { id }, { loggedInUser }) => {
            // if this returns true, update
            if (roomUpdates.roomId === id) {
              const room = await client.room.findFirst({
                where: {
                  id,
                  users: {
                    some: { id: context.loggedInUser.id },
                  },
                },
                select: { id: true },
              });
              if (!room) {
                return false;
              }
              return true;
            }
          }
        )(root, args, context, info);
      },
    },
  },
};
