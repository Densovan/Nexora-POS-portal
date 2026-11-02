import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ hasFeature: vi.fn() }));

afterEach(() => cleanup());

vi.mock('@nexora/auth', () => ({
  useAuth: () => ({
    hasFeature: mocks.hasFeature,
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { RequireFeature } from './RequireFeature';

describe('RequireFeature', () => {
  it('renders the POS screens when the plan includes POS', () => {
    mocks.hasFeature.mockReturnValue(true);

    render(
      <RequireFeature feature="POS">
        <p>POS content</p>
      </RequireFeature>,
    );

    expect(screen.getByText('POS content')).toBeInTheDocument();
  });

  it('blocks every POS screen when the plan excludes POS', () => {
    mocks.hasFeature.mockReturnValue(false);

    render(
      <RequireFeature feature="POS">
        <p>POS content</p>
      </RequireFeature>,
    );

    expect(
      screen.getByRole('heading', { name: 'This plan does not include POS' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('POS content')).not.toBeInTheDocument();
  });
});
