#! /bin/bash
 
# replace it with the network your contract lives on
NETWORK=testnet
# replace it with your contract address
CONTRACT_ADDRESS="0x28af3805f23612b4dfa86202a454f5144159702559aea86393ac0d50f577568d"
# replace it with your module name, every .move file except move script has module_address::module_name {}
MODULE_FEES=fees
MODULE_SUBSCRIPTION=subscription
 
# save the ABI to a TypeScript file
echo "export const ABI = $(curl https://fullnode.$NETWORK.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_FEES | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftFeesAbi.ts
echo "export const ABI = $(curl https://fullnode.$NETWORK.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_SUBSCRIPTION | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftSubscriptionAbi.ts

