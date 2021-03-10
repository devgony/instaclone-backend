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
