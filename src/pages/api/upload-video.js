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
    let videoData = null;
    let fileName = 'product-video';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry = formData.get('video') || formData.get('file');

      if (!fileEntry || typeof fileEntry !== 'object' || typeof fileEntry.arrayBuffer !== 'function') {
        return jsonResponse(
          {
            success: false,
            error: 'No video file found in the request.',
          },
          { status: 400 }
        );
      }

      const mimeType = fileEntry.type || 'video/mp4';
      if (!mimeType.startsWith('video/')) {
        return jsonResponse(
          {
            success: false,
            error: `Invalid file type: ${mimeType}. Please upload a valid video file (MP4, WebM, MOV, etc.).`,
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await fileEntry.arrayBuffer());

      // Limit video size (100MB Cloudinary limit)
      if (buffer.length > 100 * 1024 * 1024) {
        return jsonResponse(
          {
            success: false,
            error: 'Video file size exceeds the 100MB limit. Please compress or choose a shorter video.',
          },
          { status: 400 }
        );
      }

      videoData = `data:${mimeType};base64,${buffer.toString('base64')}`;
      fileName = fileEntry.name || 'product-video';
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      videoData = body.video || body.file || body.url;
    } else {
      return jsonResponse(
        {
          success: false,
          error: 'Unsupported content type. Expected multipart/form-data or application/json.',
        },
        { status: 400 }
      );
    }

    if (!videoData) {
      return jsonResponse(
        {
          success: false,
          error: 'No video received. Please choose a video file to upload.',
        },
        { status: 400 }
      );
    }

    // Upload video to Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'products';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const uploadBody = new URLSearchParams();
    uploadBody.append('file', videoData);
    uploadBody.append('api_key', apiKey);
    uploadBody.append('timestamp', timestamp.toString());
    uploadBody.append('folder', folder);
    uploadBody.append('signature', signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        body: uploadBody,
      }
    );

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok) {
      console.error('Cloudinary video upload error:', cloudinaryData);
      return jsonResponse(
        {
          success: false,
          error: cloudinaryData.error?.message || 'Failed to upload video to Cloudinary.',
        },
        { status: 502 }
      );
    }

    return jsonResponse({
      success: true,
      url: cloudinaryData.secure_url || cloudinaryData.url,
      duration: cloudinaryData.duration,
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      format: cloudinaryData.format,
      message: 'Video successfully uploaded to Cloudinary.',
    });
  } catch (error) {
    console.error('Video upload server error:', error);
    return jsonResponse(
      {
        success: false,
        error: error.message || 'Internal server error while uploading video.',
      },
      { status: 500 }
    );
  }
}
