import React, { useState } from 'react';
import { Button } from './button';
import { Edit2, Check } from 'lucide-react';

interface UserButtonArrayProps {
  onEdit: (newContent: string) => void;
  content: string;
}

export function UserButtonArray({ onEdit, content }: UserButtonArrayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleEditClick = () => {
    if (isEditing) {
      onEdit(editedContent);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="flex justify-start mt-2">
      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-2 border rounded"
        />
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className="active:bg-blue-200"
        onClick={handleEditClick}
      >
        {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
