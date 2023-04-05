import { gql } from "graphql-request";

export const discussionsQuery = gql`
  query ($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 30, orderBy: { field: CREATED_AT, direction: DESC }, states: [OPEN]) {
        nodes {
          id
          title
        }
      }
    }
  }
`;

export const closeDiscussionMutation = gql`
  mutation ($discussionId: ID!) {
    closeDiscussion(input: { discussionId: $discussionId }) {
      clientMutationId
    }
  }
`;
