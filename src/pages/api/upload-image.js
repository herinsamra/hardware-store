export const prerender = false;

import crypto from 'crypto';
import { jsonResponse } from '../../lib/cacheHeaders.js';

export async function POST({ request }) {
  try {
    const cloudName =
      import.meta.env?.CLOUDINARY_CLOUD_NAME ||
      import.meta.env?.PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.PUBLIC_CLOUDINARY_CLOUD_NAME ||
      'dthi2vgiz';

    const apiKey =
      import.meta.env?.CLOUDINARY_API_KEY ||
      import.meta.env?.PUBLIC_CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY ||
      process.env.PUBLIC_CLOUDINARY_API_KEY;

    const apiSecret =
      import.meta.env?.CLOUDINARY_API_SECRET ||
      import.meta.env?.PUBLIC_CLOUDINARY_API_SECRET ||
      process.env.CLOUDINARY_API_SECRET ||
      process.env.PUBLIC_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return jsonResponse(
        {
          success: false,
          error: 'Cloudinary credentials are not configured on the server. Please check .env file.',
        },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const filesToUpload = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      // Collect all potential file fields
      const fileEntries = [
        ...formData.getAll('files'),
        ...formData.getAll('file'),
        ...formData.getAll('images'),
        ...formData.getAll('image'),
      ];

      for (const entry of fileEntries) {
        if (entry && typeof entry === 'object' && typeof entry.arrayBuffer === 'function') {
          // File object
          const buffer = Buffer.from(await entry.arrayBuffer());
          const mimeType = entry.type || 'image/jpeg';

          if (!mimeType.startsWith('image/')) {
            return jsonResponse(
              {
                success: false,
                error: `Invalid file type: ${mimeType}. Please upload only images.`,
              },
              { status: 400 }
            );
          }

          // Check file size (e.g., 10MB limit)
          if (buffer.length > 10 * 1024 * 1024) {
            return jsonResponse(
              {
                success: false,
                error: `File "${entry.name || 'image'}" exceeds maximum allowed size (10MB).`,
              },
              { status: 400 }
            );
          }

          const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
          filesToUpload.push({
            data: base64Data,
            name: entry.name || 'uploaded-image',
          });
        }
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const items = Array.isArray(body.files)
        ? body.files
        : body.file
        ? [body.file]
        : Array.isArray(body.images)
        ? body.images
        : body.image
        ? [body.image]
        : [];

      for (const item of items) {
        if (typeof item === 'string' && (item.startsWith('data:image/') || item.startsWith('http'))) {
          filesToUpload.push({
            data: item,
            name: 'image',
          });
        }
      }
    } else {
      return jsonResponse(
        {
          success: false,
          error: 'Unsupported content type. Expected multipart/form-data or application/json.',
        },
        { status: 400 }
      );
    }

    if (filesToUpload.length === 0) {
      return jsonResponse(
        {
          success: false,
          error: 'No image files received in request. Please select at least one image file.',
        },
        { status: 400 }
      );
    }

    // Upload each file to Cloudinary with secure signature
    const uploadedUrls = [];
    const folder = 'products';

    for (const fileObj of filesToUpload) {
      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const uploadBody = new URLSearchParams();
      uploadBody.append('file', fileObj.data);
      uploadBody.append('api_key', apiKey);
      uploadBody.append('timestamp', timestamp.toString());
      uploadBody.append('folder', folder);
      uploadBody.append('signature', signature);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadBody,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        console.error('Cloudinary upload error:', cloudinaryData);
        return jsonResponse(
          {
            success: false,
            error: cloudinaryData.error?.message || 'Failed to upload image to Cloudinary.',
          },
          { status: 502 }
        );
      }

      uploadedUrls.push(cloudinaryData.secure_url || cloudinaryData.url);
    }

    return jsonResponse({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
      message: `Successfully uploaded ${uploadedUrls.length} image(s) to Cloudinary.`,
    });
  } catch (error) {
    console.error('Image upload server error:', error);
    return jsonResponse(
      {
        success: false,
        error: error.message || 'Internal server error while uploading image.',
      },
      { status: 500 }
    );
  }
}
