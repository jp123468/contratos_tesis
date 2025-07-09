// src/views/dashboard/users/UserList.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserList from './user-list';
import '@testing-library/jest-dom';

// Mock react-icons para evitar errores
jest.mock('react-icons/fa', () => ({
  FaTrash: () => <span data-testid="icon-delete">🗑</span>,
  FaEdit: () => <span data-testid="icon-edit">✏️</span>,
  FaPlus: () => <span data-testid="icon-plus">➕</span>,
  FaEye: () => <span>👁️</span>,
  FaEyeSlash: () => <span>🚫</span>,
}));

// Mocks de Firebase
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    getFirestore: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ empty: true })), // Simula que no hay contratos
    deleteDoc: jest.fn(() => Promise.resolve()), // Simula eliminación exitosa
    doc: jest.fn(),
    getDoc: jest.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({
          role: 'vendedor',
          id: 'user_test',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
          password: '123456',
          phone: '0987654321',
          createdAt: { toDate: () => new Date() },
        }),
      })
    ),
  };
});

// Mocks básicos de Firebase App    
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadString: jest.fn(),
    getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
}));
// Simulación de localStorage
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: () => 'user_test', // usuario logueado
    },
    writable: true,
  });
});

test('elimina un usuario correctamente', async () => {
  const mockedUser = {
    id: 'user_test',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    password: '123456',
    phone: '0987654321',
    role: 'vendedor',
    createdAt: { toDate: () => new Date() },
  };

  render(<UserList mockedUsers={[mockedUser]} />);
  screen.debug(); // 👈 imprime el DOM renderizado en consola
  

  // ✅ Esperar a que el usuario aparezca en la tabla
  await screen.findByText(/juan/i); // insensible a mayúsculas/minúsculas


  const deleteButtons = screen.getAllByTestId('icon-delete');
  fireEvent.click(deleteButtons[0]);

  expect(await screen.findByText(/¿Estás seguro de que deseas eliminar/)).toBeInTheDocument();

  const confirmButton = screen.getByText('Confirmar Eliminación');
  fireEvent.click(confirmButton);

  await screen.findByText(/Usuario eliminado correctamente/);
});

  