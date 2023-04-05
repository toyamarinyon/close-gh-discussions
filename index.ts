import {
  intro,
  text,
  outro,
  group,
  cancel,
  multiselect,
  spinner,
} from "@clack/prompts";
import { spawnSync } from "child_process";
import { GraphQLClient } from "graphql-request";
import { closeDiscussionMutation, discussionsQuery } from "./graphql";

const { stdout } = spawnSync("gh", ["auth", "token"]);
const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    Authorization: `bearer ${stdout.toString().trim()}`,
  },
});

intro(`Let's close GitHub discussions!`);

const { owner, repo } = await group(
  {
    owner: () =>
      text({
        message: "Which owner has the discussion you want to close?",
        placeholder: "e.g. toyamarinyon",
        initialValue: "toyamarinyon",
        validate(value) {
          if (value.length === 0) return `Owner is required!`;
        },
      }),
    repo: () =>
      text({
        message: "Which repository has the discussion you want to close?",
        initialValue: "cloudflare-pages-plugin-trpc",
        placeholder: "e.g. close-gh-discussions",
        validate(value) {
          if (value.length === 0) return `Repository is required!`;
        },
      }),
  },
  {
    // On Cancel callback that wraps the group
    // So if the user cancels one of the prompts in the group this function will be called
    onCancel: ({ results }) => {
      cancel("Operation cancelled.");
      process.exit(0);
    },
  }
);
const fetchDiscussionSpinner = spinner();
fetchDiscussionSpinner.start(`Fetching discussions on ${owner}/${repo}...`);
const result = (await graphQLClient.request(discussionsQuery, {
  owner,
  repo,
})) as any;
fetchDiscussionSpinner.stop();
const selectDiscussions = await multiselect({
  message: "Which discussion do you want to close?",
  options: result.repository.discussions.nodes.map((discussion) => ({
    value: discussion.id,
    label: discussion.title,
  })),
});
text({
  message: JSON.stringify(selectDiscussions),
});

const closeDiscussionSpinner = spinner();
closeDiscussionSpinner.start(`Closing discussions...`);
if (Array.isArray(selectDiscussions)) {
  for (const discussionId of selectDiscussions) {
    await graphQLClient.request(closeDiscussionMutation, {
      discussionId,
    });
  }
}
closeDiscussionSpinner.stop();
// Do stuff
outro(`You're all set!`);
