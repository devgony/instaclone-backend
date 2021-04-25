import client from "../../client";
import * as bcrypt from "bcrypt";

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
        // hash password
        // save and return the user
        await client.user.create({
          data: {
            username,
            email,
            firstName,
            lastName,
            password: uglyPassword,
          },
        });
        return { ok: true };
      } catch (error) {
        console.log(error);
        return { ok: false, error: "Could not create account." };
      }
    },
  },
};
