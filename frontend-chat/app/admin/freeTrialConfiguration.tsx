'use client';
import { useState, useEffect } from 'react';
import { useToast } from '../../src/components/ui/use-toast';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { useAbiClient } from '../../src/context/AbiProvider';
import { Button } from '../../src/components/ui/button';
import { Slider } from '../../src/components/ui/slider';
import { ExternalLink } from 'lucide-react';
import { SubscriptionABI } from '@aptos';

const FreeTrialDuration = () => {
  const { toast } = useToast();
  const { account } = useWallet();
  const { client } = useWalletClient();
  const { abi } = useAbiClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [newDuration, setNewDuration] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (abi && account?.address) {
      fetchCurrentDuration();
    }
  }, [abi, account]);

  useEffect(() => {
    setHasChanges(currentDuration !== newDuration);
  }, [currentDuration, newDuration]);

  const fetchCurrentDuration = async () => {
    try {
      setIsLoading(true);
      // Replace with your actual contract call to get the current free trial duration
      const duration = await abi
        ?.useABI(SubscriptionABI)
        .view.get_trial_duration({
          typeArguments: [],
          functionArguments: [],
        });

      const durationDays = Number(duration?.[0]) || 0;
      setCurrentDuration(durationDays);
      setNewDuration(durationDays);
    } catch (error) {
      console.error('Error fetching free trial duration:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch current free trial duration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFreeTrialDuration = async () => {
    if (!hasChanges) return;

    try {
      setIsUpdating(true);
      // Replace with your actual contract call to update the free trial duration
      const tx = await client
        ?.useABI(SubscriptionABI)
        .set_trial_subscription_duration({
          type_arguments: [],
          arguments: [newDuration],
        });

      toast({
        title: 'Success',
        description: (
          <div>
            <p>Free trial duration updated successfully!</p>
            {tx?.hash && (
              <a
                href={`https://explorer.aptoslabs.com/txn/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 mt-2"
              >
                View transaction <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
          </div>
        ),
        variant: 'default',
      });

      setCurrentDuration(newDuration);
    } catch (error) {
      console.error('Error updating free trial duration:', error);
      toast({
        title: 'Error',
        description: `Failed to update free trial duration: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-700">
            Current Duration:
          </h3>
        </div>
        <span className="text-lg font-bold text-gray-900">
          {currentDuration} {currentDuration === 1 ? 'day' : 'days'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="duration-slider"
            className="text-sm font-medium text-gray-700"
          >
            New Duration:
          </label>
          <span className="text-lg font-bold text-blue-600">
            {newDuration} {newDuration === 1 ? 'day' : 'days'}
          </span>
        </div>

        <Slider
          id="duration-slider"
          min={1}
          max={30}
          step={1}
          value={[newDuration]}
          onValueChange={(value) => setNewDuration(value[0])}
          className="py-4"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>1 day</span>
          <span>15 days</span>
          <span>30 days</span>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={updateFreeTrialDuration}
          disabled={!hasChanges || isUpdating}
          className={`${
            hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'
          } text-white px-6 py-2 rounded-md transition-colors`}
        >
          {isUpdating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Updating...
            </>
          ) : (
            'Update Duration'
          )}
        </Button>
      </div>
    </div>
  );
};

export default FreeTrialDuration;
