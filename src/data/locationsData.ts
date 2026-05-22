export interface Location {
  id: string
  name: string
  companyId: string
  isActive: boolean
  initial: string
  color: string
}

export interface Company {
  id: string
  name: string
}

export const COMPANIES: Company[] = [
  { id: 'svc', name: 'ООО Сервисный дизайн' },
  { id: 'ip', name: 'ИП Петрова М.' },
]

export const LOCATIONS: Location[] = [
  { id: 'reshape',  name: 'Локация «Reshape»',    companyId: 'svc', isActive: true,  initial: 'R', color: '#6366f1' },
  { id: 'fitness',  name: 'Fitness Studio',        companyId: 'svc', isActive: false, initial: 'F', color: '#0ea5e9' },
  { id: 'yoga',     name: 'Yoga Center',           companyId: 'ip',  isActive: false, initial: 'Y', color: '#10b981' },
  { id: 'wellness', name: 'Wellness & Spa',        companyId: 'ip',  isActive: false, initial: 'W', color: '#f59e0b' },
]
