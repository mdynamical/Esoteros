import video from '/assets/video.mp4'
import '../styles/loginpage.css'

function LoginPage() {
  return (
    <div className='background'>
      <video className='clip'autoPlay loop muted>
        <source src={video} type="video/mp4"/>
      </video>
      <main className="login-grid">
        <div className='titleDiv'><h1 className='title'>Esoteros</h1></div>
        <h1 className="login-subtitle">The tale never told</h1>
        <div className='inputScreen'>
          <input className="login-input" placeholder='Email'></input>
          <input className="login-input" placeholder='Password'></input>
          <p>Forgot password? <a href="/game" >   Reset</a></p>  
        </div>
        <div className='loginDiv'>
          <button className='loginButton'> Login </button>
          <p>No account? <a href="/game">   Register </a></p> 
        </div>
      </main>
    </div>
    )
}

export default LoginPage