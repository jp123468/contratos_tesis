import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientsTable from './ClientsTable';

// Mock de localStorage (para sellerId)
beforeEach(() => {
  Storage.prototype.getItem = jest.fn(() =>
    JSON.stringify({ uid: 'mock-user', email: 'admin@admin.com' })
  );
});

// Datos falsos de clientes
const mockClients = [
  {
    id: 'client1',
    name: 'Juan',
    lastname: 'Pérez',
    idnumber: '1234567890',
    phone: '0987654321',
    email: 'juan@test.com',
    address: 'Calle Falsa 123',
    birthdate: '1990-01-01',
    id_vent: 'mock-user',
  },
];

// Mock de Firestore
jest.mock('firebase/firestore', () => {
  const original = jest.requireActual('firebase/firestore');
  return {
    ...original,
    getFirestore: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn((db, path, id) => ({ path: `${path}/${id}` })),
    deleteDoc: jest.fn(() => Promise.resolve()),
    getDoc: jest.fn((ref) => {
      if (ref?.path?.includes('users')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ role: 'admin' }),
        });
      }
      return Promise.resolve({
        exists: () => false,
      });
    }),
    getDocs: jest.fn(() =>
      Promise.resolve({
        docs: mockClients.map(client => ({
          id: client.id,
          data: () => ({ ...client }),
        })),
      })
    ),
  };
});

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
}));

describe('ClientsTable - Eliminar Cliente', () => {
  it('debe eliminar un cliente cuando se confirma en el modal', async () => {
    render(<ClientsTable />);

    // Verifica que el cliente "Juan" aparezca en la tabla
    await screen.findByText((content, element) =>
      element?.tagName.toLowerCase() === 'td' && content.includes('Juan')
    );

    // Buscar el botón de eliminar
    const deleteButtons = await screen.findAllByLabelText('Delete');
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Hacer clic en el primer botón de eliminar
    fireEvent.click(deleteButtons[0]);

    // Esperar a que se abra el modal
    const confirmText = await screen.findByText(/¿Estás seguro que deseas eliminar/i);
    expect(confirmText).toBeInTheDocument();

    // Hacer clic en el botón "Eliminar" del modal
    const confirmButton = screen.getByRole('button', { name: /eliminar/i });
    fireEvent.click(confirmButton);

    // Esperar mensaje de éxito
    await waitFor(() => {
      expect(screen.getByText(/Cliente eliminado correctamente/i)).toBeInTheDocument();
    });
  });
});
