/**
 * App Component
 * Main application component with React Router setup
 * Handles routing between UploadPage and ReviewPage
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
