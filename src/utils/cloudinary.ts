/**
 * Cloudinary 图片 URL 构建工具
 * 环境变量：PUBLIC_CLOUDINARY_CLOUD_NAME
 */

const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';

interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
}

/** 构建 Cloudinary 图片 URL */
export function getCloudinaryUrl(publicId: string, options?: CloudinaryOptions): string {
  const transforms: string[] = [];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);
  transforms.push(options?.quality || 'q_auto');
  transforms.push(options?.format || 'f_auto');
  const transformStr = transforms.join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}/${publicId}`;
}

/** 图库缩略图（400x300 裁剪填充） */
export function getGalleryThumbnail(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 400, height: 300, crop: 'fill' });
}

/** 首页幻灯片（1200x800 裁剪填充，匹配 3:2 宽屏） */
export function getGallerySlide(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 1200, height: 800, crop: 'fill' });
}

/** 全屏查看（2560px 宽度，匹配 Retina 高分屏） */
export function getGalleryFullscreen(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 2560 });
}

/** 图库大图（最大宽度 1920） */
export function getGalleryFullSize(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 1920 });
}
