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
  { id: 'active-pro',    name: 'АктивПро' },
  { id: 'sport-formula', name: 'СпортФормула' },
]

export const LOCATIONS: Location[] = [
  { id: 'reshape',     name: 'Reshape Белорусская',                companyId: 'active-pro',    isActive: true,  initial: 'RБ', color: '#6366f1' },
  { id: 'reshape-ko',  name: 'Reshape Красный октябрь',            companyId: 'active-pro',    isActive: false, initial: 'RБ', color: '#8b5cf6' },
  { id: 'gruzinskaya', name: 'Большая Грузинская ул., 12, стр. 2', companyId: 'active-pro',    isActive: false, initial: 'БГ', color: '#a78bfa' },
  { id: 'sf-reshape',  name: 'Reshape Белорусская',                companyId: 'sport-formula', isActive: false, initial: 'RБ', color: '#10b981' },
]
