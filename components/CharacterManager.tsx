
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useMemo, useRef, useState} from 'react';
import {Character, ImageFile} from '../types';
import {PlusIcon, TrashIcon, UserPlusIcon, XMarkIcon} from './icons';

interface CharacterManagerProps {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onDeleteCharacter: (id: string) => void;
  onSelectCharacter: (character: Character) => void;
  isOpen: boolean;
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64});
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const CharacterManager: React.FC<CharacterManagerProps> = ({
  characters,
  onAddCharacter,
  onDeleteCharacter,
  onSelectCharacter,
  isOpen,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAvatar, setNewAvatar] = useState<ImageFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview logic for the avatar upload
  const avatarPreviewUrl = useMemo(() => {
    return newAvatar ? URL.createObjectURL(newAvatar.file) : null;
  }, [newAvatar]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToBase64(file);
        setNewAvatar(imageFile);
      } catch (error) {
        console.error('Error processing avatar:', error);
      }
    }
  };

  const handleSave = () => {
    if (!newName.trim() || !newDescription.trim()) return;

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: newName.trim(),
      description: newDescription.trim(),
      avatar: newAvatar,
    };

    onAddCharacter(newCharacter);
    
    // Reset form
    setNewName('');
    setNewDescription('');
    setNewAvatar(null);
    setIsCreating(false);
  };

  const handleSelect = (char: Character) => {
    onSelectCharacter(char);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#2c2c2e]">
          <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
            <UserPlusIcon className="w-5 h-5 text-indigo-400" />
            Character Control Panel
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-600 rounded-full transition-colors text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {isCreating ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 hover:border-indigo-500 hover:bg-gray-600 flex items-center justify-center relative overflow-hidden transition-all group">
                    {avatarPreviewUrl ? (
                      <img
                        src={avatarPreviewUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PlusIcon className="w-8 h-8 text-gray-400 group-hover:text-white" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium transition-opacity">
                      {avatarPreviewUrl ? 'Change' : 'Add Photo'}
                    </div>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="flex-grow space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Cyber Samurai"
                      className="w-full bg-[#2c2c2e] border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Description (Visuals & Behavior)
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. Wears glowing neon armor, moves with fluid stealth, carries a katana."
                      rows={3}
                      className="w-full bg-[#2c2c2e] border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newName.trim() || !newDescription.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Save Character
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsCreating(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all group h-full min-h-[140px]">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:bg-indigo-600/20 transition-colors">
                  <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
                </div>
                <span className="text-gray-400 font-medium group-hover:text-white">
                  Create New Character
                </span>
              </button>

              {characters.map((char) => {
                 // Create a stable preview URL for existing chars if they have files
                 // Note: In a real app we'd use persistent URLs. Here we create objectURLs on the fly for the list.
                 // We don't clean them up here for simplicity in this list view, relying on browser GC or component unmount.
                 const preview = char.avatar ? URL.createObjectURL(char.avatar.file) : null;
                 
                 return (
                  <div
                    key={char.id}
                    className="relative bg-[#2c2c2e] rounded-xl p-4 border border-gray-700 group hover:border-gray-500 transition-colors flex gap-4">
                    <div className="shrink-0 w-16 h-16 rounded-full bg-gray-700 overflow-hidden">
                      {preview ? (
                        <img
                          src={preview}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-900/30 text-indigo-300 text-lg font-bold">
                          {char.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-200 truncate pr-6">
                          {char.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCharacter(char.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {char.description}
                      </p>
                      <button
                        onClick={() => handleSelect(char)}
                        className="mt-3 text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all w-full">
                        Use in Video
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterManager;
