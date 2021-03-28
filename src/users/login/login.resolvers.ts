import client from "../../client";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

export default {
  Mutation: {
    login: async (_, { username, password }) => {
      // find user with username
      const user = await client.user.findFirst({ where: { username } });
      if (!user) {
        return { ok: false, error: "User not found." };
      }
      // check password
      const passwordOK = await bcrypt.compare(password, user.password);
      if (!passwordOK) {
        return { ok: false, error: "Incorrect password." };
      }
      // issue a token
      const token = await jwt.sign({ id: user.id }, process.env.SECRET_KEY);
      return { ok: true, token };
    },
  },
};
