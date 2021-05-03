import client from "../../client";

export default {
  Query: {
    searchPhotos: async (_, { keyword }) =>
      // {
      //   const photos = await client.photo.findMany();
      //   const regExp = new RegExp(`((?<=\\s)|^)${keyword}`, "gi");
      //   return photos.filter(photo => photo.caption.match(regExp));
      // },
      client.photo.findMany({
        where: {
          caption: {
            contains: keyword,
          },
        },
      }),
  },
};
