import React, { useState, useRef } from "react";

interface ModalUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList) => Promise<void>;
}

const MAX_FILE_SIZE_MB = 5; // Tamaño máximo por archivo en MB
const MAX_TOTAL_SIZE_MB = 20; // Tamaño máximo total en MB

const ModalUpload: React.FC<ModalUploadProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validación de tamaño de archivos
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Algunas imágenes superan el tamaño máximo de ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Validación de tamaño total
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      setError(`El tamaño total de las imágenes (${(totalSize/(1024*1024)).toFixed(2)}MB) supera el límite de ${MAX_TOTAL_SIZE_MB}MB`);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedFiles(files);
    setPreviewImages(newPreviews);
  };

  const handleRemoveImage = (index: number) => {
    if (isUploading) return;
    
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewImages];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewImages(newPreviews);
    setError(null);

    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach((file) => dataTransfer.items.add(file));
      
      await onUpload(dataTransfer.files);
      
      // Limpiar después de subida exitosa
      setSelectedFiles([]);
      setPreviewImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onClose();
    } catch (error: any) {
      console.error("Error al subir las imágenes:", error);
      
      // Manejo específico de errores
      if (error.response?.status === 413) {
        setError("El servidor rechazó las imágenes porque son demasiado grandes. Intenta con imágenes más pequeñas o menos cantidad.");
      } else if (error.code === "ERR_NETWORK" || error.message?.includes("CORS")) {
        setError("Problema de conexión con el servidor. Si estás en desarrollo local, esto puede ser un problema de CORS. Contacta al administrador.");
      } else {
        setError("Ocurrió un error al subir las imágenes. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Overlay de carga */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-blue-600 font-medium">
                Subiendo {selectedFiles.length} foto(s), por favor espera...
              </p>
            </div>
          </div>
        )}
        
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Subir Imágenes
          </h2>
          <button
            onClick={isUploading ? undefined : onClose}
            disabled={isUploading}
            className={`text-gray-600 hover:text-gray-800 text-2xl ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ×
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            {error.includes("CORS") && (
              <p className="mt-2 text-sm">
                Nota: Este error ocurre comúnmente en desarrollo local. En producción debería estar configurado correctamente.
              </p>
            )}
          </div>
        )}

        <label className={`flex flex-col items-center justify-center w-full h-48 px-4 transition bg-white border-2 border-dashed rounded-lg cursor-pointer ${
          isUploading 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : error 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
        }`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <div className="text-gray-400">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-sm">Subida en progreso...</p>
              </div>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  className={`w-10 h-10 mb-3 ${error ? 'text-red-400' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className={`mb-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
                  <span className="font-semibold">Haz clic para subir</span> o
                  arrastra tus imágenes
                </p>
                <p className={`text-xs ${error ? 'text-red-400' : 'text-gray-500'}`}>
                  PNG, JPG o JPEG (máx. {MAX_FILE_SIZE_MB}MB cada una, {MAX_TOTAL_SIZE_MB}MB en total)
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {previewImages.length > 0 && (
          <>
            <div className="mt-2 text-sm text-gray-500">
              {selectedFiles.length} imagen(es) seleccionada(s) - 
              Total: {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2)}MB
              {error && selectedFiles.some(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024) && (
                <span className="text-red-500 ml-2">(Algunas imágenes son demasiado grandes)</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto">
              {previewImages.map((img, index) => {
                const fileSizeMB = selectedFiles[index].size / (1024 * 1024);
                const isOversized = fileSizeMB > MAX_FILE_SIZE_MB;
                
                return (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${index}`}
                      className={`object-cover w-full h-24 rounded-md ${
                        isUploading ? 'opacity-70' : ''
                      } ${isOversized ? 'border-2 border-red-500' : ''}`}
                    />
                    {!isUploading && (
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                    <div className={`absolute bottom-1 left-1 text-white text-xs px-1 rounded ${
                      isOversized ? 'bg-red-500' : 'bg-black/50'
                    }`}>
                      {fileSizeMB.toFixed(2)}MB
                      {isOversized && ' ⚠️'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={isUploading ? undefined : onClose}
            disabled={isUploading}
            className={`px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || !!error}
            className={`px-4 py-2 rounded text-white flex items-center justify-center ${
              isUploading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : selectedFiles.length > 0 && !error
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-300 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Subiendo...
              </>
            ) : (
              'Subir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUpload;