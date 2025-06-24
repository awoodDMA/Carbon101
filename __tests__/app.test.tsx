import { render, screen } from '@testing-library/react';
import Page from '../app/page';

test('renders hello world', () => {
  render(<Page />);
  expect(screen.getByText(/hello world/i)).toBeInTheDocument();
});
