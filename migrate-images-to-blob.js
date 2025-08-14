import dotenv from 'dotenv'
import { VercelBlobStorageService } from './src/lib/vercelBlobStorage.ts'
import connectDB from './src/lib/mongodb.ts'
import ProductType from './src/models/ProductType.ts'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

async function migrateImagesToBlob() {
  try {
    console.log('Environment check:')
    console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Not set')
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set')
    
    console.log('Connecting to database...')
    await connectDB()
    
    console.log('Fetching product types with legacy images...')
    const productTypes = await ProductType.find({
      image: { $exists: true, $ne: '' },
      blobUrl: { $exists: false }
    })
    
    console.log(`Found ${productTypes.length} product types to migrate`)
    
    const blobService = new VercelBlobStorageService()
    
    for (const productType of productTypes) {
      try {
        console.log(`Migrating ${productType.name}...`)
        
        // Construct file path
        const imagePath = productType.image.startsWith('/') 
          ? productType.image.slice(1) 
          : productType.image
        const fullPath = path.join(process.cwd(), 'public', imagePath)
        
        if (!fs.existsSync(fullPath)) {
          console.log(`File not found: ${fullPath}, skipping...`)
          continue
        }
        
        // Read file
        const fileBuffer = fs.readFileSync(fullPath)
        const fileName = path.basename(imagePath)
        const fileExtension = path.extname(fileName)
        
        // Determine MIME type
        let mimeType = 'image/jpeg'
        if (fileExtension.toLowerCase() === '.png') mimeType = 'image/png'
        else if (fileExtension.toLowerCase() === '.gif') mimeType = 'image/gif'
        else if (fileExtension.toLowerCase() === '.webp') mimeType = 'image/webp'
        
        // Create File object from buffer
        const file = new File([fileBuffer], fileName, { type: mimeType })
        
        // Upload to Vercel Blob
        const result = await blobService.uploadImage(
          file,
          `product-type-${productType.name}${fileExtension}`
        )
        
        if (result.success && result.url) {
          // Update database
          await ProductType.findByIdAndUpdate(productType._id, {
            blobUrl: result.url
          })
          
          console.log(`✅ Migrated ${productType.name}: ${result.url}`)
        } else {
          console.log(`❌ Failed to upload ${productType.name}: ${result.error}`)
        }
        
      } catch (error) {
        console.error(`Error migrating ${productType.name}:`, error)
      }
    }
    
    console.log('Migration completed!')
    process.exit(0)
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateImagesToBlob()