import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Confirm() {
  const router = useRouter()
  const { token } = router.query
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    console.log('Token:', token) // Cek di browser console
    
    if (!token) {
      setMessage('❌ No token found in URL')
      return
    }
    
    setMessage(`Token received: ${token}. Verifying...`)
    
    // Redirect ke login dulu (temporary solution)
    setTimeout(() => {
      router.push('/login?verified=true')
    }, 2000)
  }, [token, router])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Email Verification</h1>
      <p>{message}</p>
      {token && (
        <p>
          <small>Token: {token}</small>
        </p>
      )}
    </div>
  )
}