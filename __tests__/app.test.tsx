import { render, screen } from '@testing-library/react';
import Page from '../app/page';

test('renders heading', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { name: /carbon101/i })).toBeInTheDocument();
});
