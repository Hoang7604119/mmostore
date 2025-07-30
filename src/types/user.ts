export interface UserData {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  isActive: boolean
  credit: number
  sellerRequest?: {
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: Date
    reviewedAt?: Date
    reviewedBy?: string
    note?: string
    personalInfo?: {
      fullName: string
      phoneNumber: string
      address: string
      idNumber: string
    }
    bankAccount?: {
      bankName: string
      accountNumber: string
      accountHolder: string
      branch?: string
    }
  }
}

export type UserRole = UserData['role']