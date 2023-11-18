import { Principal, text, $query, $update, Opt, Record, StableBTreeMap, Result, match, Vec } from "azle";

export type Donor = Record<{
    id: Principal;
    amount: number;
  }>;
  
  
export type Campaign = Record<{
      id: string;
      proposer: Principal;
      title: string;
      description: string;
      goal: number;
      totalDonations: number;
      deadline: number;
      donors:  Vec<Donor>
    }>;