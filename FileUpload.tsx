
import React from 'react';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  label: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, label }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUpload(content);
      };
      reader.readAsText(file);
    }
     // Reset the input value to allow uploading the same file again
    event.target.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      <input
        type="file"
        accept=".json, .txt"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-50 hover:file:bg-amber-700 cursor-pointer"
      />
    </div>
  );
};
