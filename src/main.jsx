import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


const Myroot = createRoot(document.getElementById('root'))

Myroot.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
  

