import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing  from './pages/Landing'
import Login    from './pages/Login'
import Register from './pages/Register'
import Feed     from './pages/Feed'
import Profile  from './pages/Profile'
import Jobs     from './pages/Jobs'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/feed"              element={<Feed />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/jobs"              element={<Jobs />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App