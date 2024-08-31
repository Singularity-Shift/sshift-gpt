'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { FaDiscord } from 'react-icons/fa' // Make sure to install react-icons
import { silkscreen } from './fonts'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleDiscordLogin = () => {
    // Implement Discord OAuth login logic here
    console.log("Discord login clicked")
    setIsLoggedIn(true)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      {isLoggedIn && (
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          <span className="text-gray-800 font-semibold">User</span>
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
          {!isLoggedIn ? (
            <Button 
              onClick={handleDiscordLogin} 
              className="px-8 py-2 text-lg bg-[#5865F2] text-white hover:bg-[#4752C4] flex items-center space-x-2"
            >
              <FaDiscord className="w-6 h-6" />
              <span>Login with Discord</span>
            </Button>
          ) : (
            <Button 
              onClick={() => setIsLoggedIn(false)} 
              className="px-8 py-2 text-lg border-2 border-black bg-white text-black hover:bg-gray-100"
              variant="outline"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}