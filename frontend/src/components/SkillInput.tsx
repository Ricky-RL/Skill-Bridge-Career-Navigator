'use client';

import { useState, KeyboardEvent } from 'react';
import Input from './ui/Input';
import SkillTag from './ui/SkillTag';

interface SkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function SkillInput({
  skills,
  onChange,
  placeholder = 'Type a skill and press Enter',
  label = 'Skills',
  error,
}: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newSkill = inputValue.trim();
      if (!skills.includes(newSkill)) {
        onChange([...skills, newSkill]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((skill) => skill !== skillToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map((skill) => (
            <SkillTag
              key={skill}
              skill={skill}
              variant="info"
              onRemove={() => removeSkill(skill)}
            />
          ))}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? placeholder : 'Add another skill...'}
          className="w-full border-none outline-none text-sm"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Press Enter to add a skill, Backspace to remove the last one
      </p>
    </div>
  );
}
