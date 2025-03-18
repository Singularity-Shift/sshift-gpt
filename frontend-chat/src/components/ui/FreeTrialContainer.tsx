import React from 'react';
import { Sparkles, Gift } from 'lucide-react';
import { Button } from './button';

interface FreeTrialContainerProps {
  onStartFreeTrial: () => Promise<void>;
}

export const FreeTrialContainer: React.FC<FreeTrialContainerProps> = ({
  onStartFreeTrial,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleStartFreeTrial = async () => {
    setIsLoading(true);
    try {
      await onStartFreeTrial();
    } catch (error) {
      console.error('Error starting free trial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] h-[600px] bg-white bg-opacity-90 p-6 lg:p-10 rounded-xl shadow-lg border border-gray-300 flex flex-col">
      <div className="text-center mt-6">
        <div className="flex items-center justify-center">
          <Gift className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            Start Free Trial
          </h2>
          <Gift className="w-5 h-5 text-blue-500 ml-2" />
        </div>
        <p className="mt-2 text-sm text-gray-600">Try SShift GPT risk-free</p>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-700 text-center font-semibold">
            2-day free trial
          </p>
        </div>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <p>Full access to SShift GPT</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <p>No commitment required</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <p>Test it to write code or content</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <p>Experience all features</p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Button
          onClick={handleStartFreeTrial}
          disabled={isLoading}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isLoading ? 'Starting...' : 'Start Free Trial'}
        </Button>
      </div>
    </div>
  );
}; 