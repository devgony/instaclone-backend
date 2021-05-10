import { gql } from "apollo-server-core";

export default gql`
  type Message {
    id: Int!
    payload: String!
    user: User!
    # isMine: Boolean!
    room: Room!
    read: Boolean!
    createdAt: String!
    updatedAt: String!
  }
  type Room {
    id: Int!
    unreadTotal: Int!
    users: [User]
    messages: [Message]
    createdAt: String!
    updatedAt: String!
  }
`;
