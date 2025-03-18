#! /bin/bash
 
# replace it with the network your contract lives on
NETWORK_APTOS=testnet
NETWORK_MOVEMENT=bardok
# replace it with your contract address
CONTRACT_ADDRESS="0x02033b72957c2f0b66cf5be479a2aa098d5bf18c36477907eba8be39435f2811"
# replace it with your module name, every .move file except move script has module_address::module_name {}
MODULE_FEES=fees
MODULE_SUBSCRIPTION=subscription

 
# save the ABI to a TypeScript file
echo "export const ABI = $(curl https://fullnode.$NETWORK_APTOS.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_FEES| sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftFeesAbiAptos.ts
echo "export const ABI = $(curl https://fullnode.$NETWORK_APTOS.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_SUBSCRIPTION | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftSubscriptionAbiAptos.ts
# echo "export const ABI = $(curl https://testnet.$NETWORK_MOVEMENT.movementnetwork.xyz/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_FEES | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftFeesAbiMovement.ts
# echo "export const ABI = $(curl https://testnet.$NETWORK_MOVEMENT.movementnetwork.xyz/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_SUBSCRIPTION | sed -n 's/.*"abi":\({.*}\).*}$/\1/p') as const" > SshiftSubscriptionAbiMovement.ts

