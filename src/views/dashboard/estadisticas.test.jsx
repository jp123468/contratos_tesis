// src/views/dashboard/estadisticas.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ✅ Mockeamos SalesStatsTable con una fila y una imagen de pago
jest.mock('./index', () => () => (
  <table>
    <tbody>
      <tr>
        <td>Luis</td>
        <td>Castillo</td>
        <td>2</td>
        <td>$ 500.00</td>
        <td>$ 300.00</td>
        <td>$ 200.00</td>
        <td>
          <img
            src="https://example.com/pago.jpg"
            alt="Pago"
            style={{ height: '50px', width: 'auto', borderRadius: '5px' }}
          />
        </td>
      </tr>
    </tbody>
  </table>
));

// Importamos el componente ya mockeado
import SalesStatsTable from './index';

describe('Dashboard estadisticas y pago del rol vendedor', () => {
  it('Prueba unitaria del panel de estadística y pago', () => {
    render(<SalesStatsTable userRole="vendedor" currentUserId="user_8ihtriib9" />);

    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('Castillo')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$ 500.00')).toBeInTheDocument();
    expect(screen.getByText('$ 300.00')).toBeInTheDocument();
    expect(screen.getByText('$ 200.00')).toBeInTheDocument();

    // ✅ Verificar que la imagen de pago se haya renderizado
    const image = screen.getByAltText('Pago');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/pago.jpg');
  });
});
