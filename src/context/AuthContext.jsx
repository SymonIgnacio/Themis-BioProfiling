import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/profile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Map role_id to role string
          const roleMap = {
            1: 'admin',
            2: 'officer',
            3: 'visitor'
          };
          
          // Add role string to userData
          const userData = {
            ...response.data,
            role: roleMap[response.data.role_id] || 'visitor'
          };
          
          setCurrentUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });
      
      const { token, ...userData } = response.data;
      
      // Map role_id to role string
      const roleMap = {
        1: 'admin',
        2: 'officer',
        3: 'visitor'
      };
      
      // Add role string to userData
      const enhancedUserData = {
        ...userData,
        role: roleMap[userData.role_id] || 'visitor'
      };
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(enhancedUserData);
      
      return { 
        success: true
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (username, password, email, fullName, firstName, lastName) => {
    try {
      await axios.post('http://localhost:5000/api/signup', {
        username,
        password,
        email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};