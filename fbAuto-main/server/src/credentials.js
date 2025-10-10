import dotenv from 'dotenv'

dotenv.config()

export const PORT = parseInt(process.env.PORT, 10) || 5000
export const NODE_ENV = process.env.NODE_ENV || "development"
export const JWT_SECRET = process.env.JWT_SECRET || "hrdashboard"