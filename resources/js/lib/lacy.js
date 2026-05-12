export async function compressWithLacy(file, targetKb = 400, minQuality = 0.55) {
  if (!file || !file.type.startsWith('image/')) return file

  const reader = new FileReader()
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const image = new Image()
  image.src = dataUrl
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  let quality = 0.86
  let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
  let sizeKb = blob.size / 1024

  while (sizeKb > targetKb && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.1)
    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    sizeKb = blob.size / 1024
  }

  if (blob.size >= file.size) {
    return file
  }

  return new File([blob], file.name.replace(/\.(jpe?g|png|webp)$/i, '.jpg'), { type: 'image/jpeg' })
}
