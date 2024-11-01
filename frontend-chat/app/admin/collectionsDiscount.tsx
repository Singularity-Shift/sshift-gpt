import { Button } from '../../src/components/ui/button';
import { LabeledInput } from '../../src/components/ui/labeled-input';

interface CollectionDiscountProps {
  isUpdating: boolean;
  index: number;
  amount?: number;
  address?: string;
  onChangeAddress: (index: number, value: string) => void;
  onChangeDiscountPerDay: (index: number, value: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export const CollectionDiscoount = (props: CollectionDiscountProps) => {
  const {
    isUpdating,
    index,
    amount,
    address,
    onChangeAddress,
    onChangeDiscountPerDay,
    onAdd,
    onRemove,
  } = props;

  return (
    <div className="flex">
      <div className="w-4/6 m-2">
        <LabeledInput
          id={`collection-address-discount-${index}`}
          label="Collection address"
          tooltip="The collection address for dicount"
          required={index === 0}
          value={address}
          onChange={(e) => onChangeAddress(index, e.target.value)}
          disabled={isUpdating}
          type="text"
        />
      </div>
      <div className="w-4/6 m-2">
        <LabeledInput
          id={`discount-per-collection-${index}`}
          label="discount per collection"
          tooltip="The price discount per day per collection"
          required={index === 0}
          value={amount}
          onChange={(e) =>
            onChangeDiscountPerDay(index, parseFloat(e.target.value))
          }
          disabled={isUpdating}
          type="number"
        />
      </div>
      <div className="w-1/6 m-2 self-end">
        <Button variant="default" onClick={onAdd}>
          Add
        </Button>
      </div>

      {index !== 0 && (
        <div className="w-1/6 m-2 self-end">
          <Button variant="destructive" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};
