#! /bin/bash
 
# replace it with the network your contract lives on
NETWORK_APTOS=testnet
NETWORK_MOVEMENT=testnet.porto
# replace it with your contract address
CONTRACT_ADDRESS="0x28af3805f23612b4dfa86202a454f5144159702559aea86393ac0d50f577568d"
# replace it with your module name, every .move file except move script has module_address::module_name {}
MODULE_FEES_APTOS=fees_v3
MODULE_SUBSCRIPTION_APTOS=subscription_v3
MODULE_FEES_MOVEMENT=fees_beta_1
MODULE_SUBSCRIPTION_MOVEMENT=subscription_beta_1

 
# save the ABI to a TypeScript file
echo "export const ABI = $(curl https://fullnode.$NETWORK_APTOS.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_FEES_APTOS | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftFeesAbiAptos.ts
echo "export const ABI = $(curl https://fullnode.$NETWORK_APTOS.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_SUBSCRIPTION_APTOS | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftSubscriptionAbiAptos.ts
echo "export const ABI = $(curl https://aptos.$NETWORK_MOVEMENT.movementlabs.xyz/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_FEES_MOVEMENT | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftFeesAbiMovement.ts
echo "export const ABI = $(curl https://aptos.$NETWORK_MOVEMENT.movementlabs.xyz/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_SUBSCRIPTION_MOVEMENT | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftSubscriptionAbiMovement.ts

