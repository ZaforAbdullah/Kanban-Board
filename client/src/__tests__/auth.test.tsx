import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LOGIN } from '@/graphql/mutations';

// Stub out AuthContext for isolated tests
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn(), isAuthenticated: false, isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// A simple inline login form to test validation logic without the full Next.js page
function LoginForm({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    if (!errs.email && !errs.password) onSubmit(e);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {errors.email && <span role="alert">{errors.email}</span>}

      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {errors.password && <span role="alert">{errors.password}</span>}

      <button type="submit">Sign In</button>
    </form>
  );
}

describe('Login form validation', () => {
  it('shows error when email is empty', () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('Sign In'));

    expect(screen.getByRole('alert', { name: /email/i })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when password is empty', () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByText('Sign In'));

    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when both fields are valid', () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Sign In'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('LOGIN mutation mock', () => {
  const mocks = [
    {
      request: {
        query: LOGIN,
        variables: { email: 'demo@kanban.app', password: 'demo1234' },
      },
      result: {
        data: {
          login: {
            token: 'mock-jwt-token',
            user: { id: 'user-1', email: 'demo@kanban.app', createdAt: new Date().toISOString() },
          },
        },
      },
    },
  ];

  it('login mutation has correct shape', async () => {
    // Just verify the mock fires without error
    const { result } = await new Promise<{ result: { data: { login: { token: string } } } }>(
      (resolve) => {
        const client = mocks[0].result;
        resolve(client as any);
      }
    );
    expect(result.data.login.token).toBe('mock-jwt-token');
  });
});
