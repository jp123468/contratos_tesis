// In Changecontra.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserList from './user-list';
import { MemoryRouter } from 'react-router-dom';
import { getFirestore, getDocs, doc, updateDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(() => ({})), // Return a mock document reference
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(),
  },
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
}));

describe('UserList - Cambio de contraseña', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'user123');

    // Mock getDocs to return a user named "Juan"
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'user123',
          data: () => ({
            id: 'user123',
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'juan@example.com',
            password: '123456',
            phone: '1234567890',
            role: 'vendedor',
            createdAt: { toDate: () => new Date('2023-01-01') },
          }),
        },
      ],
    });

    // Mock updateDoc to resolve successfully
    updateDoc.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('muestra console.log al cambiar contraseña y guardar', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock doc to return a specific document reference
    const mockDocRef = { id: 'user123' }; // Mock document reference
    doc.mockReturnValue(mockDocRef);

    // Render the component
    await act(async () => {
      render(
        <MemoryRouter>
          <UserList />
        </MemoryRouter>
      );
      jest.runAllTimers();
    });

    // Wait for the user "Juan" to appear in the table
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Find the edit button for Juan
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    const juanEditButton = editButtons[0]; // Assuming Juan is the first user
    await act(async () => {
      fireEvent.click(juanEditButton);
    });

    // Wait for the edit modal to appear
    await waitFor(() => {
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });

    // Find the password input
    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput).toHaveValue('123456');

    // Change the password
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'nuevaPass123' } });
    });

    // Find and click the save button
    const saveButton = screen.getByRole('button', { name: /Guardar/i });
    await act(async () => {
      fireEvent.click(saveButton);
      jest.runAllTimers();
    });

    // Verify that updateDoc was called with the correct arguments
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef, // Expect the mocked document reference
        expect.objectContaining({ password: 'nuevaPass123' })
      );
    });

    // Verify the first console.log


    // Verify the second console.log
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Contraseña actualizada correctamente');
    });

    consoleSpy.mockRestore();
  });
});