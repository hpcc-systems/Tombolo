---
sidebar_position: 6
---

# Connect to Github

Adding a Github Repository will allow files in that repository to be utilized in Dataflows. Tombolo can utilize ECL code within files to execute ECL queries and workloads in the designated cluster.

## Add a Github Repository

Navigate to the Github management and creation screen by selecting "Github" under the "Settings" section of the left-hand navigation.

In the top right hand corner, click or select the "Add new project" button.

Username
Please provide the username of the GitHub account that has access to the repository, and that you have access to in order to generate an access token.

Access Tokens
In order for Tombolo to communicate with the repository, an access token must be generated. To learn how to generate an access token view GitHubs guide at https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

GitHub Link
Please provide the full URL to the desired repository e.g. https://github.com/hpcc-systems/Tombolo.

Branch or Tag
Tombolo will only pull documents from the latest commit of the selected branch or tag. Tombolo will reach out to GitHub to retrieve a valid list to select from.
