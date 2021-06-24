import client from "../client";

export default {
  Room: {
    users: ({ id }) => client.room.findUnique({ where: { id } }).users(),
    messages: ({ id }) =>
      client.message.findMany({
        where: {
          roomId: id,
        },
        orderBy: { updatedAt: "desc" },
      }),
    unreadTotal: ({ id }, _, { loggedInUser }) => {
      if (!loggedInUser) {
        return 0;
      }
      return client.message.count({
        where: {
          read: false,
          roomId: id,
          user: {
            id: {
              not: loggedInUser.id,
            },
          },
        },
      });
    },
  },
  Message: {
    user: ({ id }) => client.message.findUnique({ where: { id } }).user(),
    // isMine: async ({ id }, _, { loggedInUser }) =>
    //   Boolean(
    //     await client.message.findFirst({
    //       where: { id, userId: loggedInUser.id },
    //       select: { userId: true },
    //     })
    //   ),
  },
};
