import client from "../../client";
import bcrypt from "bcrypt";

export default {
  Mutation: {
    createAccount: async (
      _,
      { firstName, lastName, username, email, password }
    ) => {
      try {
        // check if username or email are dupd
        //// findFirst => rownum = 1
        const existingUser = await client.user.findFirst({
          where: {
            OR: [{ username }, { email }],
          },
        });
        if (existingUser) {
          throw new Error("This username or email is already taken.");
        }
        const uglyPassword = await bcrypt.hash(password, 10);
        // browser is smart to wait prisma to finish
        return client.user.create({
          data: {
            username,
            email,
            firstName,
            lastName,
            password: uglyPassword,
          },
        });
        // hash password
        // save and return the user
      } catch (error) {
        return error;
      }
    },
  },
};
