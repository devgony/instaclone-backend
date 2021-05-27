import { gql } from "apollo-server-core";

export default gql`
  type Photo {
    id: Int!
    user: User!
    file: String!
    caption: String
    likes: Int!
    commentNumber: Int!
    comments: [Comment]
    hashtags: [Hashtag]
    isMine: Boolean! # computed field
    createdAt: String!
    updatedAt: String!
    isLiked: Boolean!
  }
  type Hashtag {
    # dependent on photo?
    # strategy: start with everythin together and separate if others need it
    id: Int!
    hashtag: String!
    photos(page: Int!): [Photo]
    totalPhotos: Int!
    createadAt: String!
    updatedAt: String!
  }
  type Like {
    id: Int!
    photo: Photo!
    createdAt: String!
    updatedAt: String!
  }
`;
