import { gql } from "apollo-server-core";

export default gql`
  type Comment {
    id: Int!
    user: User!
    payload: String!
    isMine: Boolean! # computed field
    createdAt: String!
    updatedAt: String!
  }
`;
