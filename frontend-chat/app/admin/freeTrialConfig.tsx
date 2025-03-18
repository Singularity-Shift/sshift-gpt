'use client';
import { useState, useEffect } from 'react';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { Switch } from '../../src/components/ui/switch';
import { Label } from '../../src/components/ui/label';
import { toast } from '../../src/components/ui/use-toast';
import { useAppManagment } from '../../src/context/AppManagment';
import { FeatureType, IAdminConfig } from '@helpers';
import { AddFeature } from './addFeature';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ConfirmButton } from '../../src/components/ui/confirm-button';

export const FreeTrialConfig = () => {
  const [credits, setCredits] = useState<number>(100);
  const [duration, setDuration] = useState<number>(7);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [requireEmail, setRequireEmail] = useState<boolean>(true);
  const [maxActiveTrials, setMaxActiveTrials] = useState<number>(1000);
  const [limitPerIP, setLimitPerIP] = useState<number>(1);
  const [geoTargeting, setGeoTargeting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminConfig, setAdminConfig] = useState<IAdminConfig>({
    models: [],
    tools: [],
  });
  const { isAdmin } = useAppManagment();

  const disabledConfirmButton =
    adminConfig.models.some((m) => m.name === '' || m.credits === 0) &&
    adminConfig.tools.some((t) => t.name === '' || t.credits === 0);

  // Mock function to simulate fetching current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Mock data - replace with actual API call
        const mockSettings = {
          credits: 100,
          duration: 7,
          enabled: true,
          requireEmail: true,
          maxActiveTrials: 1000,
          limitPerIP: 1,
          geoTargeting: false,
          adminConfig: {
            models: [
              { name: 'GPT-4', credits: 10 },
              { name: 'GPT-3.5', credits: 5 }
            ],
            tools: [
              { name: 'Code Analysis', credits: 3 },
              { name: 'Image Generation', credits: 8 }
            ]
          }
        };
        
        setCredits(mockSettings.credits);
        setDuration(mockSettings.duration);
        setEnabled(mockSettings.enabled);
        setRequireEmail(mockSettings.requireEmail);
        setMaxActiveTrials(mockSettings.maxActiveTrials);
        setLimitPerIP(mockSettings.limitPerIP);
        setGeoTargeting(mockSettings.geoTargeting);
        setAdminConfig(mockSettings.adminConfig);
      } catch (error) {
        console.error('Error fetching free trial settings:', error);
        toast({
          title: 'Error fetching settings',
          description: 'Could not load free trial settings',
          variant: 'destructive',
        });
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      // Mock API call - replace with actual implementation
      // await api.updateFreeTrialSettings({ 
      //   credits, duration, enabled, requireEmail, maxActiveTrials, 
      //   limitPerIP, geoTargeting, adminConfig 
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Settings Updated',
        description: 'Free trial settings have been updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating free trial settings:', error);
      toast({
        title: 'Error',
        description: 'Could not update free trial settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddModel = () => {
    setAdminConfig({
      ...adminConfig,
      models: [...adminConfig.models, { name: '', credits: 0 }],
    });
  };

  const onRemoveModel = (index: number) => {
    setAdminConfig({
      ...adminConfig,
      models: adminConfig.models.filter((_, i) => i !== index),
    });
  };

  const onAddTool = () => {
    setAdminConfig({
      ...adminConfig,
      tools: [...adminConfig.tools, { name: '', credits: 0 }],
    });
  };

  const onRemoveTool = (index: number) => {
    setAdminConfig({
      ...adminConfig,
      tools: adminConfig.tools.filter((_, i) => i !== index),
    });
  };

  const onChangeModelName = (index: number, name: string) => {
    setAdminConfig({
      ...adminConfig,
      models: [
        ...adminConfig.models.map((m, i) => {
          const value = { ...m };
          if (i === index) {
            value.name = name;
          }
          return value;
        }),
      ],
    });
  };

  const onChangeModelCredits = (index: number, credits: number) => {
    setAdminConfig({
      ...adminConfig,
      models: [
        ...adminConfig.models.map((m, i) => {
          const value = { ...m };
          if (i === index) {
            value.credits = credits;
          }
          return value;
        }),
      ],
    });
  };

  const onChangeToolName = (index: number, name: string) => {
    setAdminConfig({
      ...adminConfig,
      tools: [
        ...adminConfig.tools.map((t, i) => {
          if (i === index) {
            return { ...t, name };
          }
          return t;
        }),
      ],
    });
  };

  const onChangeToolCredits = (index: number, credits: number) => {
    setAdminConfig({
      ...adminConfig,
      tools: [
        ...adminConfig.tools.map((t, i) => {
          if (i === index) {
            return { ...t, credits };
          }
          return t;
        }),
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="free-trial-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor="free-trial-enabled" className={enabled ? "text-gray-900" : "text-gray-500"}>
            Enable Free Trial Accounts
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="require-email"
            checked={requireEmail}
            onCheckedChange={setRequireEmail}
          />
          <Label htmlFor="require-email" className={requireEmail ? "text-gray-900" : "text-gray-500"}>
            Require Email Registration & Verification
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="geo-targeting"
            checked={geoTargeting}
            onCheckedChange={setGeoTargeting}
          />
          <Label htmlFor="geo-targeting" className={geoTargeting ? "text-gray-900" : "text-gray-500"}>
            Enable Geo-Targeting
          </Label>
        </div>

        <LabeledInput
          id="free-trial-credits"
          label="Available Credits"
          tooltip="Number of credits available for free trial accounts"
          required={true}
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          type="number"
          min={1}
        />
        
        <LabeledInput
          id="free-trial-duration"
          label="Trial Duration (days)"
          tooltip="Duration of the free trial in days"
          required={true}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          type="number"
          min={1}
        />

        <LabeledInput
          id="max-active-trials"
          label="Max Active Trials"
          tooltip="Maximum number of active free trials allowed at once"
          required={true}
          value={maxActiveTrials}
          onChange={(e) => setMaxActiveTrials(Number(e.target.value))}
          type="number"
          min={1}
        />

        <LabeledInput
          id="limit-per-ip"
          label="Limit Per IP"
          tooltip="Maximum number of free trials allowed per IP address"
          required={true}
          value={limitPerIP}
          onChange={(e) => setLimitPerIP(Number(e.target.value))}
          type="number"
          min={1}
        />
      </div>

      {/* Models and Tools Configuration */}
      <div className="space-y-8 pt-4 border-t">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Models Configuration</h2>
          <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-center">
            <div className="font-medium text-sm text-gray-700">Model Name</div>
            <div className="font-medium text-sm text-gray-700">Uses Per Day</div>
            <div></div>
          </div>
          {adminConfig.models.map((model, index) => (
            <AddFeature
              featureType={FeatureType.Models}
              index={index}
              name={model.name}
              credits={model.credits}
              isUpdating={isLoading}
              key={`model-${index}`}
              onAdd={onAddModel}
              onRemove={() => onRemoveModel(index)}
              onChangeCredits={onChangeModelCredits}
              onChangeName={onChangeModelName}
            />
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Tools Configuration</h2>
          <div className="grid grid-cols-[1fr,1fr,auto,auto] gap-4 items-center">
            <div className="font-medium text-sm text-gray-700">Tool Name</div>
            <div className="font-medium text-sm text-gray-700">Uses Per Day</div>
            <div></div>
            <div></div>
          </div>
          {adminConfig.tools.map((tool, index) => (
            <AddFeature
              featureType={FeatureType.Tools}
              index={index}
              name={tool.name}
              credits={tool.credits}
              isUpdating={isLoading}
              key={`tool-${index}`}
              onAdd={onAddTool}
              onRemove={() => onRemoveTool(index)}
              onChangeCredits={onChangeToolCredits}
              onChangeName={onChangeToolName}
            />
          ))}
        </div>
      </div>
      
      <div className="pt-4">
        <ConfirmButton
          variant="green"
          title="Save Config"
          onSubmit={handleSaveSettings}
          disabled={disabledConfirmButton}
          confirmMessage={
            <p>
              This action will update the free trial settings and feature configuration.
              Do you want to proceed?
            </p>
          }
        />
      </div>

      <LoadingSpinner on={isLoading} />
    </div>
  );
}; 