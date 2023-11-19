import {
  Principal,
  text,
  $query,
  $update,
  StableBTreeMap,
  Result,
  match,
  Vec,
  ic,
} from "azle";
import { Campaign, Donor } from "./types";

const generateId = () => ("" + Math.random()).substring(2, 7);

// campaignStorage: The storage that stores all the campaigns
const campaignStorage = new StableBTreeMap<string, Campaign>(0, 44, 1024);

/**
 * Creates a new campaign.
 *
 * @param _proposer - The proposer of the campaign.
 * @param _title - The title of the campaign.
 * @param _description - The description of the campaign.
 * @param _goal - The goal amount of the campaign.
 * @param _deadline - This is the deadline for the campaign, to make simple we will take the input from the user in days.
 *        if he enters 10 it means current time + 10 days will be the deadline.
 * @returns A result object containing the created campaign or an error string.
 */
$update;
export function createCampaign(
  _proposer: Principal,
  _title: text,
  _description: text,
  _goal: number,
  _deadline: number
): Result<Campaign, string> {
  try {
    if (!_proposer || typeof _proposer !== "string") {
      return Result.Err<Campaign, string>("Invalid proposer");
    }
    if (!_title || _title.trim().length === 0) {
      return Result.Err<Campaign, string>("Title is required");
    }
    if (!_description || _description.trim().length === 0) {
      return Result.Err<Campaign, string>("Description is required");
    }
    if (!_goal || _goal <= 0) {
      return Result.Err<Campaign, string>("Goal should be greater than 0");
    }

    const presentTime = Number(ic.time());
    const nanoSeconds = Number(_deadline * 86400 * 1_000_000_000);
    const endDate = presentTime + nanoSeconds;

    const campaign: Campaign = {
      id: generateId(),
      proposer: _proposer,
      title: _title,
      description: _description,
      goal: _goal,
      totalDonations: 0,
      deadline: endDate,
      donors: [] as Vec<Donor>,
    };

    campaignStorage.insert(campaign.id, campaign);
    return Result.Ok(campaign);
  } catch (error) {
    return Result.Err<Campaign, string>(`Failed to create campaign: ${error}`);
  }
}

/**
 * Updates the title and description of a campaign by its ID.
 *
 * @param _campaignId - The ID of the campaign to update.
 * @param _title - The new title of the campaign.
 * @param _description - The new description of the campaign.
 * @returns A result object containing the updated campaign or an error string.
 */
$update;
export function updateOnlyTitleandDescription(
  _campaignId: string,
  _title: string,
  _description: string
): Result<Campaign, string> {
  try {
    return match(campaignStorage.get(_campaignId), {
      Some: (existingCampaign) => {
        existingCampaign.title = _title;
        existingCampaign.description = _description;
        campaignStorage.insert(_campaignId, existingCampaign);
        return Result.Ok<Campaign, string>(existingCampaign);
      },
      None: () =>
        Result.Err<Campaign, string>(
          `The campaign with id=${_campaignId} is not found`
        ),
    });
  } catch (error) {
    return Result.Err<Campaign, string>(
      `Failed to update campaign: ${error instanceof Error ? error.message : 'Unexpected error'}`
    );
  }
}

/**
 * Donates a certain amount to a campaign by a donor.
 *
 * @param _campaignId - The ID of the campaign to donate to.
 * @param _donorId - The ID of the donor.
 * @param _amount - The amount to donate.
 * @returns A result object containing the updated campaign or an error string.
 *
 * If the campaign passes the deadline then it will give a Campaign has ended error,
 * if the goal is crossed then it will give the maximum goal crossed error.
 */
$update;
export function donateCampaign(
  _campaignId: string,
  _donorId: Principal,
  _amount: number
): Result<Campaign, string> {
  try {
    return match(campaignStorage.get(_campaignId), {
      Some: (existingCampaign) => {
        if (Number(ic.time()) > Number(existingCampaign.deadline)) {
          return Result.Err<Campaign, string>("This campaign has ended");
        }

        const newDonor: Donor = { id: _donorId, amount: _amount };
        existingCampaign.donors.push(newDonor);

        if (existingCampaign.goal >= existingCampaign.totalDonations + _amount) {
          existingCampaign.totalDonations += _amount;
        } else {
          return Result.Err<Campaign, string>(
            `Donation amount is greater than the goal`
          );
        }

        campaignStorage.insert(_campaignId, existingCampaign);
        return Result.Ok<Campaign, string>(existingCampaign);
      },
      None: () =>
        Result.Err<Campaign, string>(
          `The campaign with id=${_campaignId} is not found`
        ),
    });
  } catch (error) {
    return Result.Err<Campaign, string>(
      `Failed to donate to campaign: ${error instanceof Error ? error.message : 'Unexpected error'}`
    );
  }
}
/**
 * Gets a campaign by its ID.
 *
 * @param id - The ID of the campaign to get.
 * @returns A result object containing the campaign or an error string.
 */
$query;
export function getCampaign(id: string): Result<Campaign, string> {
  try {
    if (!id || typeof id !== "string" || !/^[a-f\d]{5}$/.test(id)) {
      return Result.Err<Campaign, string>("Invalid campaign ID");
    }

    return match(campaignStorage.get(id), {
      Some: (existingCampaign) => Result.Ok<Campaign, string>(existingCampaign),
      None: () => Result.Err<Campaign, string>(`The campaign with id=${id} is not found`),
    });
  } catch (error) {
    return Result.Err<Campaign, string>(
      `Failed to get campaign: ${error instanceof Error ? error.message : 'Unexpected error'}`
    );
  }
}
/**
 * Gets the deadline of a campaign by its ID.
 *
 * @param id - The ID of the campaign to get the deadline for.
 * @returns A result object containing the deadline or an error string.
 */
$query;
export function getDeadlineByCampaignId(id: string): Result<number, string> {
  try {
    if (!id || typeof id !== "string" || !/^[a-f\d]{5}$/.test(id)) {
      return Result.Err<number, string>("Invalid campaign ID");
    }

    return match(campaignStorage.get(id), {
      Some: (existingCampaign) => Result.Ok<number, string>(existingCampaign.deadline),
      None: () => Result.Err<number, string>("Campaign not found"),
    });
  } catch (error) {
    return Result.Err<number, string>(
      `Failed to get campaign deadline: ${error instanceof Error ? error.message : 'Unexpected error'}`
    );
  }
}

/**
 * Deletes a campaign by its ID.
 *
 * @param id - The ID of the campaign to delete.
 * @returns A result object containing the campaign or an error string.
 */
$update;
export function deleteCampaign(id: string): Result<Campaign, string> {
  try {
    if (!id || typeof id !== "string" || !/^[a-f\d]{5}$/.test(id)) {
      return Result.Err<Campaign, string>("Invalid campaign ID");
    }

    return match(campaignStorage.remove(id), {
      Some: (deletedCampaign) => Result.Ok<Campaign, string>(deletedCampaign),
      None: () => Result.Err<Campaign, string>(`The campaign with id=${id} is not found`),
    });
  } catch (error) {
    return Result.Err<Campaign, string>(`Failed to delete campaign: ${error instanceof Error ? error.message : 'Unexpected error'}`);
  }
}
