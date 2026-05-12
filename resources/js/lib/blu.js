export async function compressWithBlu(file, maxDimension = 1600, quality = 0.78) {
  if (!file || !file.type.startsWith('image/')) return file

  const imageBitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height))
  const width = Math.round(imageBitmap.width * ratio)
  const height = Math.round(imageBitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imageBitmap, 0, 0, width, height)

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
  return new File([blob], file.name.replace(/\.(jpe?g|png|webp)$/i, '.jpg'), { type: 'image/jpeg' })
}
