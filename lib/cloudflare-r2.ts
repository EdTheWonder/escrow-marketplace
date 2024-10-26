import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dnwxgyfrs',
  api_key: '948513622955145',
  api_secret: 'NUQa3HuBa57xw439stAf9bx8pjE',
  secure: true
});

export async function uploadToR2(file: File): Promise<string> {
  try {
    // Convert File to base64
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.type};base64,${base64Data}`,
        {
          folder: 'buyby',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteFromR2(url: string) {
  try {
    // Extract public_id from URL
    const publicId = url.split('/').slice(-2).join('/').split('.')[0];
    
    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        (error, result) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete file');
  }
}
