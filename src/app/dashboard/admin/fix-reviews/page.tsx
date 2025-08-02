'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface ProductIssue {
  productId: string
  title: string
  currentRating: number
  expectedRating: number
  currentReviewCount: number
  expectedReviewCount: number
  actualReviews: number
}

interface CheckResult {
  totalProducts: number
  issuesFound: number
  issues: ProductIssue[]
}

interface FixResult {
  message: string
  totalProducts: number
  updatedProducts: number
}

export default function FixReviewsPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkProductRatings = async () => {
    setIsChecking(true)
    setError(null)
    setCheckResult(null)
    
    try {
      const response = await fetch('/api/admin/fix-product-ratings', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Lỗi khi kiểm tra')
      }
      
      const data = await response.json()
      setCheckResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsChecking(false)
    }
  }

  const fixProductRatings = async () => {
    setIsFixing(true)
    setError(null)
    setFixResult(null)
    
    try {
      const response = await fetch('/api/admin/fix-product-ratings', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Lỗi khi sửa chữa')
      }
      
      const data = await response.json()
      setFixResult(data)
      
      // Refresh check results
      setTimeout(() => {
        checkProductRatings()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sửa chữa đánh giá sản phẩm
        </h1>
        <p className="text-gray-600">
          Kiểm tra và sửa chữa các vấn đề về rating và số lượng đánh giá của sản phẩm
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {fixResult && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {fixResult.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kiểm tra vấn đề</CardTitle>
            <CardDescription>
              Kiểm tra các sản phẩm có rating hoặc reviewCount không chính xác
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkProductRatings}
              disabled={isChecking}
              className="mb-4"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kiểm tra ngay
                </>
              )}
            </Button>

            {checkResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {checkResult.totalProducts}
                    </div>
                    <div className="text-sm text-blue-800">Tổng sản phẩm</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {checkResult.issuesFound}
                    </div>
                    <div className="text-sm text-red-800">Sản phẩm có vấn đề</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {checkResult.totalProducts - checkResult.issuesFound}
                    </div>
                    <div className="text-sm text-green-800">Sản phẩm bình thường</div>
                  </div>
                </div>

                {checkResult.issues.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sản phẩm có vấn đề (10 đầu tiên):</h3>
                    <div className="space-y-2">
                      {checkResult.issues.map((issue, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <div className="font-medium text-gray-900 mb-1">
                            {issue.title}
                          </div>
                          <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Rating:</span> {issue.currentRating} → {issue.expectedRating}
                            </div>
                            <div>
                              <span className="font-medium">Reviews:</span> {issue.currentReviewCount} → {issue.expectedReviewCount}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sửa chữa tự động</CardTitle>
            <CardDescription>
              Cập nhật lại rating và reviewCount cho tất cả sản phẩm dựa trên đánh giá thực tế
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fixProductRatings}
              disabled={isFixing}
              variant="destructive"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang sửa chữa...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sửa chữa ngay
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}