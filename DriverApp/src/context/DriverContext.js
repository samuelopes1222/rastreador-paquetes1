import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import driverService from '../services/DriverService';

// Estado inicial
const initialState = {
  isAuthenticated: false,
  driver: null,
  currentLocation: null,
  activeOrder: null,
  isOnline: false,
  loading: false,
  error: null
};

// Tipos de acciones
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_LOCATION: 'UPDATE_LOCATION',
  SET_ACTIVE_ORDER: 'SET_ACTIVE_ORDER',
  CLEAR_ACTIVE_ORDER: 'CLEAR_ACTIVE_ORDER',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS'
};

// Reducer
function driverReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        driver: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        driver: null,
        activeOrder: null,
        isOnline: false
      };
    case ActionTypes.UPDATE_LOCATION:
      return { ...state, currentLocation: action.payload };
    case ActionTypes.SET_ACTIVE_ORDER:
      return { ...state, activeOrder: action.payload };
    case ActionTypes.CLEAR_ACTIVE_ORDER:
      return { ...state, activeOrder: null };
    case ActionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    default:
      return state;
  }
}

// Contexto
const DriverContext = createContext();

// Provider
export function DriverProvider({ children }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const driverData = await AsyncStorage.getItem('driver_data');

      if (token && driverData) {
        const driver = JSON.parse(driverData);
        dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: driver });
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  // Acciones
  const login = async (cedula, password, navigation) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      // Llamada real a la API
      const response = await fetch('http://localhost:5000/api/drivers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cedula, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('driver_token', data.token);
      await AsyncStorage.setItem('driver_data', JSON.stringify(data.driver));

      dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: data.driver });

      // Navegar a la pantalla principal
      if (navigation) {
        navigation.replace('Home');
      }
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('driver_token');
    await AsyncStorage.removeItem('driver_data');
    dispatch({ type: ActionTypes.LOGOUT });
  };

  const updateLocation = async (location) => {
    dispatch({ type: ActionTypes.UPDATE_LOCATION, payload: location });

    // Si está online, enviar ubicación al servidor
    if (state.isOnline && state.driver?.id) {
      try {
        await driverService.updateDriverLocation(state.driver.id, location);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }
  };

  const setActiveOrder = (order) => {
    dispatch({ type: ActionTypes.SET_ACTIVE_ORDER, payload: order });
  };

  const clearActiveOrder = () => {
    dispatch({ type: ActionTypes.CLEAR_ACTIVE_ORDER });
  };

  const setOnlineStatus = (status) => {
    dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: status });
  };

  const value = {
    ...state,
    login,
    logout,
    updateLocation,
    setActiveOrder,
    clearActiveOrder,
    setOnlineStatus
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
}

// Hook personalizado
export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
}