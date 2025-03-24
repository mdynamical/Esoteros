import { useState } from 'react'
import './App.css'
import video from './assets/video.mp4'

function MainScreen() {
  return (
    <div className='background'>
        <video className='clip'autoPlay loop muted>
          <source src={video} type="video/mp4"/>
        </video>
      <main>
        <div className='titleDiv'><h1 className='title'>Esoteros</h1></div>
        <h1>The tale never told</h1>
        <div className='inputScreen'>
          <input placeholder='Email'></input>
          <input placeholder='Password'></input>
          <p>Forgot password? <a href="http://localhost:5173/" >   Reset</a></p>  
        </div>
        <div className='loginDiv'>
          <button className='loginButton'> Login </button>
           <p>No account? <a href="http://localhost:5173/">   Register </a></p> 
        </div>
      </main>
    </div>
  )
}

function App() {
  const [count, setCount] = useState(0)
  return (
    MainScreen()
  )
}

export default App


