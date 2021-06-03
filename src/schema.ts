import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

const loadedTypes = loadFilesSync(`${__dirname}/**/*.typeDefs.{j,t}s`);
const loadedResolvers = loadFilesSync(
  `${__dirname}/**/*.resolvers.{j,t}s` // glob syntax
);
export const typeDefs = mergeTypeDefs(loadedTypes);
export const resolvers = mergeResolvers(loadedResolvers);
// const schema = makeExecutableSchema({ typeDefs, resolvers });
// export default schema;
