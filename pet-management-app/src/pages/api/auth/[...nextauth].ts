/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export default (NextAuth as any)(authOptions)