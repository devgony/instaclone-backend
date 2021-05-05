import { gql } from "apollo-server-core";

export default gql`
  type Message {
    id: int!
    payload: String!
    user: User!
    room: Room!
    createdAt: String!
    updatedAt: String!
  }
  type Room {
    id: Int!
    user: [User]
    messages: [Message]
    createdAt: String!
    updatedAt: String!
  }
`;
