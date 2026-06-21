import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children, user, onAuthClick, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar user={user} onAuthClick={onAuthClick} onLogout={onLogout} />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  )
}
