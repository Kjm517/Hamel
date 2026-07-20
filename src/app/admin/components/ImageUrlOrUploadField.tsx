import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X } from 'lucide-react';
import {
  buildMediaStoragePath,
  isStorageObjectPath,
  resolveStorageImageUrl,
  uploadToPublicStorage,
} from '../../lib/storage';

const MAX_IMAGE_UPLOAD_MB = 25;
const MAX_VIDEO_UPLOAD_MB = 300;

interface ImageUrlOrUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  hint?: string;
  /** Allow MP4 video uploads in addition to images. */
  allowVideo?: boolean;
  previewAsVideo?: boolean;
  onMediaTypeChange?: (type: 'image' | 'video') => void;
  /**
   * Upload files to the API (Cloudinary / uploads). Default: on.
   * Pass `false` only if you intentionally want a local data-URL embed (not for production banners).
   */
  remoteUpload?: false | {
    getObjectPath?: (file: File) => string;
  };
}

export function ImageUrlOrUploadField({
  label,
  value,
  onChange,
  placeholder = 'https://... or /hamel/...',
  hint,
  allowVideo = false,
  previewAsVideo = false,
  onMediaTypeChange,
  remoteUpload = {},
}: ImageUrlOrUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const useRemoteUpload = remoteUpload !== false;

  const previewSrc = resolveStorageImageUrl(value) ?? value;
  const isVideo = previewAsVideo || /\.(mp4)(?:[?#]|$)/i.test(value);
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    setPreviewBroken(false);
  }, [value]);

  const readFile = async (file: File) => {
    setUploadError(null);
    const mediaType = file.type === 'video/mp4' ? 'video' : 'image';
    if (!file.type.startsWith('image/') && !(allowVideo && mediaType === 'video')) {
      setUploadError(
        allowVideo
          ? 'Please choose an image or an MP4 video.'
          : 'Please choose an image file (PNG, JPG, WebP, etc.).'
      );
      return;
    }
    const maxUploadMB = mediaType === 'video' ? MAX_VIDEO_UPLOAD_MB : MAX_IMAGE_UPLOAD_MB;
    if (file.size > maxUploadMB * 1024 * 1024) {
      setUploadError(`File must be ${maxUploadMB} MB or smaller.`);
      return;
    }
    if (useRemoteUpload) {
      setUploading(true);
      try {
        const objectPath =
          (typeof remoteUpload === 'object' ? remoteUpload.getObjectPath?.(file) : undefined) ??
          buildMediaStoragePath(file, 'media');
        const publicUrl = await uploadToPublicStorage(file, objectPath);
        onChange(publicUrl);
        onMediaTypeChange?.(mediaType);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.onerror = () => setUploadError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void readFile(file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const isDataUrl = value.startsWith('data:');
  const isStoragePath = isStorageObjectPath(value);

  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-gray-500">{hint}</p>}

      {value ? (
        <div className="mb-2 flex items-start gap-3">
          {isVideo ? (
            <video
              src={previewSrc}
              className="h-16 w-24 shrink-0 rounded-lg border border-gray-200 object-cover"
              controls
              muted
            />
          ) : previewBroken ? (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-1 text-center text-[10px] font-medium text-amber-800">
              Missing file — re-upload
            </div>
          ) : (
            <img
              src={previewSrc}
              alt=""
              className="h-16 w-24 shrink-0 rounded-lg border border-gray-200 object-cover"
              onError={() => setPreviewBroken(true)}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-500" title={value}>
              {isDataUrl
                ? 'Embedded media (use upload URL for production)'
                : isStoragePath
                  ? `Upload: ${value}`
                  : value}
            </p>
            {previewBroken ? (
              <p className="mt-1 text-xs text-amber-700">
                This path is saved but the file is not available. Upload again, then Save profile.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onChange('')}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
              Remove image
            </button>
          </div>
        </div>
      ) : null}

      <input
        type="text"
        value={isDataUrl ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          useRemoteUpload ? 'Upload below, or paste a public image URL' : placeholder
        }
        className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={allowVideo ? 'image/*,video/mp4' : 'image/*'}
        className="hidden"
        onChange={onFileInput}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${
          dragOver
            ? 'border-[#0EA5E9] bg-[#E0F2FE]'
            : 'border-gray-300 bg-gray-50 hover:border-[#0EA5E9] hover:bg-[#F0F9FF]'
        }`}
      >
        <Upload className="mb-1 h-5 w-5 text-gray-400" />
        <span className="text-xs font-medium text-gray-700">
          {uploading ? 'Uploading…' : allowVideo ? 'Upload image or MP4 video' : 'Upload image'}
        </span>
        <span className="text-[10px] text-gray-500">
          {useRemoteUpload
            ? allowVideo
              ? `→ Cloud storage · images max ${MAX_IMAGE_UPLOAD_MB} MB · MP4 max ${MAX_VIDEO_UPLOAD_MB} MB`
              : `→ Cloud storage · max ${MAX_IMAGE_UPLOAD_MB} MB`
            : `or drag & drop · max ${MAX_IMAGE_UPLOAD_MB} MB`}
        </span>
      </div>

      {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}
