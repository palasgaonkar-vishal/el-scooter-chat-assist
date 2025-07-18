
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type ScooterModel = Database['public']['Enums']['scooter_model'];

const SCOOTER_MODELS: Array<{
  id: ScooterModel;
  name: string;
  description: string;
}> = [
  {
    id: '450S',
    name: '450S',
    description: 'Entry-level electric scooter with great range',
  },
  {
    id: '450X',
    name: '450X',
    description: 'High-performance electric scooter',
  },
  {
    id: 'Rizta',
    name: 'Rizta',
    description: 'Family-friendly electric scooter',
  },
];

interface ScooterModelSelectorProps {
  selectedModels: ScooterModel[];
  onSelectionChange: (models: ScooterModel[]) => void;
  disabled?: boolean;
}

export const ScooterModelSelector: React.FC<ScooterModelSelectorProps> = ({
  selectedModels,
  onSelectionChange,
  disabled = false,
}) => {
  const handleModelToggle = (modelId: ScooterModel) => {
    if (disabled) return;

    const updatedModels = selectedModels.includes(modelId)
      ? selectedModels.filter(id => id !== modelId)
      : [...selectedModels, modelId];

    onSelectionChange(updatedModels);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {SCOOTER_MODELS.map((model) => (
          <Card
            key={model.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedModels.includes(model.id)
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleModelToggle(model.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedModels.includes(model.id)}
                  onChange={() => handleModelToggle(model.id)}
                  disabled={disabled}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{model.name}</h3>
                    {selectedModels.includes(model.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {model.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedModels.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Selected Models:</p>
          <div className="flex flex-wrap gap-2">
            {selectedModels.map((modelId) => (
              <Badge key={modelId} variant="default">
                {modelId}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
