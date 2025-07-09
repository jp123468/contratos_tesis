import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ClientsTable from './ClientsTable';
import '@testing-library/jest-dom';

beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'userId') return 'mock-user'; 
    return null;
  });
});
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadString: jest.fn(),
    getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
  }));

describe('ClientsTable - Mostrar Clientes', () => {
  const mockedClients = [
    {
      id: 'client1',
      name: 'Juan',
      lastname: 'Pérez',
      idnumber: '1234567890',
      phone: '0987654321',
      id_vent: 'mock-user',
    },
    {
      id: 'client2',
      name: 'Ana',
      lastname: 'Gómez',
      idnumber: '0987654321',
      phone: '0123456789',
      id_vent: 'mock-user',
    },
  ];

  it('muestra los clientes correctamente en la tabla', async () => {
    render(<ClientsTable mockedClients={mockedClients} />);

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.getByText('Ana')).toBeInTheDocument();
      expect(screen.getByText('Gómez')).toBeInTheDocument();
    });
  });
});
