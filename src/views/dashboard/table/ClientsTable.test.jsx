// src/views/dashboard/table/ClientsTable.test.jsx
import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks de Firebase antes de importar el componente
const mockClient = {
  id: 'mock-client-id',
  data: () => ({
    name: 'Ana',
    lastname: 'González',
    idnumber: '0912345678',
    phone: '0999999999',
    email: 'ana@example.com',
    address: 'Av. América 123',
    birthdate: '1995-06-15',
    photoFront: '',
    photoBack: '',
  }),
};

const mockGetDocs = jest.fn(() =>
  Promise.resolve({
    empty: false,
    docs: [mockClient],
  })
);
const mockUpdateDoc = jest.fn(() => Promise.resolve());

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    })
  ),
  getDocs: mockGetDocs,
  addDoc: jest.fn(() => Promise.resolve({ id: 'user_97eyrgmfq' })),
  updateDoc: mockUpdateDoc,
  deleteDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));

jest.mock('../../../firebase/firebase_settings', () => ({
  db: {},
  storage: {},
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  uploadString: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('mock-url')),
}));

// ✅ Importar el componente después de los mocks
import ClientsTable from './ClientsTable';

beforeEach(() => {
  localStorage.setItem('userId', 'test-user-id');
  jest.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('ClientsTable - Creación de cliente por vendedor', () => {
  it('Permite crear un cliente con datos válidos', async () => {
    render(<ClientsTable />);

    fireEvent.click(screen.getByRole('button', { name: /Add Client/i }));

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/cédula o ruc/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '0987654321' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan.perez@example.com' } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Av. Siempre Viva 1234' } });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), { target: { value: '1990-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByTestId('success-message')).toHaveTextContent('Cliente guardado exitosamente');
  });
});

describe('ClientsTable - Edición de cliente existente', () => {
  it('Abre el modal de edición y actualiza los datos del cliente', async () => {
    render(<ClientsTable />);

    // 🔍 Esperar que aparezca el texto "Ana"
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());

    // 🖱️ Clic en botón Editar
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    // Cambiar el nombre
    const nameInput = await screen.findByLabelText(/nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Ana María' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('success-message')).toHaveTextContent(/actualizado exitosamente/i);
  });
});
