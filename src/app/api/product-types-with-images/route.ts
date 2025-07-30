import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProductType from '@/models/ProductType'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET - Lấy danh sách product types với base64 images
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Lấy chỉ những product types đang active
    const productTypes = await ProductType.find({ isActive: true })
      .sort({ order: 1, displayName: 1 })
      .select('name displayName color image description order')
    
    // Convert images to base64
    const productTypesWithBase64 = await Promise.all(
      productTypes.map(async (type) => {
        const typeObj = type.toObject()
        
        if (typeObj.image) {
          try {
            // Remove leading slash if present to avoid path issues
            const cleanImagePath = typeObj.image.startsWith('/') ? typeObj.image.slice(1) : typeObj.image
            const imagePath = join(process.cwd(), 'public', cleanImagePath)
            
            if (existsSync(imagePath)) {
              const imageBuffer = await readFile(imagePath)
              const ext = typeObj.image.split('.').pop()?.toLowerCase()
              let mimeType = 'image/jpeg'
              
              switch (ext) {
                case 'png':
                  mimeType = 'image/png'
                  break
                case 'gif':
                  mimeType = 'image/gif'
                  break
                case 'webp':
                  mimeType = 'image/webp'
                  break
              }
              
              typeObj.imageBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`
            }
          } catch (error) {
            console.error(`Error reading image for ${typeObj.name}:`, error)
          }
        }
        
        return typeObj
      })
    )

    return NextResponse.json({ productTypes: productTypesWithBase64 }, { status: 200 })

  } catch (error) {
    console.error('Get product types with images error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}