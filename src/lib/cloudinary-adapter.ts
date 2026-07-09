import { v2 as cloudinary } from 'cloudinary'
import type { HandleUpload, HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',

  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`,
          overwrite: false,
          use_filename: true,
        },
        (error, result) => {
          if (error) return reject(error)
          if (!result) return reject(new Error('No result returned from Cloudinary'))
          resolve(result)
        },
      )
      uploadStream.end(file.buffer)
    })
    // Return metadata instead of mutating `file` — mutation is a no-op under the
    // afterChange-hook architecture in @payloadcms/plugin-cloud-storage@3.85.2
    // (RESEARCH.md Pitfall 1).
    return {
      filename: uploadResult.public_id,
      mimeType: uploadResult.format,
      filesize: uploadResult.bytes,
    }
  },

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      await cloudinary.uploader.destroy(`media/${filename.replace(/\.[^/.]+$/, '')}`)
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },

  generateFileURL(filename: string) {
    // f_auto,q_auto per MEDIA-03 — official Cloudinary syntax.
    return cloudinary.url(`media/${filename}`, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto',
    })
  },

  staticHandler() {
    return new Response('Not implemented', { status: 501 })
  },
})
