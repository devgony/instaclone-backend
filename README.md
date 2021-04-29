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
const x = resolver => (root, args, context, info) => {
  //...check auth
  return resolver(root, args, context, info);
};
x(b)(c); // waht is called, currying
```

- adjust to protect all resolvers

```ts
export const protectedResolver = ourResolver => (root, args, context, info) => {
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
find src -name "*.js" -exec sh -c 'mv $1 ${1/.js/.ts}' _ {} \;
sed -i '' s/.js/.ts/g src/schema.ts
```

- handle jwt import err

```
import jwt from "jsonwebtoken";
to
import * as jwt from "jsonwebtoken";

```

- Define types

```ts
// touch src/types.d.ts
type Context = {
  loggedInUser?: User;
  client: PrismaClient;
};

export type Resolver = (
  root: any,
  args: any,
  context: Context,
  info: any
) => any;

export type Resolvers = {
  [key: string]: {
    [key: string]: Resolver;
  };
};
```

- now we can add client to context => no need to import at each files anymore

```ts
// server.ts
const server = new ApolloServer({
  schema,
  context: async ({ req }) => ({
    loggedInUser: await getUser(req.headers.token),
    client,
  }),
});
```

- add Resolver type to util

```ts
// users.utils.ts
export const protectedResolver = (ourResolver: Resolver) => (
```

- we can use loggedInUser and client even at protedtedResolver

```ts
// seeProfile.resolvers.ts
    seeProfile: protectedResolver((_, { username }, { loggedInUser, client }) =>
```

## #4 USER MODULE - 4.14 File Upload

- Give resolvers, typeDefs to ApolloServer
  - => no need manual schema sync
  - => enable upload function

```ts
// schema.ts
export const typeDefs = mergeTypeDefs(loadedTypes);
export const resolvers = mergeResolvers(loadedResolvers);
...
// don't need to export schema

// server.ts
const server = new ApolloServer({
  // instead of schema,
  resolvers,
  typeDefs,
...
```

- Add `bio`, `avatar` to schema.prisma, users.typeDefs.ts,
- Add `bio` to editProfile.typeDef.ts, editProfile.resolvers.ts

### Install Altair graphql client for chrome

- add `avatar: Upload` to editProfile.typeDefs.ts, editProfile.resolvers.ts
- https://altair.sirmuel.design/#download
- add token to "set Headers" `token: ~~`
- use variable with $ and put the bind at "VARIABLES"

```ts
mutation($bio: String, $avatar: Upload) {
  editProfile(bio: $bio, avatar: $avatar) {
    ok
    error
  }
}

{
  "bio": "henry"
}
avatar => fileUpload
```

### Handle duplicated port error

- add --delay 2s

```
    "dev": "nodemon --exec ts-node src/server --ext ts,js --delay 2s",

```

### Handle "Maximum call stack size exceeded" error

```js
// pacakge.json
"preinstall": "npx npm-force-resolutions",
...
"resolutions": {
"fs-capacitor": "^6.2.0",
"graphql-upload": "^11.0.0"
}

rm -rf node_modules
npm i
```

### stream to pip

- just testing writing file to local

```js
const { filename, createReadStream } = await avatar;
const readStream = createReadStream();
const writeStream = createWriteStream(process.cwd() + "/uploads/" + filename);
readStream.pipe(writeStream);
```

## Switch to apollo-server-express

- now route is inside of apollo server => use `apollo-server-express` => add express to apollo to use more router than graphql like REST API, Socket.io...

```js
> npm i express apollo-server-express

// server.ts
import * as express from "express";
import * as logger from "morgan"; // to enable logging
import { ApolloServer } from "apollo-server-express"; // from apollo-server to apollo-server-express

const app = express();
app.use(logger("tiny"));
server.applyMiddleware({ app });

// change to app with callback
app.listen({ port: PORT }, () =>
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
);
```

### Handle DeprecationWarning: ReadStream.prototype.open() is deprecated again

- gets from apollo-server-express more than 2.20.0 => just npm i again

```
rm -rf node_modules
npm i
```

## Changing Avatar => handle static file

- expose static file with express

```js
app.use("/static", express.static("uploads"));
```

### get unique fileName and save

```js
let avatarUrl = null;
if (avatar) {
  // console.log(bio, avatar);
  const { filename, createReadStream } = await avatar;
  const newFilename = `${loggedInUser.id}-${Date.now()}-${filename}`;
  const readStream = createReadStream();
  const writeStream = createWriteStream(
    `${process.cwd()}/uploads/${newFilename}`
  );
  readStream.pipe(writeStream);
  avatarUrl = `http://localhost:4000/static/${newFilename}`;
}
...
            ...(avatarUrl && { avatar: avatarUrl }),
...
```

## #4.20 Followers part One (07:59)

- fix createAccount bug => should return `CreateAccountResult`
- user likes user => self relationship

```js
// schema.prisma
followers User[]   @relation("FollowRelation", references: [id])
following User[]   @relation("FollowRelation", references: [id])
```

- test relations with prisma studio

## #4.21 Following User

```
mkdir src/users/followUser
touch src/users/followUser/followUser.typeDefs.ts
touch src/users/followUser/followUser.resolvers.ts
```

## #4.22 Unfollow User and See Followers

```
mkdir src/users/unfollowUser
touch src/users/unfollowUser/unfollowUser.typeDefs.ts
touch src/users/unfollowUser/unfollowUser.resolvers.ts
```

## #4.23 Followers Pagination part One

- 2 ways of getting followers

```js
const aFollowers = await client.user
  .findUnique({ where: { username } })
  .followers(); // username's followers
const bFollowers = await client.user.findMany({
  where: { following: { some: { username } } },
}); // where username in following
```

### Pagination#1: Offset: good for jump?

- Cons of offset: Even with skip, still need to traverse the first data
- Start from offset, if rows gets bigger, try to use cursor-based

```js const followers = await client.user
        .findUnique({ where: { username } })
        .followers({
          take: 5,
          skip: (page - 1) * 5,
        });
```

```js
mkdir src/users/seeFollowers
touch src/users/seeFollowers/seeFollowers.typeDefs.ts
touch src/users/seeFollowers/seeFollowers.resolvers.ts
```

### total pages

- Use PrismaClient.count

### some vs every vs none

some: User following $username (IN + EQUAL to $username)
every: User following $username + User following nobody (NOT IN + NOT EQUAL to $username)
none: User not following $username (NOT IN + EQUAL to $username)

## #4.25 Following Pagination

### Pagination#2: Cursor-based

- scales well
- can't jump to specific page
- for infinite scroll

```js
mkdir src/users/seeFollowing
touch src/users/seeFollowing/seeFollowing.typeDefs.ts
touch src/users/seeFollowing/seeFollowing.resolvers.ts
```

## ##4.26 Computed Fields

### Concept of Computed Field

- At gql schema but not in DB
- seeProfile resolver => get user from DB => no totalFollowing? => goes User (userDefined resolver)
- don't need await => gql will await for us

```js
// users.typeDefs.ts
...
totalFollowing: Int!
totalFollowers: Int!
isMe: Boolean! // if the username is me
isFollowing: Boolean! // if i am following the username
...

touch src/users/users.resolvers.ts
```

## #4.29 Searching Users

```js
mkdir src/users/searchUsers
touch src/users/searchUsers/searchUsers.typeDefs.ts
touch src/users/searchUsers/searchUsers.resolvers.ts
```

- search by `startsWith: keyword.toLowerCase()`
- Do pagination as homework

## #6.0 Photos Model

- As soon as add and save `photos Photo[]` prisma will know the relationship and does auto-complete without touching DB `user User @relation(fields: [userId], references: [id])`
- Caption to parse to hashtags
- Photos <-> Hashtags are m:n
- Migrate new model with `npm run migrate`

## #6.1 Prisma Fields vs SQL Fields

- Primsa shows relations with nested column

## #6.2 Upload Photo

```js
mkdir src/photos
touch src/photos/photos.typeDefs.ts
mkdir src/photos/uploadPhoto/
touch src/photos/uploadPhoto/uploadPhoto.typeDefs.ts
touch src/photos/uploadPhoto/uploadPhoto.resolvers.ts
```

### regexp

```js
// uploadPhoto.resolvers.ts
const hashtags = caption.match(/#[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\w]+/g) || [];
hashtagObjs = hashtags.map(hashtag => ({
  where: { hashtag },
  create: { hashtag },
}));
```

### use `connectOrCreate` for hashtag

## #6.5 seePhoto

```js
mkdir src/photos/seePhoto/
touch src/photos/seePhoto/seePhoto.typeDefs.ts
touch src/photos/seePhoto/seePhoto.resolvers.ts
```

### Add computed field to photo => user, hashtags

```js
touch src/photos/photos.resolvers.ts
```

## #6.6 seeHashtag

```js
mkdir src/photos/seeHashtag/
touch src/photos/seeHashtag/seeHashtag.typeDefs.ts
touch src/photos/seeHashtag/seeHashtag.resolvers.ts
```

### Add Computed Hashtag field to `photos.resolvers.ts` (cuz tiny enough)

### Field can be resolver as well (with additional argument)

- can extend, reused to other resolver as a core

```js
type Hashtag {
...
    photos(page: Int!): [Photo]
...
```

- => no need to define parameter at seeHashtag Query
- Just use args at computed Hashtag field

```js
Hashtag: {
    photos: ({ id }, { page }, { loggedInUser }) =>
...

```

## #6.7 editPhoto part One

### Fix users first

```js
// users.typeDefs.ts
photos: [Photo];

// users.resolvers.ts
    photos: ({ id }) => client.user.findUnique({ where: { id } }).photos,
```

### Homwork: add pagination to User's photos

### searchPhotos

```js
mkdir src/photos/searchPhotos/
touch src/photos/searchPhotos/searchPhotos.typeDefs.ts
touch src/photos/searchPhotos/searchPhotos.resolvers.ts
```

### editPhoto

```js
mkdir src/photos/editPhoto/
touch src/photos/editPhoto/editPhoto.typeDefs.ts
touch src/photos/editPhoto/editPhoto.resolvers.ts
```

### Convention: Let's make result type `{ok,error}` at least for Mutation

### Use findFirst instead of findUnique if want to use 2 filters

### Related hashtag handling

```js
// editPhoto.resolvers.ts
hashtags: {
              disconnect: oldPhoto.hashtags,
              connectOrCreate: processHashtags(caption),
            },
```

### Move caption parser to utils and resue

```js
touch src/photos/photos.utils.ts

export const processHashtags = caption => {
  const hashtags = caption.match(/#[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\w]+/g) || [];
  return hashtags.map(hashtag => ({
    where: { hashtag },
    create: { hashtag },
  }));
};
```

## #6.9 Like Unlike Photos

### create model

```js
model like {
  id        Int      @id @default(autoincrement())
  photo     Photo    @relation(fields: [photoId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  photoId   Int // id for prisma only
  userId    Int // id for prisma only
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### change like => likes of User, Photo

- the name at prisma doesn't metter

### Compound unique: set composite key

```js
@@unique([photoId, userId]);
```

### npm run migrate

```
✔ Are you sure you want create and apply this migration? Some data will be lost. … yes
? Name of migration › y
```

### Add `type Like` to `photos.typeDefs.ts`(for gql): no need to be sync with `schema.prisma`

```js
mkdir src/photos/toggleLike/
touch src/photos/toggleLike/toggleLike.typeDefs.ts
touch src/photos/toggleLike/toggleLike.resolvers.ts
```

### Just hiding button is not enough! we should use protectedResolver

### Add computed field to Photo

```js
// photos.typeDefs.ts
type Photo {
...
likes: Int!
...

// photos.resovlers.ts
likes: ({ id }) => client.like.count({ where: { photoId: id } }),
```

## #6.11 seeLikes (of photo)

```js
mkdir src/photos/seePhotoLikes/
touch src/photos/seePhotoLikes/seePhotoLikes.typeDefs.ts
touch src/photos/seePhotoLikes/seePhotoLikes.resolvers.ts
```

### include vs select

- include: columns of like + additional column of the related entity
- select: fetch the related entity only
- we can't use both at once
- can use nested include {include} or select {select}

## #6.12 seeFeed

### my following's photo + my photo

```js
mkdir src/photos/seeFeed/
touch src/photos/seeFeed/seeFeed.typeDefs.ts
touch src/photos/seeFeed/seeFeed.resolvers.ts
```

### Homework: Pagination result of seeFeed
