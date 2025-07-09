import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeleteContracts from '../table/ContractsTable'; // cambia esto al nombre real de tu componente
import { MemoryRouter } from 'react-router-dom';
import { deleteDoc } from 'firebase/firestore';

// ✅ Mock de localStorage.getItem
beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'userId') return 'mockUserId123';
    return null;
  });
});

// ✅ Mock de firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})), // retorna objeto vacío simulado
}));

// ✅ Mock de firebase/firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(), // <--- necesario para que no falle
  doc: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
}));

// ✅ Mock de firebase/storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
}));

// ✅ Importar funciones para que Jest las reconozca
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';

test('Eliminación de contrato por parte del Admin', async () => {
  const mockDeleteDoc = jest.fn();
  deleteDoc.mockImplementation(mockDeleteDoc);

  getDoc
    .mockImplementationOnce(() => Promise.resolve({ // usuario admin
      exists: () => true,
      data: () => ({ role: 'admin' }),
    }))
    .mockImplementationOnce(() => Promise.resolve({ // contrato aprobado
      exists: () => true,
      data: () => ({ approved: false }),
    }))
    .mockImplementationOnce(() => Promise.resolve({ // contrato para eliminar
      exists: () => true,
      data: () => ({
        contractCodeaprov: "0",
        fileUrl: null,
      }),
    }));

  getDocs.mockResolvedValueOnce({
    docs: [
      {
        id: 'contract1',
        data: () => ({
          contractCode: 'ABC123',
          id_vent: 'mockUserId123',
          approved: false,
          client: { name: 'Cliente Test' },
          services: [{ name: 'Servicio Test' }],
        }),
      },
    ],
  });

  render(
    <MemoryRouter>
      <DeleteContracts />
    </MemoryRouter>
  );

  // Paso 1: Click en ícono de eliminar
  const deleteButton = await screen.findByLabelText(/delete/i);
  expect(deleteButton).toBeInTheDocument();
  userEvent.click(deleteButton);

  // Paso 2: Espera que aparezca el modal
  const confirmButton = await screen.findByTestId('confirm-delete-button');
  expect(confirmButton).toBeInTheDocument();

  // Paso 3: Click en "Confirmar Eliminación"
  userEvent.click(confirmButton);

  // Paso 4: Esperar que se llame a deleteDoc
  await waitFor(() => {
    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});

