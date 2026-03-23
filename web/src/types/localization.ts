import type { CvData } from './cv'

export interface LocalizedPayload {
  locale?: string
}

export type LocalizedCvData = CvData & LocalizedPayload
