import LoginPage from './pages/loginpage'
import GamePage from './pages/gamepage'
import { Routes, Route} from 'react-router-dom'


function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/game" element={<GamePage />} />
    </Routes>
  )
}

export default App


