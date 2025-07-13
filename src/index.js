// /src/index.js
// This file is the entry point for the React application.
// It imports the necessary styles and renders the main App component into the root element of the HTML document.
// It uses ReactDOM to create a root and render the App component wrapped in React.StrictMode.
// This setup ensures that the application is ready for development and production builds with React's best practices.
// It is essential for initializing the React application and providing a consistent structure for rendering components.

import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
