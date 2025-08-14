import { NextRequest, NextResponse } from 'next/server'
import { VercelBlobStorageService } from '@/lib/vercelBlobStorage'
import connectDB from '@/lib/mongodb'
import ProductType from '@/models/ProductType'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  return await migrateImages()
}

export async function POST(request: NextRequest) {
  return await migrateImages()
}

async function migrateImages() {
  try {
    console.log('Starting image migration...')
    await connectDB()
    
    // Get product types with legacy images
    const productTypes = await ProductType.find({
      image: { $exists: true, $ne: '' },
      blobUrl: { $exists: false }
    })
    
    console.log(`Found ${productTypes.length} product types to migrate`)
    const results = []
    
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
          results.push({
            name: productType.name,
            status: 'skipped',
            reason: 'File not found'
          })
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
        const result = await VercelBlobStorageService.uploadImage(
          file,
          `product-type-${productType.name}${fileExtension}`
        )
        
        if (result.success && result.url) {
          // Update database
          await ProductType.findByIdAndUpdate(productType._id, {
            blobUrl: result.url
          })
          
          console.log(`✅ Migrated ${productType.name}: ${result.url}`)
          results.push({
            name: productType.name,
            status: 'success',
            url: result.url
          })
        } else {
          console.log(`❌ Failed to upload ${productType.name}: ${result.error}`)
          results.push({
            name: productType.name,
            status: 'failed',
            error: result.error
          })
        }
        
      } catch (error) {
        console.error(`Error migrating ${productType.name}:`, error)
        results.push({
          name: productType.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}