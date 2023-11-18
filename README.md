# fund_it - Crowdfunding platform using Azle.

This project is a canister for managing crowdfunding campaigns, where users can create, update, donate to, and delete campaigns. It is built using the Azle (typescript cdk for icp).

## Functions
```
createCampaign() => Creates a new crowdfunding campaign.

updateOnlyTitleandDescription() => Updates the title and description of an existing campaign.

donateCampaign() => Donates an amount to an existing campaign. Checks if the campaign has ended or the goal has been reached.

getCampaign() => Fetches details of an existing campaign.

getDeadlineByCampaignId() => Gets the deadline of a campaign.

deleteCampaign() => Deletes an existing campaign.
```
## How to run 
I hope you already have dfx and azle installed. If not please refer to this documentation.
```
https://demergent-labs.github.io/azle/installation.html
```
Step1 -> clone this repo:
Step2 
```
cd fund_it_ICP_Canister
```
Step3
```
npm install
```
Step 4
```
dfx start --background --clean
```
Step 5
```
dfx deploy
```
