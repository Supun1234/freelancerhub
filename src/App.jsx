import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Feed          from './pages/Feed'
import Profile       from './pages/Profile'
import Jobs          from './pages/Jobs'
import Review        from './pages/Review'
import EditProfile   from './pages/EditProfile'
import Notifications from './pages/Notifications'
import Messages      from './pages/Messages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/feed"              element={<Feed />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/edit"      element={<EditProfile />} />
        <Route path="/jobs"              element={<Jobs />} />
        <Route path="/review/:jobId"     element={<Review />} />
        <Route path="/notifications"     element={<Notifications />} />
        <Route path="/messages"          element={<Messages />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App