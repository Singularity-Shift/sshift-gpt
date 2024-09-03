'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { FaWallet } from 'react-icons/fa' // Changed from FaDiscord to FaWallet
import { silkscreen } from './fonts'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false) // Changed from isLoggedIn
  const router = useRouter()

  const handleConnectWallet = () => {
    // Implement wallet connection logic here
    console.log("Connect wallet clicked")
    setIsConnected(true)
    // Redirect to chat page
    router.push('/chat')
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      {isConnected && (
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          <span className="text-gray-800 font-semibold">Connected</span>
        </div>
      )}
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center mb-8">
          <div className="relative w-64 h-64 mr-8">
            <Image
              src="/images/sshift-logo-animated.gif"
              alt="SShift GPT Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className={`text-6xl font-bold text-gray-800 leading-tight text-center ${silkscreen.className}`}>
              Welcome to<br />SShift GPT
            </h1>
          </div>
        </div>
        <div className="flex space-x-4">
          {!isConnected ? (
            <Button 
              onClick={handleConnectWallet} 
              className="px-8 py-2 text-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaWallet className="w-6 h-6" />
              <span>Connect Wallet</span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}