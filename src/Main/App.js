import {useNavigate} from "react-router-dom";
import logo from "../logo.svg";
import "../style/App.css";

function App() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/viewport");
  };
  const handleClick2 = () => {
    navigate("/viewport2");
  };
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>

        <button onClick={handleClick}>Click me</button>
        <button onClick={handleClick2}>Click me 2</button>
      </header>
    </div>
  );
}

export default App;
