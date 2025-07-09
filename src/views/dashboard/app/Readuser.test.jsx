// src/views/dashboard/app/UserList.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import UserList from './user-list'; // Asegúrate de que esta ruta es correcta
import '@testing-library/jest-dom';

// Mock de usuarios simulados (mockedUsers)
const mockedUsers = [
  {
    id: 'user1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    password: '123456',
    phone: '0987654321',
    role: 'vendedor',
    createdAt: {
      toDate: () => new Date('2024-01-01'),
    },
  },
  {
    id: 'user2',
    firstName: 'María',
    lastName: 'Gómez',
    email: 'maria@example.com',
    password: 'abcdef',
    phone: '0912345678',
    role: 'admin',
    createdAt: {
      toDate: () => new Date('2024-02-01'),
    },
  },
];
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadString: jest.fn(),
    getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
  }));
describe('UserList Component', () => {
  test('muestra todos los usuarios correctamente', async () => {
    render(<UserList mockedUsers={mockedUsers} />);

    // Verifica que aparezcan nombres, apellidos y correos
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('Pérez')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();

    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('Gómez')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();

    // Verifica roles y teléfonos también
    expect(screen.getByText('vendedor')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('0987654321')).toBeInTheDocument();
    expect(screen.getByText('0912345678')).toBeInTheDocument();
  });
});
