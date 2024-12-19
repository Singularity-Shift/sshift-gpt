import { FeesABI, SubscriptionABI } from '@aptos';
import { ConfirmButton } from '@fn-chat/components/ui/confirm-button';
import { LabeledInput } from '@fn-chat/components/ui/labeled-input';
import { useToast } from '@fn-chat/components/ui/use-toast';
import { useAbiClient } from '@fn-chat/context/AbiProvider';
import { useAppManagment } from '@fn-chat/context/AppManagment';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { useState } from 'react';

const GrantSubscriptions = () => {
  const [days, setDays] = useState(0);
  const [grantedAddress, setGrantedAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { abi } = useAbiClient();
  const { client } = useWalletClient();
  const { toast } = useToast();

  const onGrantSubscription = async () => {
    try {
      setIsUpdating(true);
      const hasSubscription = await abi
        ?.useABI(SubscriptionABI)
        .view.has_subscription_active({
          typeArguments: [],
          functionArguments: [grantedAddress as `0x${string}`],
        });

      if (hasSubscription?.[0]) {
        toast({
          title: 'Error granting subscription',
          description: 'The account already has a subscription.',
          variant: 'error',
        });

        setIsUpdating(false);
        return;
      }

      const duration = days * 24 * 60 * 60;

      const tx = await client?.useABI(SubscriptionABI).gift_subscription({
        type_arguments: [],
        arguments: [grantedAddress as `0x${string}`, duration],
      });

      toast({
        title: 'Subscription gifted',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            Transaction {tx?.hash}
          </a>
        ),
      });
    } catch (error) {
      toast({
        title: 'Error checking subscription status',
        description: `${error}`,
        variant: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <LabeledInput
        id="granted-duration-subscription"
        label="Grant subscription for an account"
        tooltip="Duration in days"
        required={true}
        value={days}
        onChange={(e) => setDays(parseInt(e.target.value))}
        type="number"
      />

      <LabeledInput
        id="granted-address-subscription"
        label="Account Address"
        tooltip="The address of the account to gift the subscription to"
        required={true}
        value={grantedAddress}
        onChange={(e) => setGrantedAddress(e.target.value as `0x${string}`)}
        type="text"
      />

      <div className="pt-4">
        <ConfirmButton
          variant="green"
          title="Save Config"
          onSubmit={onGrantSubscription}
          disabled={isUpdating || !grantedAddress || days <= 0}
          confirmMessage={
            <p>
              You will grant a subscription for the account {grantedAddress}{' '}
              with the given duration {days}.
              <br />
              <br />
              Are you agree with this action?
            </p>
          }
        />
      </div>
    </div>
  );
};
