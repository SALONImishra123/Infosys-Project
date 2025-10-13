import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Auth.css';

// FontAwesome React imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (!result.success) {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
          <p>
            {isLogin 
              ? 'Welcome back to NLU Trainer' 
              : 'Start training your NLU models'
            }
          </p>
        </div>

        <div className="auth-body">
          {error && <ErrorMessage message={error} />}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-group">
                  <FontAwesomeIcon icon={faUser} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <div className="auth-loading">
                  <LoadingSpinner size="small" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="link-button"
              >
                {isLogin ? 'Create New Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
