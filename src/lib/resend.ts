import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@stratum.store'
export const APP_NAME = process.env.APP_NAME || 'Stratum'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
