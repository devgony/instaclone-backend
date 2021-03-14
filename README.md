# Instaclone-Backend

## Setup

- package.json => remove main, script > test => `"dev": "nodemon --exec server.js"`
- ⬆️+cmd+P > gitignore > node

```
npm i apollo-server graphql
touch server.js
npm i nodemon --save-dev
```

- To use import statement => can have version problem

```ts
// package.json
  "type": "module"
```

### use `babel` is better

- js compiler, compatible to lower version

```ts
npm install --save-dev @babel/core @babel/cli
npm install @babel/preset-env --save-dev
npm i @babel/node --save-dev

// touch babel.config.json
{
  "presets": ["@babel/preset-env"]
}

// package.json
    "dev": "nodemon --exec babel-node server"
```

### POC API

- Sample apollo-gql

```ts
// server.js
import { ApolloServer, gql } from "apollo-server";

const typeDefs = gql`
  type Movie {
    title: String
    year: Int
  }

  type Query {
    movies: [Movie]
    movie: Movie
  }

  type Mutation {
    createMovie(title: String!): Boolean
    deleteMovie(title: String!): Boolean
  }
`;

const resolvers = {
  Query: {
    movies: () => [],
    movie: () => ({ title: "Hello", year: 2021 }),
  },
  Mutation: {
    createMovie: (_, { title }) => {
      console.log(title);
      return true;
    },
    deleteMovie: (_, { title }) => {
      console.log(title);
      return true;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server
  .listen()
  .then(() => console.log("Server is running on http://localhost:4000"));
```

> ### Prisma Setup

- ORM
- with TS is more delicious
- generate client to interpret

```
npm i @prisma/cli -D
npx prisma init
extension> prisma
```

- install and create postres "instaclone" db

```ts
// .env
DATABASE_URL="postgresql://postgres:randompassword@localhost:5432/instaclone?schema=public"

$>
npx prisma migrate dev --preview-feature
init
```

- `prisma migrate` modifies db shape
  - create ${date}\_init/migration.sql
- something generated? client => lives at node_module

```
// package.json
    "migrate": "npx prisma migrate dev --preview-feature"
```

> #### nullable

- Prisma default: false => use ? for true
- Graphql typeDefs default: true => use ! for false

> #### typeDefs should be Manually updated to sync with schema.prisma file

```js
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Movie {
  id        Int      @id @default(autoincrement())
  title     String
  year      Int
  genre     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

> #### use client

```js
updateMovie: (_, { id, year }) =>
  client.movie.update({ where: { id }, data: { year } });
```

- DML returns record itself (event delete)

> #### Prisma Studio

```
// package.json
"studio": "npx prisma studio",
```

> ### Architecture: devide & conquer by domain

- devide and `export default`

```
> touch client.js
> touch schema.js
  // typedefs, resolver
> mkdir movies
touch movies/movies.queries.js
touch movies/movies.mutations.js
touch movies/movies.typeDefs.js
```

> #### Graphql Tools

```ts
npm i graphql-tools

// schema.js
const loadedTypes = loadFilesSync(`${__dirname}/**/*.typeDefs.js`);
const loadedResolvers = loadFilesSync(
  `${__dirname}/**/*.{queries,mutations}.js` // glob syntax
);
const typeDefs = mergeTypeDefs(loadedTypes);
const resolvers = mergeResolvers(loadedResolvers);
const schema = makeExecutableSchema({ typeDefs, resolvers });
export default schema;

// server.js
const server = new ApolloServer({ schema });
```

> #### dotenv

```ts
npm i dotenv

// .env
PORT=4000

// server.js
require("dotenv").config(); // should be on top of code
```

> ## Init from zero

```
rm -rf movies prisma
DROP DATABASE instaclone;
```

> ## User Module

> ### Create account

```
npx prisma init
mkdir users
touch users/users.typeDefs.js
touch users/users.queries.js
touch users/users.mutations.js
```

> #### we don't need password at gql

```ts
export default gql`
  type User {
    id: String!
    firstName: String!
    lastName: String
    username: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }
`;
...
```

> #### Don't just let user touch DB constraint error => check at code LV

- use Combine multiple filter conditions like

```ts
where: {
          OR: [{ username }, { email }],
        },
