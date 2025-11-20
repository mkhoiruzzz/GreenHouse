import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function Confirm() {
  const router = useRouter()
  const { token } = router.query
  const [message, setMessage] = useState('Verifying email...')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (error) {
        setMessage('Verification failed. Please try again.')
        return
      }
      
      setMessage('✅ Email verified successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  )
}