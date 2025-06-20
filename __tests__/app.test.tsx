import { render, screen } from '@testing-library/react';
import Page from '../app/page';
import Providers from '../components/providers';

test('renders project cards', async () => {
  render(
    <Providers>
      <Page />
    </Providers>
  );
  const links = await screen.findAllByRole('link', { name: /enter/i });
  expect(links.length).toBeGreaterThan(0);
});
