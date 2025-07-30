export const PRODUCT_TYPES = [
  { 
    key: 'facebook', 
    name: 'Facebook Account',
    description: 'Tài khoản Facebook chất lượng cao',
    color: 'bg-blue-500'
  },
  { 
    key: 'gmail', 
    name: 'Gmail Account',
    description: 'Tài khoản Gmail Google',
    color: 'bg-red-500'
  },
  { 
    key: 'hotmail', 
    name: 'Hotmail Account',
    description: 'Tài khoản Hotmail/Outlook',
    color: 'bg-blue-600'
  },
  { 
    key: 'x', 
    name: 'X (Twitter) Account',
    description: 'Tài khoản X (Twitter)',
    color: 'bg-black'
  },
  { 
    key: 'openai', 
    name: 'OpenAI Account',
    description: 'Tài khoản OpenAI ChatGPT',
    color: 'bg-green-600'
  }
] as const

export type ProductTypeKey = typeof PRODUCT_TYPES[number]['key']

export function getProductTypeInfo(key: string) {
  return PRODUCT_TYPES.find(type => type.key === key)
}

export function getProductTypeName(key: string): string {
  const type = getProductTypeInfo(key)
  return type ? type.name : key
}

export function getProductTypeColor(key: string): string {
  const type = getProductTypeInfo(key)
  return type ? type.color : 'bg-gray-500'
}