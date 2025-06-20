import { render, screen } from '@testing-library/react';
import Page from '../app/page';

test('renders project cards', () => {
  render(<Page />);
  expect(screen.getAllByRole('link', { name: /enter/i }).length).toBeGreaterThan(0);
});
