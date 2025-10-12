import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transfers from './pages/Transfers'
import Transactions from './pages/Transactions'
import Notifications from './pages/Notifications'

export default function App(){
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/transfers" element={<Transfers/>} />
          <Route path="/transactions" element={<Transactions/>} />
          <Route path="/notifications" element={<Notifications/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
