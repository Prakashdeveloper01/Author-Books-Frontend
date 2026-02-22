import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Forgot from './pages/Auth/Forgot';
import AuthorDashboard from './modules/Author/Dashboard';
import ReaderDashboard from './modules/Reader/Dashboard';
import ReaderBooksList from './modules/Reader/BooksList';
import Profile from './pages/Profile/Profile';
import DashboardLayout from './components/layout/DashboardLayout';
import './App.css';
import BooksList from './modules/Author/BooksList';
import BookEditor from './modules/Author/BookEditor';
import BookReader from './pages/Reader/BookReader';
import Settings from './pages/Settings/Settings';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Placeholder for sub-routes
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '2rem' }}>
    <h1>{title}</h1>
    <p>This feature is coming soon.</p>
  </div>
);

const AuthorRoute = ({ title, component: Component }) => (
  <DashboardLayout role="author">
    {Component ? <Component role="author" /> : <PlaceholderPage title={title} />}
  </DashboardLayout>
);

const ReaderRoute = ({ title, component: Component }) => (
  <DashboardLayout role="reader">
    {Component ? <Component role="reader" /> : <PlaceholderPage title={title} />}
  </DashboardLayout>
);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<Forgot />} />

              {/* Universal Read Route (No Layout, Full Focus) */}
              <Route path="/read/:uuid" element={<BookReader />} />

              {/* Author Routes */}
              <Route path="/author-dashboard" element={<AuthorDashboard />} />
              <Route path="/author/books" element={<AuthorRoute title="My Library" component={BooksList} />} />
              <Route path="/author/books/new" element={<AuthorRoute title="Create Book" component={BookEditor} />} />
              <Route path="/author/books/:uuid" element={<AuthorRoute title="Edit Book" component={BookEditor} />} />
              <Route path="/author/profile" element={<AuthorRoute title="Author Profile" component={Profile} />} />

              {/* Reader Routes */}
              <Route path="/reader-dashboard" element={<ReaderDashboard />} />
              <Route path="/reader/books" element={<ReaderBooksList />} />
              <Route path="/reader/library" element={<ReaderRoute title="My Library" />} />
              <Route path="/reader/profile" element={<ReaderRoute title="Reader Profile" component={Profile} />} />
              <Route path="/reader/settings" element={<ReaderRoute title="Settings" component={Settings} />} />

              {/* Shared */}
              <Route path="/author/settings" element={<AuthorRoute title="Settings" component={Settings} />} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
