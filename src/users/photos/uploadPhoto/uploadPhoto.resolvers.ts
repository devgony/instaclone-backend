import client from "../../../client";
import { protectedResolver } from "../../users.utils";

export default {
  Mutation: {
    uploadPhoto: protectedResolver(
      async (_, { file, caption }, { loggedInUser }) => {
        let hashtagObjs = [];
        if (caption) {
          // parse caption
          const hashtags = caption.match(/#[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\w]+/g);
          hashtagObjs = hashtags.map(hashtag => ({
            where: { hashtag },
            create: { hashtag },
          }));
          // get or create hashtags
          return client.photo.create({
            data: {
              file,
              caption,
              user: {
                connect: {
                  id: loggedInUser.id,
                },
              },
              ...(hashtagObjs.length > 0 && {
                hashtags: {
                  connectOrCreate: hashtagObjs,
                },
              }),
            },
          });
        }
        // save the photo with the parsed hashtags
        // add the photo to the hashtags
      }
    ),
  },
};
