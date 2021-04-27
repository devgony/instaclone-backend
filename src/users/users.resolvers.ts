import client from "../client";

export default {
  User: {
    // instead of Query or Mutation, user-defined resolver
    totalFollowing: ({ id }) =>
      client.user.count({
        where: {
          followers: {
            some: { id },
          },
        },
      }),
    totalFollowers: ({ id }) =>
      client.user.count({
        where: {
          following: {
            some: { id },
          },
        },
      }),
    isMe: ({ id }, _, { loggedInUser }) => {
      if (!loggedInUser) {
        return false; // or intead, use optional chaning
      }
      return id === loggedInUser.id;
    },
  },
};
