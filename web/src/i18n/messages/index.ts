import { enMessages, type MessageCatalog, type MessageKey } from './en'
import { deMessages } from './de'
import { huMessages } from './hu'

export const messages: Record<string, Partial<MessageCatalog>> = {
  en: enMessages,
  de: deMessages,
  hu: huMessages,
}

export { enMessages }
export type { MessageCatalog, MessageKey }