```

> #### Hashing password

- browser is smart to wait prisma to finish (no need explicit await)

```ts
npm i bcrypt

// users.mutations.js
const uglyPassword = await bcrypt.hash(password, 10);
      // browser is smart to wait prisma to finish
      return client.user.create({
        data: { username, email, firstName, lastName, password: uglyPassword },
      });
```

> #### Using await => better to put all in trycatch

> ### seeProfile

- findUnique works with unique column only

> ### login

- find user with username
- check password
- issue a token

> #### JWT

- jwt token checks `1.created by our SECRET_KEY`, `2.nobody modified`
- cookie works well if front and backend are at same server
- jwt token is better for mobile apps
  - can use expiresIn

```
npm i jsonwebtoken
```

> ### login

- lets devide & conquer

```
mkdir users/editProfile
touch users/editProfile/editProfile.resolvers.js
touch users/editProfile/editProfile.typeDefs.js
mkdir users/createAccount
touch users/createAccount/createAccount.resolvers.js
touch users/createAccount/createAccount.typeDefs.js
mkdir users/login
touch users/login/login.resolvers.js
touch users/login/login.typeDefs.js
mkdir users/seeProfile
touch users/seeProfile/seeProfile.resolvers.js
touch users/seeProfile/seeProfile.typeDefs.js

rm users/users.queries.js users/users.mutations.js

// schema.js
  `${__dirname}/**/*.{queries,mutations}.js` // glob syntax
to
  `${__dirname}/**/*.resolvers.js` // glob syntax
```

> ### editProfile

- It is okay to send undefined. not gonna update
- use ES6 if there is uglyPassword, send else undefined

```ts
// editProfile.resolvers.js
          ...(uglyPassword && { password: uglyPassword }),
```

> #### verify token and get id to edit

```ts
const { id } = await jwt.verify(token, process.env.SECRET_KEY);
```

- but every transaction check token? => http header from `context`
- `context`: available with all resolvers
- let's send not just token but `user` to `context`

```ts
// touch users/users.utils.js
export const getUser = async (token) => {
  try {
    if (!token) {
      return null;
    }
    const { id } = await jwt.verify(token, process.env.SECRET_KEY);
    const user = await client.user.findUnique({ where: { id } });
    if (user) {
      return user;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// server.js
context: async ({ req }) => ({
    loggedInUser: await getUser(req.headers.token),
  }),

// editProfile.resolvers.js
Mutation: {
    editProfile: async (
      _,
      { firstName, lastName, username, email, password: newPassword },
      { loggedInUser }
    ) => {
      let uglyPassword = null;
      if (newPassword) {
        uglyPassword = await bcrypt.hash(newPassword, 10);
      }
      const updatedUser = await client.user.update({
        where: { id: loggedInUser.id },
...
```

> #### protect resolver with resolver using `Currying`

- Basic concept

```ts
const x = (resolver) => (root, args, context, info) => {
  //...check auth
  return resolver(root, args, context, info);
};
x(b)(c); // waht is called, currying
```

- adjust to protect all resolvers

```ts
export const protectedResolver = (ourResolver) => (
  root,
  args,
  context,
  info
) => {
  if (!context.loggedInUser) {
    return { ok: false, error: "Please login to perform this action." };
  }
  return ourResolver(root, args, context, info);
};
```

- But protectedResolver should returns ok and errors => unify the output
- What about seeProfile?

> ## Typescript Setup

- ts-node substitue bable-node

```ts
npm i typescript ts-node --save-dev
mkdir src
mv users src/
mv *.js src/
rm babel.config.json

// touch tsconfig.json
{
  "compilerOptions": {
    "outDir": "./built",
    "allowJs": true,
    "target": "ES5"
  },
  "include": ["./src/**/*"]
}

// package.json : add src, --ext ts,js
    "dev": "nodemon --exec ts-node src/server --ext ts,js",
```

- Convert extention

```
find src -name "*.js" -exec sh -c 'mv $1 ${1/.js/.ts}' find-sh {} \;
sed -i '' s/.js/.ts/g src/schema.ts
```

- handle jwt import err

```
import jwt from "jsonwebtoken";
to
import * as jwt from "jsonwebtoken";

```
