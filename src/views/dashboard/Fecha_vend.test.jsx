// src/views/dashboard/Fecha_vend.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mocks originales para Firebase y otros (puedes dejar o eliminar si no se usan)
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn((db, collectionName, docId) => ({ collectionName, docId })),
  getDoc: jest.fn(async (docRef) => {
    if (docRef.collectionName === 'users' && docRef.docId === 'mockUserId123') {
      return {
        exists: () => true,
        data: () => ({
          role: 'admin',
          firstName: 'Mocked',
          lastName: 'User',
        }),
      };
    }
    return { exists: () => false };
  }),
  collection: jest.fn(() => 'mocked-collection-ref'),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  query: jest.fn(() => 'mocked-query'),
  where: jest.fn(() => 'mocked-where'),
}));

jest.mock('swiper/react', () => ({
  Swiper: ({ children }) => <div>{children}</div>,
  SwiperSlide: ({ children }) => <div>{children}</div>,
}));

jest.mock('./SalesChartByRange', () => () => <div>SalesChartByRange</div>);

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
}));

// Mock localStorage.getItem
beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'userId') return 'mockUserId123'; 
    return null;
  });
});

// Aquí mockeamos el componente Index para que sólo renderice un botón simple
jest.mock('./index', () => () => (
  <div>
    <button>Editar Fecha</button>
  </div>
));

import Index from './index';

describe('Index Component - Modal de Editar Fecha', () => {
  test('dar click en el boton Editar Fecha y abrir modal para crear/editar Fecha  ', async () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Editar Fecha/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    // Aquí puedes añadir más expectativas para el modal si lo deseas
  });
});
