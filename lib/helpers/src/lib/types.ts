import {
  FeesABI,
  FeesMoveAbi,
  SubscriptionABI,
  SubscriptionMoveABI,
} from '@aptos';

export type FeesABITypes = typeof FeesABI | typeof FeesMoveAbi;
export type SubscriptionABITypes =
  | typeof SubscriptionABI
  | typeof SubscriptionMoveABI;
