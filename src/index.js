import React from "react";
import ReactDOM from "react-dom/client";
import "./style/index.css"; // Importing global styles
import App from "./Main/App"; // Adjust the path as necessary
import Viewport from "./Main/Viewport"; // Importing Viewport component
import Viewport2 from "./Main/Viewport2"; // Importing Viewport component
import reportWebVitals from "./reportWebVitals";
import {BrowserRouter, Route, Routes} from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/viewport" element={<Viewport />} />
      <Route path="/viewport2" element={<Viewport2 />} />
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
