// Định nghĩa tất cả các role trong hệ thống
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  SELLER: 'seller',
  BUYER: 'buyer'
} as const

// Type cho role
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Danh sách tất cả các role
export const ALL_ROLES = Object.values(USER_ROLES)

// Hàm lấy tên hiển thị của role
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN: return 'Quản trị viên'
    case USER_ROLES.MANAGER: return 'Quản lý'
    case USER_ROLES.SELLER: return 'Người bán'
    case USER_ROLES.BUYER: return 'Người mua'
    default: return role
  }
}

// Hàm lấy màu sắc cho role
export const getRoleColor = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN: return 'bg-red-100 text-red-800'
    case USER_ROLES.MANAGER: return 'bg-purple-100 text-purple-800'
    case USER_ROLES.SELLER: return 'bg-green-100 text-green-800'
    case USER_ROLES.BUYER: return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Hàm lấy màu sắc cho role với border
export const getRoleColorWithBorder = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN: return 'bg-red-100 text-red-800 border-red-200'
    case USER_ROLES.MANAGER: return 'bg-purple-100 text-purple-800 border-purple-200'
    case USER_ROLES.SELLER: return 'bg-green-100 text-green-800 border-green-200'
    case USER_ROLES.BUYER: return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Kiểm tra role có hợp lệ không
export const isValidRole = (role: string): role is UserRole => {
  return ALL_ROLES.includes(role as UserRole)
}

// Kiểm tra user có quyền admin không
export const isAdmin = (role: string): boolean => {
  return role === USER_ROLES.ADMIN
}

// Kiểm tra user có quyền manager không
export const isManager = (role: string): boolean => {
  return role === USER_ROLES.MANAGER
}

// Kiểm tra user có quyền seller không
export const isSeller = (role: string): boolean => {
  return role === USER_ROLES.SELLER
}

// Kiểm tra user có quyền buyer không
export const isBuyer = (role: string): boolean => {
  return role === USER_ROLES.BUYER
}

// Kiểm tra user có quyền quản lý (admin hoặc manager)
export const isManagerOrAdmin = (role: string): boolean => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER
}

// Lấy danh sách role có thể thay đổi bởi manager
export const getManagerChangeableRoles = (): UserRole[] => {
  return [USER_ROLES.BUYER, USER_ROLES.SELLER]
}

// Lấy danh sách tất cả role cho admin
export const getAllRolesForAdmin = (): UserRole[] => {
  return ALL_ROLES
}