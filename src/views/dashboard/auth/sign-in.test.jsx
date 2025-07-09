import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // ✅ Esto hace que Vitest reconozca matchers como toBeInTheDocument
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignIn from './sign-in';
import { MemoryRouter } from 'react-router-dom';

// ✅ Mock de Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true })),
}));

// ✅ Mock de Firebase App
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// ✅ Mock de Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

// ✅ Mock de useNavigate de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
  };
});

describe('Pruebas de inicio de sesión para Vendedor (con Vitest)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('Renderiza correctamente el formulario', () => {
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('Redirige al dashboard si las credenciales son válidas', async () => {
    const { getDocs } = await import('firebase/firestore');

    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: '123',
          data: () => ({
            role: 'admin',
            email: 'admin@test.com',
            password: '1234',
          }),
        },
      ],
    });

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'admin@test.com' },
    });

    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: '1234' },
    });

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(screen.getByText(/exito: inicio de sesión exitoso/i)).toBeInTheDocument();
    });
  });
});
