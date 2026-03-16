import { useState, useRef } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import { REGISTER } from '@/graphql/mutations';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPayload } from '@/types';

export default function RegisterPage() {
  const { login } = useAuth();
  const toast = useRef<Toast>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const [doRegister, { loading }] = useMutation<{ register: AuthPayload }>(REGISTER, {
    onCompleted: (data) => {
      login(data.register.token, data.register.user);
    },
    onError: (err) => {
      toast.current?.show({
        severity: 'error',
        summary: 'Registration failed',
        detail: err.message,
        life: 4000,
      });
    },
  });

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Must be at least 8 characters';
    if (password !== confirm) errors.confirm = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    doRegister({ variables: { email: email.trim().toLowerCase(), password } });
  }

  return (
    <div className="auth-page">
      <Toast ref={toast} />
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="24" height="25" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
            <g fill="#635FC7" fillRule="evenodd">
              <rect width="6" height="25" rx="2" />
              <rect opacity=".75" x="9" width="6" height="25" rx="2" />
              <rect opacity=".5" x="18" width="6" height="25" rx="2" />
            </g>
          </svg>
          <span>kanban</span>
        </div>

        <h1 className="auth-title">Create your account</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email" className="field-label">Email address</label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full ${fieldErrors.email ? 'p-invalid' : ''}`}
              autoComplete="email"
            />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </div>

          <div className="field">
            <label htmlFor="password" className="field-label">Password</label>
            <Password
              inputId="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              toggleMask
              className={`w-full ${fieldErrors.password ? 'p-invalid' : ''}`}
              inputClassName="w-full"
              autoComplete="new-password"
              promptLabel="Enter a password"
              weakLabel="Too short"
              mediumLabel="Medium strength"
              strongLabel="Strong password"
            />
            {fieldErrors.password && (
              <small className="field-error">{fieldErrors.password}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="confirm" className="field-label">Confirm password</label>
            <Password
              inputId="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              feedback={false}
              toggleMask
              className={`w-full ${fieldErrors.confirm ? 'p-invalid' : ''}`}
              inputClassName="w-full"
              autoComplete="new-password"
            />
            {fieldErrors.confirm && (
              <small className="field-error">{fieldErrors.confirm}</small>
            )}
          </div>

          <Button
            type="submit"
            label={loading ? 'Creating account…' : 'Create Account'}
            className="btn-primary w-full"
            loading={loading}
            disabled={loading}
          />
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
