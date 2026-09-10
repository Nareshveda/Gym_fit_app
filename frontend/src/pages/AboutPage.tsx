import React from 'react';
import { GradientButton } from '../components/ui/GradientButton';
import { PublicNavbar } from '../components/layout/PublicNavbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold">About HSP</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          HSP is built to help gym owners and members focus on what matters — better programming, accurate tracking, and a community that drives results.
        </p>

        <div className="mt-8 space-y-4 text-left">
          <p>
            Our philosophy is simple: training should be measurable, coaching should be deliberate, and the environment should make progress inevitable.
          </p>
          <p>
            From group classes that build momentum to premium coaching that sculpts elite performers, HSP delivers tools to manage members, attendances,
            payments, and programming — all in one place.
          </p>
        </div>

        <div className="mt-8">
          <GradientButton onClick={() => (window.location.href = '/contact')}>Contact Us</GradientButton>
        </div>
      </div>
    </div>
  );
}
