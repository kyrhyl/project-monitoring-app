import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  file: Buffer,
  filename: string,
  folder: string = 'project-files'
): Promise<{
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
}> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${folder}/${Date.now()}-${filename}`,
        resource_type: 'auto', // Automatically detect file type
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            original_filename: result.original_filename || filename,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    ).end(file);
  });
};

export const deleteFromCloudinary = async (public_id: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export const generateCloudinaryUrl = (
  public_id: string,
  transformations?: string
): string => {
  if (transformations) {
    return cloudinary.url(public_id, { transformation: transformations });
  }
  return cloudinary.url(public_id);
};

export default cloudinary;