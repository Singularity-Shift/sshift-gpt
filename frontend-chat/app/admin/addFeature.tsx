import { FeatureType } from '@helpers';
import { Button } from '../../src/components/ui/button';
import { LabeledInput } from '../../src/components/ui/labeled-input';

interface AddFeaturesProps {
  isUpdating: boolean;
  index: number;
  featureType: FeatureType;
  name?: string;
  credits?: number;
  onChangeName: (index: number, value: string) => void;
  onChangeCredits: (index: number, value: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export const AddFeature = (props: AddFeaturesProps) => {
  const {
    isUpdating,
    index,
    name,
    featureType,
    credits,
    onChangeName,
    onChangeCredits,
    onAdd,
    onRemove,
  } = props;

  return (
    <div className="flex flex-wrap items-end space-x-4">
      <div className="flex-1">
        <LabeledInput
          id={`feature-${featureType}-${index}`}
          label="Name"
          tooltip="Model or tool name to be added"
          required={index === 0}
          value={name}
          onChange={(e) => onChangeName(index, e.target.value)}
          disabled={isUpdating}
          type="text"
        />
      </div>
      <div className="flex-1">
        <LabeledInput
          id={`feature-credits-${featureType}-${index}`}
          label="Credits"
          tooltip="Model or tool credits to be added"
          required={index === 0}
          value={credits}
          disabled={isUpdating}
          onChange={(e) => onChangeCredits(index, parseInt(e.target.value))}
          type="number"
        />
      </div>
      <div className="w-auto">
        <Button variant="default" onClick={onAdd}>
          Add
        </Button>
      </div>

      {index !== 0 && (
        <div className="w-auto">
          <Button variant="destructive" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};
