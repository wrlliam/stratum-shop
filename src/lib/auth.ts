import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { FROM_EMAIL, APP_URL, getResend } from '@/lib/resend'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Reset your password — Stratum',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a;">Reset your password</h2>
            <p style="color: #666;">Hi ${user.name},</p>
            <p style="color: #666;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Reset Password</a>
            <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async (data) => {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: data.user.email,
        subject: 'Verify your email — Stratum',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a;">Verify your email address</h2>
            <p style="color: #666;">Hi ${data.user.name},</p>
            <p style="color: #666;">Click the button below to verify your email address and activate your account.</p>
            <a href="${data.url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Verify Email</a>
            <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      })
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        input: false,
      },
      tosAcceptedAt: {
        type: 'date',
        input: true,
      },
      marketingEmails: {
        type: 'boolean',
        defaultValue: true,
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // update session every day
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
  rateLimit: {
    window: 60,
    max: 10,
  },
})

export type Session = typeof auth.$Infer.Session
