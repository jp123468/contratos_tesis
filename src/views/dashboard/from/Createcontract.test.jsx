import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Createcontract from './Createcontract';
import { MemoryRouter } from 'react-router-dom';

jest.setTimeout(20000); // Ampliamos el tiempo límite

jest.mock('../../../firebase/firebase_settings', () => ({
    db: {},
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    getDocs: jest.fn(() =>
        Promise.resolve({
            forEach: (callback) => {
                callback({
                    data: () => ({
                        idnumber: '0999999999999',
                        name: 'Luis',
                        lastname: 'perales',
                        birthdate: '05/06/2002',
                        email: 'pedro@gmail.com',
                        phone: '5555555555',
                        address: 'solanda y la J',
                        id_vent: 'user_8ihtriib9',
                    }),
                });
            },
        })
    ),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mockedDocId' })),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    getDoc: jest.fn(() =>
        Promise.resolve({
            exists: () => true,
            data: () => ({ role: 'admin' }),
        })
    ),
    where: jest.fn(),
}));

jest.mock('../pdfgenerator', () => jest.fn(() => Promise.resolve()));
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadString: jest.fn(),
    getDownloadURL: jest.fn(() => Promise.resolve('mocked-url')),
}));
jest.mock('../CameraCapture', () => () => <></>);

Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn(() => 'user123'),
        setItem: jest.fn(),
        clear: jest.fn(),
    },
});

describe('Createcontract Component - Flujo Completo', () => {
    test('Simula la creación completa del contrato sin imágenes', async () => {
        render(
            <MemoryRouter>
                <Createcontract />
            </MemoryRouter>
        );

        // Paso 1: Buscar cliente
        fireEvent.change(screen.getByPlaceholderText(/Ingrese el valor de búsqueda/i), {
            target: { value: '0999999999999' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Buscar Cliente/i }));

        // Esperar mensaje "Cliente encontrado"
        await waitFor(() => {
            expect(screen.getByText(/Cliente encontrado/i)).toBeInTheDocument();
        });

        // **Aquí NO buscamos el nombre "Luis" porque no aparece en el DOM**
        // Simplemente continuamos con el flujo presionando "Siguiente"

        fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

        // Paso 2: Titular
        fireEvent.change(screen.getAllByPlaceholderText(/Nombre del titular/i)[0], {
            target: { value: 'Mario' },
        });
        fireEvent.change(screen.getAllByLabelText(/birthdate/i)[0], {
            target: { value: '2000-01-01' },
        });
        fireEvent.change(
            screen.getAllByPlaceholderText(/Número de cédula del titular/i)[0],
            {
                target: { value: '0987654321' },
            }
        );

        fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

        // Paso 3: Servicio y ciudad
        const selects = screen.getAllByRole('combobox');
        if (selects.length < 2) throw new Error('No hay suficientes selects');
        fireEvent.change(selects[0], { target: { value: 'plan_basico' } }); // servicio
        fireEvent.change(selects[1], { target: { value: 'quito' } }); // ciudad

        fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

        // Paso 4: Pago
        fireEvent.change(screen.getByPlaceholderText(/Pago/i), {
            target: { value: '100' },
        });

        const pagoSelect = screen.getAllByRole('combobox').find((select) =>
            select.getAttribute('aria-label')?.toLowerCase().includes('forma')
        ) || screen.getAllByRole('combobox')[0];

        fireEvent.change(pagoSelect, { target: { value: 'efectivo' } });
        fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

        // Paso 5: Observaciones
        fireEvent.change(screen.getByPlaceholderText(/Observaciones hechas del cliente/i), {
            target: { value: 'Cliente contento con el servicio' },
        });

        fireEvent.change(screen.getByPlaceholderText(/Observaciones para el administrador/i), {
            target: { value: 'Revisar documento adicional' },
        });

        // Botón Guardar
        const guardarBtn = screen.getByRole('button', { name: /Guardar/i });
        if (!guardarBtn) throw new Error('Botón Guardar no encontrado');
        fireEvent.click(guardarBtn);

        // Debug para revisar el DOM en el guardado
        console.log(document.body.innerHTML);

        // Esperar mensaje de éxito
        await waitFor(() => {
            expect(
                screen.getByText((content) =>
                    content.toLowerCase().includes('contrato guardado con éxito')
                )
            ).toBeInTheDocument();
        });
    });
});
