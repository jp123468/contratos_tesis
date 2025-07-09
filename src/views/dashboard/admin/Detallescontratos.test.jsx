jest.setTimeout(10000);

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Admin from './admin';

// Mock de Firebase
jest.mock('../../../firebase/firebase_settings', () => ({
  db: {}
}));

// Mock de Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

// Mock del componente PDFGenerator
jest.mock('../pdfgenerator', () => {
  return function MockPDFGenerator() {
    return <div>PDF Generator Mock</div>;
  };
});

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Datos mock para el contrato
const mockContract = {
  id: 'contract123',
  contractCode: 'CON-2024-001',
  date: '15/01/2024',
  approved: false,
  corrections: '',
  observations: 'El cliente quiere el curso de vista, lo más pronto posible',
  observationsadmin: 'Contactar mañana por la tarde',
  valorPactadoHoy: 500000,
  id_vent: 'vendor123',
  ciudad: { label: 'Bogotá' },
  services: [
    { label: 'Licencia' },
    { label: 'Curso de conducción' }
  ],
  paymentMethod: { label: 'Efectivo' },
  photoPago: ['https://example.com/photo1.jpg'],
  client: {
    name: 'Juan',
    lastname: 'Pérez',
    idnumber: '1234567890',
    email: 'juan.perez@email.com',
    phone: '3001234567',
    address: 'Calle 123 #45-67',
    birthdate: '15/05/1990',
    photoFront: 'https://example.com/front.jpg',
    photoBack: 'https://example.com/back.jpg',
    age: 33
  },
  headlines: [
    {
      name: 'María González',
      idNumber: '9876543210',
      photoFront: 'https://example.com/titular-front.jpg',
      photoBack: 'https://example.com/titular-back.jpg'
    }
  ]
};

// Mock de los datos de contratos
const mockContracts = [mockContract];

// Mock de las funciones de Firebase
const { getDocs, collection, query, where } = require('firebase/firestore');

describe('Admin Component - Modal de Detalles del Contrato', () => {
  beforeEach(() => {
    // Configurar localStorage mock
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'userId') return 'admin123';
      if (key === 'currentUser') return JSON.stringify({ id: 'admin123' });
      return null;
    });

    // Mock de getDocs para retornar contratos
    getDocs.mockResolvedValue({
      docs: mockContracts.map(contract => ({
        id: contract.id,
        data: () => contract
      }))
    });

    // Mock de query y where
    query.mockReturnValue({});
    where.mockReturnValue({});
    collection.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('debe mostrar el modal de detalles cuando se hace clic en el botón Detalles', async () => {
    renderWithRouter(<Admin />);

    // Esperar a que se carguen los contratos
    await waitFor(() => {
      expect(screen.getByText('CON-2024-001')).toBeInTheDocument();
    });

    // Hacer clic en el botón Detalles
    const detallesButton = await screen.findByRole('button', {
      name: /ver detalles del contrato/i,
    });
    
    fireEvent.click(detallesButton);
    

    // Verificar que el modal se abre
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  
    expect(screen.getByText('Detalles')).toBeInTheDocument();
  });



});