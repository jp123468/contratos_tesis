it('muestra console.log al cambiar contraseña y guardar', async () => {
  jest.useFakeTimers(); // Simula el paso del tiempo
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  const editButton = screen.getAllByLabelText('Edit')[0];
  fireEvent.click(editButton);

  await waitFor(() => {
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });

  const passwordInput = screen.getByTestId('password-input');
  fireEvent.change(passwordInput, { target: { value: 'nuevaPass123' } });

  const saveButton = screen.getAllByText('Guardar')[0];
  fireEvent.click(saveButton);

  // Simular 1.5 segundos (1500 ms)
  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(consoleSpy).toHaveBeenCalledWith('Contraseña actualizada correctamente');

  consoleSpy.mockRestore();
  jest.useRealTimers();
});
