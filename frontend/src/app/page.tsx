import { redirect } from 'next/navigation'

export default async function Home() {
  // Simple redirect to login page
  redirect('/login')
}
