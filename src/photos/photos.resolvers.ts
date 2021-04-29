import client from "../client";

export default {
  Photo: {
    user: ({ userId }) => {
      return client.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
    hashtags: ({ id }) =>
      client.hashtag.findMany({
        where: {
          photos: {
            some: { id },
          },
        },
      }),
    likes: ({ id }) => client.like.count({ where: { photoId: id } }),
  },
  Hashtag: {
    photos: ({ id }, { page }, { loggedInUser }) =>
      // field can be resolver as well
      // with page, do pagination
      // with loggedIntUser, can protect partial field
      client.photo.findMany({
        where: { id },
      }),
    totalPhotos: ({ id }) =>
      client.photo.count({
        where: {
          hashtags: {
            some: {
              id,
            },
          },
        },
      }),
  },
};
